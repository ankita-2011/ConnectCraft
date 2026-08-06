import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getImpactProfile,
  getUserAchievements,
  getUserMilestones,
  getActivityTimeline,
  getCommunityLeaderboard,
} from '../controllers/impactController.js';

const router = express.Router();

router.get('/me', protect, getImpactProfile);
router.get('/achievements', protect, getUserAchievements);
router.get('/achievements/:username', protect, getUserAchievements);
router.get('/milestones', protect, getUserMilestones);
router.get('/milestones/:username', protect, getUserMilestones);
router.get('/activity', protect, getActivityTimeline);
router.get('/activity/:username', protect, getActivityTimeline);

export default router;
