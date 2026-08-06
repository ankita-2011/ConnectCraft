import mongoose from 'mongoose';
import Profile from '../models/Profile.js';
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import ImpactHistory from '../models/ImpactHistory.js';
import Community from '../models/Community.js';
import { recalculateImpact, calculateLevelInfo } from '../services/impactService.js';
import { seedAchievements } from '../services/achievementService.js';

/**
 * @desc    Get user's impact summary, level, and contribution stats
 * @route   GET /api/impact/me
 * @access  Private
 */
export const getImpactProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const impactData = await recalculateImpact(userId);

    const history = await ImpactHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      impact: impactData,
      recentActivity: history,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving impact profile.',
    });
  }
};

/**
 * @desc    Get unlocked and locked achievements for profile
 * @route   GET /api/impact/achievements/:username?
 * @access  Private
 */
export const getUserAchievements = async (req, res) => {
  try {
    const { username } = req.params;
    let targetUserId = req.user._id;

    if (username && username !== 'me') {
      const p = await Profile.findOne({ username });
      if (!p) {
        return res.status(404).json({ status: 'fail', message: 'Profile not found.' });
      }
      targetUserId = p.userId;
    }

    await seedAchievements();
    const allAchievements = await Achievement.find({});
    const unlockedRecords = await UserAchievement.find({ user: targetUserId });
    const unlockedMap = {};
    unlockedRecords.forEach((r) => {
      unlockedMap[r.achievement.toString()] = r.unlockedAt;
    });

    const achievements = allAchievements.map((ach) => {
      const aObj = ach.toObject();
      aObj.isUnlocked = !!unlockedMap[ach._id.toString()];
      aObj.unlockedAt = unlockedMap[ach._id.toString()] || null;
      return aObj;
    });

    res.status(200).json({
      status: 'success',
      unlockedCount: unlockedRecords.length,
      totalCount: allAchievements.length,
      achievements,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving achievements.',
    });
  }
};

/**
 * @desc    Get long-term milestone progress
 * @route   GET /api/impact/milestones/:username?
 * @access  Private
 */
export const getUserMilestones = async (req, res) => {
  try {
    const { username } = req.params;
    let targetUserId = req.user._id;

    if (username && username !== 'me') {
      const p = await Profile.findOne({ username });
      if (!p) {
        return res.status(404).json({ status: 'fail', message: 'Profile not found.' });
      }
      targetUserId = p.userId;
    }

    const impactData = await recalculateImpact(targetUserId);
    const stats = impactData?.stats || {};

    const milestones = [
      {
        title: '10 Connected Peers',
        current: stats.connectionsCount || 0,
        target: 10,
        completed: (stats.connectionsCount || 0) >= 10,
        progressPercent: Math.min(100, Math.round(((stats.connectionsCount || 0) / 10) * 100)),
      },
      {
        title: '5 Projects Created',
        current: stats.projCreatedCount || 0,
        target: 5,
        completed: (stats.projCreatedCount || 0) >= 5,
        progressPercent: Math.min(100, Math.round(((stats.projCreatedCount || 0) / 5) * 100)),
      },
      {
        title: '5 Projects Completed',
        current: stats.projCompletedCount || 0,
        target: 5,
        completed: (stats.projCompletedCount || 0) >= 5,
        progressPercent: Math.min(100, Math.round(((stats.projCompletedCount || 0) / 5) * 100)),
      },
      {
        title: '10 Knowledge Resources Shared',
        current: stats.resourcesCount || 0,
        target: 10,
        completed: (stats.resourcesCount || 0) >= 10,
        progressPercent: Math.min(100, Math.round(((stats.resourcesCount || 0) / 10) * 100)),
      },
      {
        title: '5 Workshops Hosted',
        current: stats.workshopsHostedCount || 0,
        target: 5,
        completed: (stats.workshopsHostedCount || 0) >= 5,
        progressPercent: Math.min(100, Math.round(((stats.workshopsHostedCount || 0) / 5) * 100)),
      },
    ];

    res.status(200).json({
      status: 'success',
      milestones,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving milestones.',
    });
  }
};

/**
 * @desc    Get activity timeline items
 * @route   GET /api/impact/activity/:username?
 * @access  Private
 */
export const getActivityTimeline = async (req, res) => {
  try {
    const { username } = req.params;
    let targetUserId = req.user._id;

    if (username && username !== 'me') {
      const p = await Profile.findOne({ username });
      if (!p) {
        return res.status(404).json({ status: 'fail', message: 'Profile not found.' });
      }
      targetUserId = p.userId;
    }

    const activity = await ImpactHistory.find({ user: targetUserId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      status: 'success',
      activity,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving activity timeline.',
    });
  }
};

/**
 * @desc    Get community top contributors leaderboard
 * @route   GET /api/communities/:communityId/leaderboard
 * @access  Private
 */
export const getCommunityLeaderboard = async (req, res) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        status: 'fail',
        message: 'Community not found.',
      });
    }

    const memberUserIds = community.members || [];
    const profiles = await Profile.find({ userId: { $in: memberUserIds } })
      .sort({ impactScore: -1 })
      .limit(10)
      .populate('userId', 'name email');

    const leaderboard = profiles.map((p, idx) => ({
      rank: idx + 1,
      user: {
        _id: p.userId?._id,
        name: p.userId?.name,
        email: p.userId?.email,
      },
      username: p.username,
      headline: p.headline,
      profilePhoto: p.profilePhoto,
      impactScore: p.impactScore || 0,
      level: p.level || 'Explorer',
    }));

    res.status(200).json({
      status: 'success',
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching community leaderboard.',
    });
  }
};
