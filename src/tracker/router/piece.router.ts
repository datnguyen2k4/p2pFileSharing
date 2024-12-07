import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import PieceController from '../controller/piece.controller';

const router = Router();
router.post('/register', asyncHandler(PieceController.registerPiece));

// Get all pieces by torrentId
router.get('/:torrentId', asyncHandler(PieceController.getPiecesByTorrentId));

//Get all peers by hashPiece
router.get(
    '/peer/:hashPiece',
    asyncHandler(PieceController.getPeersByHashPiece)
);

router.get('/sort/:filename', asyncHandler(PieceController.sortPieces));
router.delete('/delete', asyncHandler(PieceController.deletePiecePeer));

export default router;
