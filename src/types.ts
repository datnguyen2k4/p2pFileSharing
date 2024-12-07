// types.ts

// Định nghĩa kiểu dữ liệu cho Peer
export interface Peer {
  id: string;
  ip: string;
  port: number;
  download: number;
  upload: number;
}

export interface Piece {
  torrentid: string;
  hash: string;
  size: number;
  index: number;
}

// Định nghĩa kiểu dữ liệu cho File
export interface File {
  name: string;
  size: number;
}

// Định nghĩa kiểu dữ liệu cho yêu cầu tải xuống
export interface DownloadRequest {
  action: "download";
  pieceIndex: number;
}
