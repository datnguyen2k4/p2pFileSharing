import fs from 'fs';
import crypto from 'crypto';

// Hàm để tạo mã hash SHA-1 cho từng piece của tệp
function createPieceHashes(
    filePath: string,
    pieceSize: number
): Promise<{ hashes: string[]; sizes: number[] }> {
    return new Promise((resolve, reject) => {
        const hashes: string[] = [];
        const sizes: number[] = []; // Mảng để lưu kích thước của từng piece
        const stream = fs.createReadStream(filePath, {
            highWaterMark: pieceSize,
        });

        stream.on('data', (chunk) => {
            const hash = crypto.createHash('sha1');
            hash.update(chunk);
            hashes.push(hash.digest('hex'));

            sizes.push(chunk.length); // Lưu kích thước của từng chunk
        });

        stream.on('end', () => {
            resolve({ hashes, sizes }); // Trả về cả hashes và sizes
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

export { createPieceHashes };
