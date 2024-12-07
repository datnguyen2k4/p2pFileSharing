import { parentPort, workerData } from "worker_threads";
import axios from "axios";
import net from "net";

import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const saveFilePiece = async (filePath, index, piece) => {
  // Tạo thư mục nếu chưa tồn tại
  const dirPath = path.dirname(filePath); // Lấy đường dẫn thư mục cha
  const baseName = path.basename(filePath, path.extname(filePath)); // Lấy tên file không có phần mở rộng
  // console.log(dirPath);

  const newDirPath = path.join(dirPath, baseName); // Tạo đường dẫn mới cho thư mục
  await mkdir(newDirPath, { recursive: true });
  const pieceFilePath = path.join(newDirPath, `piece_${index}.bin`); // Tên file cho từng piece
  await writeFile(pieceFilePath, piece);
};

// Hàm tải xuống một phần (piece) của tệp từ một peer
const downloadPieceFromPeer = async (peer, pieceIndex, filename, hash) => {
  return new Promise((resolve) => {
    const client = net.createConnection(
      { port: peer.port, host: peer.ip },
      () => {
        // console.log(
        //   `Connected to peer ip:${peer.ip}, port:${peer.port} to download #${pieceIndex}`
        // );

        // Yêu cầu peer gửi phần của tệp
        client.write(
          JSON.stringify({ action: "download", pieceIndex, filename })
        );

        client.on("data", (data) => {
          //console.log(data.toString());
          const message = data.toString();
          // Lưu phần tải xuống vào tệp
          if (message.startsWith("ERROR:")) {
            resolve({ data: null, isSuccess: false });
            client.end();
            return; // Thoát khỏi callback
          }

          resolve({ data, isSuccess: true });
          client.end();
        });
      }
    );

    client.on("error", (err) => {
      resolve({ data: null, isSuccess: false }); // Trả về false khi có lỗi kết nối
      client.end();
    });
  });
};

const handlePieceDownload = async () => {
  const { piece, myPeer, filename, filePath, pieceIndex } = workerData;

  const peersResponse = await axios.get(
    `${process.env.API_URL}/piece/peer/${piece.hash}`
  );

  const peers = peersResponse.data;

  if (!peers || peers.length === 0) {
    console.log(`No peer found for piece ${pieceIndex}`);
    parentPort?.postMessage({
      data,
      success: false,
      pieceIndex: piece.index,
    });
    return;
  }

  // sort peers by upload from smallest to largest
  // peers.sort((a, b) => a.upload - b.upload);

  let isSuccess = false;
  let data = null;
  let peer = null;
  for (let i = 0; i < peers.length && !isSuccess; i++) {
    // Chọn một peer ngẫu nhiên để tải xuống
    peer = peers[(pieceIndex + i) % peers.length];

    //peer = peers[i];
    //#1: [3001, 3002 ,3003,3005]
    //#2: [3001, 3002 ,3003]
    //#3: [3001, 3002 ,3003]
    //#4: [3001, 3002 ,3003]

    //console.log(peer);
    if (peer.port === myPeer.port && peer.ip === myPeer.ip) {
      continue;
    }
    ({ data, isSuccess } = await downloadPieceFromPeer(
      peer,
      pieceIndex,
      filename,
      filePath,
      piece.hash
    )); // Sử dụng await để đảm bảo thứ tự

    if (!isSuccess) {
      continue; // Thử tải xuống từ peer tiếp theo nếu có lỗi
    }

    await saveFilePiece(filePath, pieceIndex, data);

    try {
      await axios.post(`${process.env.API_URL}/piece/register`, {
        hash: piece.hash,
        torrentFileId: piece.torrentid,
        size: piece.size,
        index: piece.index,
        peerId: myPeer.id,
      });
    } catch (err) {
      if (err.response && err.response.status === 400) {
      } else {
        console.error("Unexpected error: Internal server error");
      }
    }

    myPeer.download =
      (parseInt(myPeer.download.toString()) || 0) +
      (parseInt(piece.size.toString()) || 0);
    axios
      .patch(`${process.env.API_URL}/peer/update`, {
        port: myPeer.port,
        ip: myPeer.ip,
        download: myPeer.download,
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          // Kiểm tra nếu mã lỗi là 400
          console.error("Error:", error.response.data.message);
        } else {
          // Xử lý các lỗi khác
          console.error("Unexpected error:", error.message);
        }
      });
  }

  parentPort?.postMessage({
    data: data,
    success: isSuccess,
    pieceIndex: piece.index,
    ip: peer.ip,
    port: peer.port,
  });
};

handlePieceDownload();
