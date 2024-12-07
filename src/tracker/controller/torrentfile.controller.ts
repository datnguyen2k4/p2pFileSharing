import pool from "../database/initDb";
import { Request, Response, NextFunction } from "express";
import dotent from "dotenv";
dotent.config();

class TorrentFileController {
  //  // Register a file
  // router.post("/register", asyncHandler(TorrentFileController.register));
  static async register(req: Request, res: Response, next: NextFunction) {
    console.log(req.body);
    const { filename, size, pieceSize } = req.body;
    if (!filename || !size || !pieceSize) {
      res.status(400).json({
        message: "Add filename, size and pieceSize",
      });
      return;
    }

    try {
      const torrentFile = await pool.query(
        "SELECT * FROM torrentfile WHERE filename = $1",
        [filename]
      );
      if (torrentFile.rows.length != 0) {
        res.status(200).json(torrentFile.rows[0]);
        return;
      }

      const newTorrentFile = await pool.query(
        "INSERT INTO torrentfile (filename, size, pieceSize) VALUES ($1, $2, $3) RETURNING *",
        [filename, size, pieceSize]
      );
      console.log("File registered::", newTorrentFile.rows[0]);
      res.status(201).json(newTorrentFile.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  // // Get all torrentfiles
  // router.get("/get", asyncHandler(TorrentFileController.getTorrentFiles));
  static async getTorrentFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const torrentFiles = await pool.query("SELECT * FROM torrentfile");
      res.status(200).json(torrentFiles.rows);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  // // Get a torrentfile by filename
  // router.get("/:filename", asyncHandler(TorrentFileController.getTorrentFile));
  static async getTorrentFile(req: Request, res: Response, next: NextFunction) {
    const filename = req.params.filename;
    if (!filename) {
      res.status(400).send("Add filename");
      return;
    }

    try {
      const torrentFile = await pool.query(
        "SELECT * FROM torrentfile WHERE filename = $1",
        [filename]
      );
      if (torrentFile.rows.length == 0) {
        res.status(400).json({ message: "File not found" });
        return;
      }

      res.status(200).json(torrentFile.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
}

export default TorrentFileController;
