import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../services/uploadService.js';
import {
  getMyProfile,
  updateProfile,
  getProfileByUsername,
  uploadPhoto,
  deletePhoto,
  uploadCover,
  deleteMyAccount,
} from '../controllers/profileController.js';

const router = express.Router();

// Protected profile routes
router.get('/me', protect, getMyProfile);
router.put('/', protect, updateProfile);
router.delete('/', protect, deleteMyAccount);
router.post('/photo', protect, upload.single('photo'), uploadPhoto);
router.delete('/photo', protect, deletePhoto);
router.post('/cover', protect, upload.single('cover'), uploadCover);

// Public route to view other user profiles
router.get('/:username', getProfileByUsername);

export default router;

