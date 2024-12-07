import { Router } from "express";
import TorrentFileController from "../controller/torrentfile.controller";
import asyncHandler from "express-async-handler";

const router = Router();

// Register a file
router.post("/register", asyncHandler(TorrentFileController.register));

// Get a torrentfile by filename
router.get("/:filename", asyncHandler(TorrentFileController.getTorrentFile));

// Get all torrentfiles
router.get("/", asyncHandler(TorrentFileController.getTorrentFiles));

export default router;
