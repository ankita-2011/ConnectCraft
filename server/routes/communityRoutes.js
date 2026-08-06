import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../services/uploadService.js';
import {
  createCommunity,
  getCommunitiesLanding,
  getCommunityBySlug,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  searchCommunities,
} from '../controllers/communityController.js';

const router = express.Router();

// Get landing feed (Featured, Joined, Newest, Recommended)
router.get('/', protect, getCommunitiesLanding);

// Search and filter communities (paginated)
router.get('/search', protect, searchCommunities);

// Create a new community (handles logo and cover file uploads)
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  createCommunity
);

// Get detailed community data by unique slug
router.get('/:slug', protect, getCommunityBySlug);

// Edit community details (logo and cover updates supported)
router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  updateCommunity
);

// Delete community (and unlink images from local disk)
router.delete('/:id', protect, deleteCommunity);

// Join a community (public joins instantly, private requests)
router.post('/:id/join', protect, joinCommunity);

// Leave a community (includes owner transference checks)
router.post('/:id/leave', protect, leaveCommunity);

export default router;
