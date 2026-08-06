import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import ImpactHistory from '../models/ImpactHistory.js';
import { createNotification } from './notificationService.js';

export const DEFAULT_ACHIEVEMENTS = [
  {
    key: 'first_connection',
    title: 'First Connection',
    description: 'Connected with your first peer on ConnectCraft.',
    icon: '🤝',
    category: 'Networking',
    criteriaType: 'connectionsCount',
    threshold: 1,
  },
  {
    key: 'community_builder',
    title: 'Community Builder',
    description: 'Created and launched a learning community.',
    icon: '🏰',
    category: 'Community',
    criteriaType: 'commsCreatedCount',
    threshold: 1,
  },
  {
    key: 'project_creator',
    title: 'Project Creator',
    description: 'Created a collaborative project workspace.',
    icon: '💡',
    category: 'Collaboration',
    criteriaType: 'projCreatedCount',
    threshold: 1,
  },
  {
    key: 'project_leader',
    title: 'Project Leader',
    description: 'Successfully completed a project collaboration.',
    icon: '🎯',
    category: 'Leadership',
    criteriaType: 'projCompletedCount',
    threshold: 1,
  },
  {
    key: 'workshop_host',
    title: 'Workshop Host',
    description: 'Organized and hosted a live workshop or event.',
    icon: '🎤',
    category: 'Knowledge',
    criteriaType: 'workshopsHostedCount',
    threshold: 1,
  },
  {
    key: 'knowledge_sharer',
    title: 'Knowledge Sharer',
    description: 'Shared 3 or more valuable learning resources.',
    icon: '📚',
    category: 'Knowledge',
    criteriaType: 'resourcesCount',
    threshold: 3,
  },
  {
    key: 'collaboration_expert',
    title: 'Collaboration Expert',
    description: 'Joined and contributed to 3 or more project teams.',
    icon: '⚡',
    category: 'Collaboration',
    criteriaType: 'projJoinedCount',
    threshold: 3,
  },
  {
    key: 'active_contributor',
    title: 'Active Contributor',
    description: 'Reached 100+ total Impact score on ConnectCraft.',
    icon: '🌟',
    category: 'Leadership',
    criteriaType: 'totalImpact',
    threshold: 100,
  },
  {
    key: 'community_mentor',
    title: 'Community Mentor',
    description: 'Earned Mentor level recognition.',
    icon: '🎓',
    category: 'Leadership',
    criteriaType: 'totalImpact',
    threshold: 500,
  },
];

/**
 * Ensures system achievements exist in database.
 */
export const seedAchievements = async () => {
  try {
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await Achievement.findOneAndUpdate(
        { key: ach.key },
        { $setOnInsert: ach },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('Error seeding achievements:', err);
  }
};

/**
 * Checks and unlocks eligible achievements for user.
 */
export const checkAndUnlockAchievements = async (userId, metrics) => {
  if (!userId || !metrics) return;

  try {
    await seedAchievements();

    const allAchievements = await Achievement.find({});
    const unlockedRecords = await UserAchievement.find({ user: userId });
    const unlockedSet = new Set(unlockedRecords.map((r) => r.achievement.toString()));

    for (const ach of allAchievements) {
      if (unlockedSet.has(ach._id.toString())) continue;

      const userVal = metrics[ach.criteriaType] || 0;
      if (userVal >= ach.threshold) {
        // Unlock achievement!
        await UserAchievement.create({
          user: userId,
          achievement: ach._id,
        });

        await ImpactHistory.create({
          user: userId,
          actionType: 'ACHIEVEMENT_UNLOCKED',
          impactPoints: 20,
          description: `Unlocked Achievement: ${ach.title}`,
        });

        // Trigger real-time notification
        createNotification({
          recipientId: userId,
          type: 'system',
          title: `Achievement Unlocked: ${ach.title} ${ach.icon}`,
          message: ach.description,
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};
