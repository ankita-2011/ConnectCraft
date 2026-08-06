import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDiscussions,
  createDiscussion,
  getReplies,
  createReply,
} from '../controllers/discussionController.js';

const router = express.Router();

// Get all discussions for a community
router.get('/', protect, getDiscussions);

// Create a new discussion
router.post('/', protect, createDiscussion);

// Get replies for a specific discussion
router.get('/:id/replies', protect, getReplies);

// Post a reply to a discussion
router.post('/:id/replies', protect, createReply);

export default router;
