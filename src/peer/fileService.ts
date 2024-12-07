import { access, stat } from "fs/promises"; // Import các hàm từ fs/promises
import path from "path";

// Hàm kiểm tra file có tồn tại hay không
export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch (err) {
    return false;
  }
};

// Hàm lấy kích thước của file
export const getFileSize = async (filePath: string): Promise<number> => {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (err) {
    console.error("Error getting file size:", err);
    throw err;
  }
};

// Check if the piece of file exists
export const checkPieceExist = async (
  port: number,
  filename: string,
  index: number
): Promise<boolean> => {
  const extractedFilename = path.basename(filename, path.extname(filename));
  const pieceFilePath = `${process.env.FILE_PATH}/${port}/${extractedFilename}/piece_${index}.bin`;
  return checkFileExists(pieceFilePath);
};
