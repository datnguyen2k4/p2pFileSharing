import pool from "../database/initDb";
import { Request, Response, NextFunction } from "express";

class PeerController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { ip, port } = req.body;
    if (!ip || !port) {
      res.status(400).json({ message: "Add ip and port" });
      return;
    }

    try {
      const peer = await pool.query(
        "SELECT * FROM peer WHERE ip = $1 AND port = $2",
        [ip, port]
      );
      if (peer.rows.length != 0) {
        res.status(400).json({ message: "Peer already registered" });
        return;
      }

      const newPeer = await pool.query(
        "INSERT INTO peer (ip, port) VALUES ($1, $2) RETURNING *",
        [ip, port]
      );
      console.log("Peer registered::", newPeer.rows[0]);
      res.status(201).json(newPeer.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
  static async getMe(req: Request, res: Response, next: NextFunction) {
    const ip = req.query.ip as string;
    const port = req.query.port as string;
    if (!ip || !port) {
      res.status(400).json({ message: "Add ip and port" });
      return;
    }

    try {
      const peer = await pool.query(
        "SELECT * FROM peer WHERE ip = $1 AND port = $2",
        [ip, port]
      );
      if (peer.rows.length == 0) {
        res.status(400).json({ message: "Peer not found" });
        return;
      }

      res.status(200).json(peer.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
  static async get(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const peerId = req.params.peerId;
    if (!peerId) {
      res.status(400).send("Add peerId");
      return;
    }

    try {
      const peer = await pool.query(
        "SELECT * FROM peer p JOIN peerpiecer pe on pe.peerid = p.id join piece on hashpiece = hash JOIN torrentfile t on t.id = torrentid  WHERE p.id = $1 ",
        [peerId]
      );
      if (peer.rows.length == 0) {
        res.status(400).json({ message: "Peer not found" });
        return;
      }

      res.status(200).json(peer.rows);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const peers = await pool.query("SELECT * FROM peer");
      res.status(200).json(peers.rows);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const peerId = req.params.peerId;
    if (!peerId) {
      res.status(400).send("Add peerId");
      return;
    }

    try {
      const peer = await pool.query("DELETE FROM peer WHERE id = $1", [peerId]);
      if (peer.rowCount == 0) {
        res.status(400).json({ message: "Peer not found" });
        return;
      }

      res.status(200).json({ message: "Peer deleted" });
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    const { ip, port, isOnline, upload, download } = req.body;

    // Only update the fields that not null
    const values = [];
    if (isOnline != null) {
      values.push(`isOnline = ${isOnline}`);
    }
    if (upload != null) {
      values.push(`upload = ${upload}`);
    }
    if (download != null) {
      values.push(`download = ${download}`);
    }

    console.log("Values::", values.join(", "));
    try {
      const peer = await pool.query(
        `UPDATE peer SET ${values.join(
          ", "
        )} WHERE port = $1 AND ip = $2 RETURNING *`,
        [port, ip]
      );
      if (peer.rows.length == 0) {
        res.status(400).json({ message: "Peer not found" });
        return;
      }

      console.log("Peer updated::", peer.rows[0]);

      res.status(200).json(peer.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
}

export default PeerController;
