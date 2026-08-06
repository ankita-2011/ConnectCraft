import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import {
  getWorkshops,
  getWorkshopById,
  getMyWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  registerWorkshop,
  cancelRegistration,
  getParticipants,
  removeParticipant,
} from '../controllers/workshopController.js';

import { upload } from '../services/uploadService.js';

const router = express.Router();

// Discovery & Feed REST endpoints
router.get('/', protect, getWorkshops);
router.get('/my', protect, getMyWorkshops);
router.get('/:id', protect, getWorkshopById);

// Host Participant Management endpoints
router.get('/:id/participants', protect, getParticipants);
router.delete('/:id/participants/:userId', protect, removeParticipant);

// Registration Endpoints
router.post('/:id/register', protect, registerWorkshop);
router.delete('/:id/register', protect, cancelRegistration);

// CRUD Endpoints
router.post('/', protect, upload.single('banner'), createWorkshop);
router.put('/:id', protect, upload.single('banner'), updateWorkshop);
router.delete('/:id', protect, deleteWorkshop);

export default router;
