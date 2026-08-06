import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import Resource from '../models/Resource.js';
import Workshop from '../models/Workshop.js';
import Connection from '../models/Connection.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Announcement from '../models/Announcement.js';
import AuditLog from '../models/AuditLog.js';
import SystemSettings from '../models/SystemSettings.js';

export const logAdminAction = async (adminId, action, targetType = '', targetId = '', details = '') => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (err) {
    console.error('Error logging audit action:', err);
  }
};

export const bootstrapSuperAdmin = async ({ name, email, password, superAdminKey }) => {
  const bootstrapKey = process.env.SUPER_ADMIN_KEY;
  if (!bootstrapKey || !superAdminKey || superAdminKey !== bootstrapKey) {
    throw new Error('Invalid Super Admin Bootstrap Key.');
  }

  const existingSuperAdmin = await User.findOne({
    role: { $in: ['SUPER_ADMIN', 'super_admin'] },
  });

  if (existingSuperAdmin) {
    throw new Error('Super Admin already initialized on this platform. Bootstrap disabled.');
  }

  const superAdmin = await User.create({
    name,
    email,
    password,
    role: 'SUPER_ADMIN',
    accountStatus: 'active',
  });

  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  await Profile.create({
    userId: superAdmin._id,
    username: `${username}_admin`,
    headline: 'ConnectCraft System Super Admin',
    bio: 'Platform Super Administrator and System Operations Manager.',
    impactScore: 1000,
    level: 'Leader',
    onboardingCompleted: true,
  });

  await logAdminAction(superAdmin._id, 'BOOTSTRAP_SUPER_ADMIN', 'User', superAdmin._id.toString(), 'Initialized platform first Super Admin');

  return superAdmin;
};

export const getSystemSettingsService = async () => {
  let settings = await SystemSettings.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await SystemSettings.create({ singletonKey: 'GLOBAL_SETTINGS' });
  }
  return settings;
};

export const updateSystemSettingsService = async (settingsData, adminId) => {
  let settings = await SystemSettings.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await SystemSettings.create({ singletonKey: 'GLOBAL_SETTINGS', ...settingsData });
  } else {
    Object.assign(settings, settingsData);
    await settings.save();
  }

  await logAdminAction(adminId, 'UPDATE_SYSTEM_SETTINGS', 'SystemSettings', settings._id.toString(), 'Updated platform global system configuration');
  return settings;
};

export const getPlatformAnalyticsService = async () => {
  const [
    totalUsers,
    activeUsers,
    totalCommunities,
    totalProjects,
    totalResources,
    totalWorkshops,
    totalConnections,
    totalMessages,
    totalReports,
    pendingReports,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ accountStatus: 'active' }),
    Community.countDocuments(),
    Project.countDocuments(),
    Resource.countDocuments(),
    Workshop.countDocuments(),
    Connection.countDocuments(),
    Message.countDocuments(),
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    AuditLog.find().populate('admin', 'name email role').sort({ createdAt: -1 }).limit(10),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers: totalUsers - activeUsers,
    totalCommunities,
    totalProjects,
    totalResources,
    totalWorkshops,
    totalConnections,
    totalMessages,
    totalReports,
    pendingReports,
    recentActivity,
  };
};
