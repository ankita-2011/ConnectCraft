import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  likeResource,
  unlikeResource,
  bookmarkResource,
  removeBookmark,
  getUserBookmarks,
  getTrendingResources,
} from '../controllers/resourceController.js';

const router = express.Router();

// Specific query endpoints
router.get('/trending', protect, getTrendingResources);
router.get('/bookmarks', protect, getUserBookmarks);

// Resource feed and CRUD
router.get('/', protect, getResources);
router.post('/', protect, createResource);
router.get('/:id', protect, getResourceById);
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);

// Interaction endpoints (likes & bookmarks)
router.post('/:id/like', protect, likeResource);
router.delete('/:id/like', protect, unlikeResource);
router.post('/:id/bookmark', protect, bookmarkResource);
router.delete('/:id/bookmark', protect, removeBookmark);

export default router;
