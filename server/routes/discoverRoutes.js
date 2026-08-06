import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDiscoverLanding,
  searchUsers,
} from '../controllers/discoverController.js';

const router = express.Router();

// Get discover landing page dashboard feeds
router.get('/', protect, getDiscoverLanding);

// Get search and filter results (paginated)
router.get('/search', protect, searchUsers);

export default router;
