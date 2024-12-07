import net from "net";
import fs from "fs/promises";
import path from "path";
import { Peer } from "../types";
import axios from "axios";
import { checkFileExists } from "./fileService";

// Hàm tạo server peer
export const createPeerServer = (peer: Peer) => {
  const server = net.createServer((socket: net.Socket) => {
    // Concurrency not parrallel
    socket.on("data", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString().trim());
        if (
          message.action === "download" &&
          typeof message.pieceIndex === "number" &&
          typeof message.filename === "string" // Kiểm tra fileId
        ) {
          const index = message.pieceIndex;
          const filename = message.filename;

          // Extract the filename without the domain and extension
          const extractedFilename = path.basename(
            filename,
            path.extname(filename)
          );

          // Xác định đường dẫn đến file piece
          const pieceFilePath = `${process.env.FILE_PATH}/${peer.port}/${extractedFilename}/piece_${index}.bin`; // Tạo đường dẫn đến file piece

          try {
            // Đọc phần dữ liệu từ file
            // Check if the piece of file exists
            if (!(await checkFileExists(pieceFilePath))) {
              console.log(`Piece ${filename}#${index} does not exist`);
              // Delete the piece peer from the database
              const deletePeerPiece = await axios.delete(
                `${process.env.API_URL}/piece/delete`,
                {
                  data: {
                    ip: peer.ip,
                    port: peer.port,
                    filename: filename,
                    index: index,
                  },
                }
              );
              socket.write("ERROR: Piece does not exist");
              return;
            }

            const pieceData = await fs.readFile(pieceFilePath);

            // Gửi phần dữ liệu (piece) cho client
            socket.write(pieceData);
            console.log(
              `Sent piece ${filename}#${index} with size ${pieceData.length} Bytes successfully`
            );

            peer.upload = Number(peer.upload) + pieceData.length;

            await axios
              .patch(`${process.env.API_URL}/peer/update`, {
                port: peer.port,
                ip: peer.ip,
                upload: peer.upload,
              })
              .catch((error) => {
                if (error.response && error.response.status === 400) {
                  console.error("Error:", error.response.data.message);
                } else {
                  console.error("Unexpected error:", error.message);
                }
              });
          } catch (fileError: unknown) {
            // Kiểm tra kiểu lỗi và lấy thông tin
            if (fileError instanceof Error) {
              console.error("Error reading piece file:", fileError.message);
            } else {
              console.error("Error reading piece file: Unknown error");
            }
            socket.write("ERROR: Failed to read piece file");
          }
        } else {
          console.log("Received unknown command:", message);
        }
      } catch (error) {
        console.log("Failed to parse message:", data.toString());
      }
    });
  });

  server.listen(peer.port, () => {
    console.log(`Peer listening on port ${peer.port}`);
  });

  return server;
};
