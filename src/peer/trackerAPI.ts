import axios from "axios";
import readline from "readline";
import dotenv from "dotenv";
import { Peer, File } from "../types";

import { createPieceHashes } from "./createPieceHashes";
import { checkFileExists, getFileSize } from "./fileService";
import { loadFilePieces } from "./filePiecesManager";
import ProgressBar from "progress";

dotenv.config();
class TrackerAPI {
  static async getFiles() {
    try {
      const res = await axios.get(`${process.env.API_URL}/torrentfile`);
      return res.data;
    } catch (err: any) {
      console.error(err.message);
      return [];
    }
  }

  static async registerPeer(ip: string, port: number) {
    let peer: Peer | null = null;

    await axios
      .post(`${process.env.API_URL}/peer/register`, { ip, port })
      .then((res) => {
        peer = res.data;
        console.log("Peer registered successfully!");
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          // Kiểm tra nếu mã lỗi là 400
          console.error("Error:", error.response.data.message); // Sẽ hiển thị "Peer already registered"
        } else {
          // Xử lý các lỗi khác
          console.error("Unexpected error:", error.message);
        }
      });
    return peer;
  }
  // Đăng kí file với tracker
  static async registerFile(peer: Peer, fileName: string, port: string) {
    try {
      const filePath = `${process.env.FILE_PATH}/${port}/${fileName}`;
      const isFileExist = await checkFileExists(filePath);
      const pieceSize = 64 * 1024;

      if (isFileExist) {
        const fileSize = await getFileSize(filePath);
        // Chia file thành các phần (pieces) và lưu vào thư mục
        await loadFilePieces(filePath, pieceSize);
        await axios
          .post(`${process.env.API_URL}/torrentfile/register`, {
            filename: fileName,
            size: fileSize,
            pieceSize,
          })
          .then(async (res) => {
            const { hashes, sizes } = await createPieceHashes(
              filePath,
              pieceSize
            );
            const bar = new ProgressBar(
              "[:bar] :percent Registering :filename #:idx with size :size Bytes successfully",
              {
                total: hashes.length,
                width: 20,
                complete: "#",
                incomplete: "-",
              }
            );

            for (let i = 0; i < hashes.length; i++) {
              try {
                await axios.post(`${process.env.API_URL}/piece/register`, {
                  hash: hashes[i],
                  torrentFileId: res.data.id,
                  size: sizes[i],
                  index: i,
                  peerId: peer.id,
                });
              } catch (err: any) {
                if (err.response && err.response.status === 400) {
                } else {
                  console.error("Unexpected error: Internal Server Error");
                }
              }
              bar.tick({ idx: i, size: sizes[i], filename: fileName });
            }
            console.log("Torrent file registered successfully!");
          })
          .catch((error) => {
            if (error.response && error.response.status === 400) {
              console.error("Error:", error.response.data.message);
            } else {
              console.error("Unexpected error: Internal Server Error");
            }
          });
      } else {
        console.log("File does not exist");
      }
    } catch (e: any) {
      console.error("Error:", e.message);
    }
  }

  static async startPeer(ip: string, port: number) {
    let peer: Peer | null = null;
    await axios
      .patch(`${process.env.API_URL}/peer/update`, {
        port: port,
        ip: ip,
        isOnline: true,
      })
      .then((res) => {
        peer = res.data;
        // peer.id = res.data.id;
        // peer.upload = res.data.upload;
        // peer.download = res.data.download;
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          console.error("Error:", error.response.data.message);
        } else {
          console.error("Unexpected error: Internal server error");
        }
      });
    return peer;
  }

  static async getPeersFromFilename(rl: readline.Interface): Promise<any> {
    return new Promise((resolve, reject) => {
      // Get filename from input
      rl.question("Enter filename: ", async (filename) => {
        try {
          const res = await axios.get(
            `${process.env.API_URL}/file/get/${filename}`
          );
          console.log(res.data);
          resolve(res.data); // Trả về dữ liệu từ API
        } catch (err: any) {
          console.error(err.message);
          reject(err); // Nếu có lỗi, reject promise
        }
      });
    });
  }
}

export default TrackerAPI;
