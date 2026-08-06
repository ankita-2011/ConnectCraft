import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.delete('/', protect, clearAllNotifications);
router.delete('/:id', protect, deleteNotification);

export default router;
