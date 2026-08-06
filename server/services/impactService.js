import Profile from '../models/Profile.js';
import Connection from '../models/Connection.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Resource from '../models/Resource.js';
import Workshop from '../models/Workshop.js';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import ImpactHistory from '../models/ImpactHistory.js';
import { checkAndUnlockAchievements } from './achievementService.js';
import { createNotification } from './notificationService.js';

export const LEVEL_THRESHOLDS = [
  { name: 'Explorer', min: 0, max: 99, icon: '🧭' },
  { name: 'Collaborator', min: 100, max: 249, icon: '🤝' },
  { name: 'Creator', min: 250, max: 499, icon: '💡' },
  { name: 'Mentor', min: 500, max: 999, icon: '🎓' },
  { name: 'Leader', min: 1000, max: 1999, icon: '👑' },
  { name: 'Visionary', min: 2000, max: Infinity, icon: '🚀' },
];

export const calculateLevelInfo = (impactScore = 0) => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (impactScore >= LEVEL_THRESHOLDS[i].min) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
    }
  }

  let progressPercent = 100;
  if (nextLevel) {
    const range = nextLevel.min - currentLevel.min;
    const gained = impactScore - currentLevel.min;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
  }

  return {
    currentLevel: currentLevel.name,
    levelIcon: currentLevel.icon,
    nextLevel: nextLevel ? nextLevel.name : 'Max Level',
    minPoints: currentLevel.min,
    nextPoints: nextLevel ? nextLevel.min : currentLevel.min,
    progressPercent,
  };
};

/**
 * Recalculates user's total Impact score from actual contributions and updates Profile.
 */
export const recalculateImpact = async (userId) => {
  if (!userId) return null;

  const profile = await Profile.findOne({ userId });
  if (!profile) return null;

  // 1. Profile Completion points (50 pts if 100%)
  const profilePts = profile.profileCompletion === 100 ? 50 : 0;

  // 2. Active Connections (10 pts each)
  const connectionsCount = await Connection.countDocuments({
    $or: [{ user1: userId }, { user2: userId }],
  });
  const connectionPts = connectionsCount * 10;

  // 3. Communities Created (40 pts each)
  const commsCreatedCount = await Community.countDocuments({ owner: userId });
  const commsCreatedPts = commsCreatedCount * 40;

  // 4. Communities Joined (10 pts each)
  const commsJoinedCount = await Community.countDocuments({ members: userId, owner: { $ne: userId } });
  const commsJoinedPts = commsJoinedCount * 10;

  // 5. Projects Created (50 pts each)
  const projCreatedCount = await Project.countDocuments({ owner: userId });
  const projCreatedPts = projCreatedCount * 50;

  // 6. Projects Completed (100 pts each)
  const projCompletedCount = await Project.countDocuments({ owner: userId, status: 'Completed' });
  const projCompletedPts = projCompletedCount * 100;

  // 7. Projects Joined (30 pts each)
  const projJoinedCount = await ProjectMember.countDocuments({ user: userId, role: 'Collaborator' });
  const projJoinedPts = projJoinedCount * 30;

  // 8. Resources Shared (30 pts each)
  const resourcesCount = await Resource.countDocuments({ creator: userId });
  const resourcesPts = resourcesCount * 30;

  // 9. Workshops Hosted (60 pts each)
  const workshopsHostedCount = await Workshop.countDocuments({ host: userId });
  const workshopsHostedPts = workshopsHostedCount * 60;

  // 10. Workshops Attended (20 pts each)
  const workshopsAttendedCount = await WorkshopRegistration.countDocuments({ user: userId });
  const workshopsAttendedPts = workshopsAttendedCount * 20;

  const totalImpact =
    profilePts +
    connectionPts +
    commsCreatedPts +
    commsJoinedPts +
    projCreatedPts +
    projCompletedPts +
    projJoinedPts +
    resourcesPts +
    workshopsHostedPts +
    workshopsAttendedPts;

  const oldLevel = profile.level || 'Explorer';
  const levelInfo = calculateLevelInfo(totalImpact);

  profile.impactScore = totalImpact;
  profile.level = levelInfo.currentLevel;
  await profile.save();

  // If user achieved a higher level, trigger history record and notification
  if (oldLevel !== levelInfo.currentLevel) {
    await ImpactHistory.create({
      user: userId,
      actionType: 'LEVEL_UP',
      impactPoints: totalImpact,
      description: `Reached Level: ${levelInfo.currentLevel}!`,
    });

    createNotification({
      recipientId: userId,
      type: 'system',
      title: 'New Level Reached! 🎉',
      message: `Congratulations! Your contributions have elevated you to Level ${levelInfo.currentLevel}.`,
    });
  }

  // Evaluate achievements
  await checkAndUnlockAchievements(userId, {
    connectionsCount,
    commsCreatedCount,
    projCreatedCount,
    projCompletedCount,
    projJoinedCount,
    resourcesCount,
    workshopsHostedCount,
    workshopsAttendedCount,
    totalImpact,
    level: levelInfo.currentLevel,
  });

  return {
    totalImpact,
    levelInfo,
    stats: {
      connectionsCount,
      commsCreatedCount,
      commsJoinedCount,
      projCreatedCount,
      projCompletedCount,
      projJoinedCount,
      resourcesCount,
      workshopsHostedCount,
      workshopsAttendedCount,
    },
  };
};
