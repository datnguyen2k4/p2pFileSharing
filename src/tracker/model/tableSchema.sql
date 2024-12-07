-- Enable the UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Torrent Files
CREATE TABLE TorrentFile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    pieceSize INT NOT NULL
);

-- Table for Pieces of a Torrent
CREATE TABLE Piece (
    hash VARCHAR(265) PRIMARY KEY,
    torrentId UUID NOT NULL,
    size BIGINT NOT NULL,
    index INT NOT NULL,
    FOREIGN KEY (torrentId) REFERENCES TorrentFile(id)
);

-- Table for Peers
CREATE TABLE Peer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    isOnline BOOLEAN DEFAULT FALSE,
    download BIGINT DEFAULT 0,
    upload BIGINT DEFAULT 0
);

-- Table for the relationship between Peers and Pieces
CREATE TABLE PeerPieceR (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashPiece VARCHAR(64) NOT NULL,
    peerId UUID NOT NULL,
    FOREIGN KEY (hashPiece) REFERENCES Piece(hash),
    FOREIGN KEY (peerId) REFERENCES Peer(id)
);
