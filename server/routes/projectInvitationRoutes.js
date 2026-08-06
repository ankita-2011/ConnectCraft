import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/:id/accept', protect, acceptInvitation);
router.post('/:id/reject', protect, rejectInvitation);
router.post('/:id/cancel', protect, cancelInvitation);

export default router;
