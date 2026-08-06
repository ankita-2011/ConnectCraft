import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { submitReport } from '../controllers/adminController.js';

const router = express.Router();

router.post('/', protect, submitReport);

export default router;
