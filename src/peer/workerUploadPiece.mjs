import { parentPort } from "worker_threads";
import fs from "fs/promises";
import path from "path";

import axios from "axios";

// Handle the message from the main server thread
parentPort.on("message", (data) => {
  const { socket } = data;

  // Listen for incoming data from the client in this worker
  socket.on("data", async (receivedData) => {
    try {
      const message = JSON.parse(receivedData.toString().trim());
      if (
        message.action === "download" &&
        typeof message.pieceIndex === "number" &&
        typeof message.filename === "string"
      ) {
        const index = message.pieceIndex;
        const filename = message.filename;

        // Extract filename and prepare the file path
        const extractedFilename = path.basename(
          filename,
          path.extname(filename)
        );
        const pieceFilePath = `${process.env.FILE_PATH}/${extractedFilename}/piece_${index}.bin`;

        // Read the requested file piece
        try {
          const pieceData = await fs.readFile(pieceFilePath);
          socket.write(pieceData);
          console.log(
            `Sent piece ${filename}#${index} with size ${pieceData.length} Bytes successfully`
          );

          // Update peer upload stats (this can be replaced with your actual logic)
          // For example, calling an API to update the upload data:
          await axios.patch(`${process.env.API_URL}/peer/update`, {
            upload: pieceData.length,
          });
        } catch (fileError) {
          console.error("Error reading piece file:", fileError.message);
          socket.write("ERROR: Failed to read file piece");
        }
      } else {
        console.log("Received unknown command:", message);
      }
    } catch (error) {
      console.log("Failed to parse message:", receivedData.toString());
    }
  });

  // Clean up resources when the connection ends
  socket.on("end", () => {
    console.log("Connection closed in worker");
  });

  socket.on("error", (err) => {
    console.error("Worker socket error:", err);
  });
});
