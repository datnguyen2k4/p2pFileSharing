import { readFile, writeFile, mkdir, readdir } from 'fs/promises'; // Nhập trực tiếp các hàm từ fs/promises
import path from 'path';

// Hàm lấy tất cả các file chứa các phần
export const getFilePieces = async (fileId: string): Promise<string[]> => {
    const piecesDirectory = path.join(__dirname, fileId);
    // Trả về danh sách các file trong thư mục
    return await readdir(piecesDirectory);
};

// Hàm lưu một piece vào file
export const saveFilePiece = async (
    filePath: string,
    index: number,
    piece: Buffer
): Promise<void> => {
    // Tạo thư mục nếu chưa tồn tại
    const dirPath = path.dirname(filePath); // Lấy đường dẫn thư mục cha
    const baseName = path.basename(filePath, path.extname(filePath)); // Lấy tên file không có phần mở rộng
    // console.log(dirPath);

    const newDirPath = path.join(dirPath, baseName); // Tạo đường dẫn mới cho thư mục
    await mkdir(newDirPath, { recursive: true });
    const pieceFilePath = path.join(newDirPath, `piece_${index}.bin`); // Tên file cho từng piece
    await writeFile(pieceFilePath, piece);
};

// Hàm lấy một piece từ file
export const getFilePiece = async (
    fileId: string,
    index: number
): Promise<Buffer | null> => {
    const pieceFilePath = path.join(__dirname, fileId, `piece_${index}.bin`);
    try {
        const pieceBuffer = await readFile(pieceFilePath);
        return pieceBuffer;
    } catch (error) {
        console.error(`Error reading piece file ${pieceFilePath}:`, error);
        return null;
    }
};

// Hàm chia nhỏ file thành các phần (pieces) và lưu vào file
export async function loadFilePieces(
    filePath: string,
    pieceSize: number
): Promise<void> {
    const fileBuffer = await readFile(filePath);
    const numberOfPieces = Math.ceil(fileBuffer.length / pieceSize);

    for (let i = 0; i < numberOfPieces; i++) {
        const piece = fileBuffer.slice(i * pieceSize, (i + 1) * pieceSize);
        await saveFilePiece(filePath, i, piece); // Lưu từng phần vào file riêng
    }
}
