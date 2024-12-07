import pool from "../database/initDb";
import { Request, Response, NextFunction } from "express";

class PieceController {
  //     router.post("/register", asyncHandler(PieceController.registerPiece));

  static async registerPiece(req: Request, res: Response, next: NextFunction) {
    console.log(req.body);
    const { hash, torrentFileId, size, index, peerId } = req.body;
    console.log("Piece::", hash, torrentFileId, size, index, peerId);
    if (!hash || !torrentFileId || !size || index == undefined || !peerId) {
      res.status(400).json({
        message: "Add hash, torrentFileId, size, index, peerId",
      });
      return;
    }

    try {
      // Check the index of the piece

      const piece = await pool.query(
        "SELECT * FROM piece WHERE hash = $1 AND index = $2",
        [hash, index]
      );
      //console.log("Piece::", piece);

      // Piece does not exist
      if (piece.rows.length == 0) {
        const newPiece = await pool.query(
          "INSERT INTO piece (hash, torrentId, size, index) VALUES ($1, $2, $3, $4) RETURNING *",
          [hash, torrentFileId, size, index]
        );
        console.log("New piece::", newPiece.rows[0]);

        // Register the peerPiece
        const peerPiece = await pool.query(
          "INSERT INTO peerPieceR (peerId, hashPiece) VALUES ($1, $2) RETURNING *",
          [peerId, hash]
        );
        console.log("PeerPiece::", peerPiece.rows[0]);

        res.status(201).json(newPiece.rows[0]);
        return;
      }

      if (piece.rows[0].hash != hash) {
        res.status(400).json({
          message:
            "Checksum error. The hash of this piece is not similar to the registered one!",
        });
        return;
      }

      // peerPiece already exists
      const peerPiece1 = await pool.query(
        "SELECT * FROM peerPieceR WHERE peerId = $1 AND hashPiece = $2",
        [peerId, hash]
      );

      if (peerPiece1.rows.length != 0) {
        // res.status(400).json({
        //   message: "Peer already registered this piece",
        // });
        return;
      }

      // Register the peerPiece
      const peerPiece = await pool.query(
        "INSERT INTO peerPieceR (peerId, hashPiece) VALUES ($1, $2) RETURNING *",
        [peerId, hash]
      );

      console.log("PeerPiece::", peerPiece.rows[0]);
      res.status(201).json(piece.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  // // Get all peers by hashPiece
  // router.get("/peer/:hashPiece", asyncHandler(PieceController.getPeersByHashPiece));
  static async getPeersByHashPiece(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const hashPiece = req.params.hashPiece;
    if (!hashPiece) {
      res.status(400).send("Add hashPiece");
      return;
    }

    try {
      // Check if the piece not exists
      const piece = await pool.query("SELECT * FROM piece WHERE hash = $1", [
        hashPiece,
      ]);
      if (piece.rows.length == 0) {
        res.status(400).json({ message: "Piece not found" });
        return;
      }

      const peerList = await pool.query(
        "select Peer.id, ip, port, download, upload from PeerPieceR join Peer on peerId = Peer.id where hashPiece = $1",
        [hashPiece]
      );

      console.log("Peer list::", peerList.rows);

      res.status(200).json(peerList.rows);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }

  //   // Get all pieces by torrentId
  // router.get(
  //     ":torrentId",
  //     asyncHandler(PieceController.getPiecesByTorrentId)
  //   );
  static async sortPieces(req: Request, res: Response, next: NextFunction) {
    // sort pieces by number of peers that have the piece
    try {
      const filename = req.params.filename;
      const sortedPieces = await pool.query(
        "select hash, index, count(*) from piece join torrentfile t on t.id = torrentid join peerPieceR on hashPiece = hash where filename = $1 group by index, t.filename, hash order by count(*) asc",
        [filename]
      );
      res.status(200).json(sortedPieces.rows);
    } catch (err: any) {
      res.status(500).send({ message: err.message });
    }
  }

  static async getPiecesByTorrentId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const torrentId = req.params.torrentId;
    if (!torrentId) {
      res.status(400).send("Add torrentId");
      return;
    }

    try {
      const pieces = await pool.query(
        "SELECT * FROM piece WHERE torrentId = $1",
        [torrentId]
      );
      res.status(200).json(pieces.rows);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async deletePiecePeer(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { ip, port, filename, index } = req.body;
    if (!ip || !ip || !filename || index == undefined) {
      res.status(400).json({
        message: "Add ip, port, filename, index",
      });
      return;
    }

    const peerId = await pool.query(
      "SELECT id FROM peer WHERE ip = $1 AND port = $2",
      [ip, port]
    );
    console.log("PeerId::", peerId.rows);
    if (peerId.rows.length == 0) {
      res.status(400).json({
        message: "Peer not found",
      });
      return;
    }

    const hashPiece = await pool.query(
      "SELECT hash FROM piece JOIN torrentfile ON torrentId = torrentfile.id WHERE filename = $1 AND index = $2",
      [filename, index]
    );
    console.log("HashPiece::", hashPiece.rows);
    if (hashPiece.rows.length == 0) {
      res.status(400).json({
        message: "Piece not found",
      });
      return;
    }

    try {
      const peerPiece = await pool.query(
        "DELETE FROM peerPieceR WHERE peerId = $1 AND hashPiece = $2 RETURNING *",
        [peerId.rows[0].id, hashPiece.rows[0].hash]
      );
      if (peerPiece.rows.length == 0) {
        res.status(400).json({
          message: "PeerPiece not found",
        });
        return;
      }

      res.status(200).json(peerPiece.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
}

export default PieceController;
