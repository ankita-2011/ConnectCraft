import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPersonalAnalytics,
  getMonthlySummary,
  getCommunityAnalytics,
  getProjectAnalytics,
  getWorkshopAnalytics,
  getResourceAnalytics,
  exportCSV,
  exportPDF,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/personal', protect, getPersonalAnalytics);
router.get('/monthly-summary', protect, getMonthlySummary);
router.get('/community/:id', protect, getCommunityAnalytics);
router.get('/project/:id', protect, getProjectAnalytics);
router.get('/workshop', protect, getWorkshopAnalytics);
router.get('/resources', protect, getResourceAnalytics);
router.get('/export/csv', protect, exportCSV);
router.get('/export/pdf', protect, exportPDF);

export default router;
