import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getConversations,
  getConversationById,
  getMessages,
  sendMessageHttp,
} from '../controllers/chatController.js';

const router = express.Router();

// Conversations REST endpoints
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversationById);

// Messages REST endpoints
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, sendMessageHttp);

export default router;
