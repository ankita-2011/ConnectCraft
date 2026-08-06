import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import Resource from '../models/Resource.js';
import Workshop from '../models/Workshop.js';
import Report from '../models/Report.js';
import Announcement from '../models/Announcement.js';
import AuditLog from '../models/AuditLog.js';
import DeletedAccount from '../models/DeletedAccount.js';
import { hardDeleteUserAccount } from '../services/accountDeletionService.js';
import {

  bootstrapSuperAdmin,
  logAdminAction,
  getSystemSettingsService,
  updateSystemSettingsService,
  getPlatformAnalyticsService,
} from '../services/adminService.js';
import { createNotification } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
  });
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, adminSecretKey } = req.body;

    if (!name || !email || !password || !confirmPassword || !adminSecretKey) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields (Full Name, Email, Password, Confirm Password, Admin Secret Key) are required.',
      });
    }

    const expectedSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!expectedSecretKey) {
      return res.status(503).json({
        status: 'error',
        message: 'Administrator registration is not configured.',
      });
    }
    if (adminSecretKey.trim() !== expectedSecretKey.trim()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid Admin Secret Key. Access denied.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this email address already exists.',
      });
    }

    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'ADMIN',
      accountStatus: 'active',
      isVerified: true,
    });

    const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
    await Profile.create({
      userId: adminUser._id,
      username: `${baseUsername}_admin`,
      headline: 'ConnectCraft System Administrator',
      bio: 'Platform Administrator and Moderator.',
      onboardingCompleted: true,
    });

    await logAdminAction(adminUser._id, 'REGISTER_ADMIN', 'User', adminUser._id.toString(), `Admin registered via portal: ${normalizedEmail}`);

    return sendTokenResponse(adminUser, 201, res);
  } catch (error) {
    console.error('[ADMIN] Registration error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during admin registration.' });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email address and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'No administrator account found with this email address.' });
    }

    const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role);
    if (!isAdminRole) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. This portal is restricted to administrator accounts only.',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ status: 'fail', message: 'Your administrator account has been suspended.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ status: 'fail', message: 'Administrator account is not verified.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect password. Please check your admin password and try again.' });
    }

    await logAdminAction(user._id, 'ADMIN_LOGIN', 'User', user._id.toString(), `Admin logged in: ${normalizedEmail}`);

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('[ADMIN] Login error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during admin login.' });
  }
};

export const bootstrap = async (req, res) => {
  try {
    const { name, email, password, superAdminKey } = req.body;

    if (!name || !email || !password || !superAdminKey) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, password, and superAdminKey.',
      });
    }

    const superAdmin = await bootstrapSuperAdmin({ name, email, password, superAdminKey });
    return sendTokenResponse(superAdmin, 201, res);
  } catch (error) {
    console.error('[ADMIN] Bootstrap failed:', error.message);
    return res.status(403).json({
      status: 'fail',
      message: error.message || 'Bootstrap initialization failed.',
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'User with this email already exists.' });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'ADMIN',
      accountStatus: 'active',
    });

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    await Profile.create({
      userId: admin._id,
      username: `${username}_mod`,
      headline: 'ConnectCraft Platform Moderator',
      bio: 'Platform Content and Community Moderator.',
      impactScore: 500,
      level: 'Mentor',
      onboardingCompleted: true,
    });

    await logAdminAction(req.user._id, 'CREATE_ADMIN', 'User', admin._id.toString(), `Created Admin user ${email}`);

    res.status(201).json({
      status: 'success',
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create Admin user.' });
  }
};

// Get Users
export const getUsers = async (req, res) => {
  try {
    const { search, status, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.accountStatus = status;
    if (role) query.role = role.toUpperCase();

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving users.' });
  }
};

// Update User Status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ status: 'fail', message: 'Cannot modify Super Admin status.' });
    }

    user.accountStatus = accountStatus;
    await user.save();

    await logAdminAction(req.user._id, 'UPDATE_USER_STATUS', 'User', id, `Changed user status to ${accountStatus}`);

    res.status(200).json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error updating user status.' });
  }
};

// Delete User (Hard Delete with audit logging and cascade clean)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot delete your own admin account from user management. Use Account Settings if you wish to delete your account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ status: 'fail', message: 'Cannot delete Super Admin account.' });
    }

    const auditRecord = await hardDeleteUserAccount({
      userId: id,
      deletedBy: 'Admin',
      reason: reason || `Deleted by admin ${req.user.email}`,
    });

    await logAdminAction(req.user._id, 'DELETE_USER', 'User', id, `Permanently deleted user ${user.email} (${user.name})`);

    res.status(200).json({
      status: 'success',
      message: 'User account permanently deleted.',
      auditRecord,
    });
  } catch (error) {
    console.error('[ADMIN] Delete user error:', error);
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Error deleting user.' });
  }
};

/**
 * @desc    Get audit history of deleted accounts
 * @route   GET /api/admin/deleted-accounts
 * @access  Private (Admin / Super Admin)
 */
export const getDeletedAccounts = async (req, res) => {
  try {
    const { search, deletedBy, startDate, endDate } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { deletionReason: searchRegex },
        { originalUserId: searchRegex },
      ];
    }

    if (deletedBy && ['Self', 'Admin'].includes(deletedBy)) {
      query.deletedBy = deletedBy;
    }

    if (startDate || endDate) {
      query.accountDeletedDate = {};
      if (startDate) {
        query.accountDeletedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.accountDeletedDate.$lte = end;
      }
    }

    const deletedAccounts = await DeletedAccount.find(query).sort({ accountDeletedDate: -1 });

    res.status(200).json({
      status: 'success',
      count: deletedAccounts.length,
      deletedAccounts,
    });
  } catch (error) {
    console.error('[ADMIN] Get deleted accounts error:', error.message);
    res.status(500).json({ status: 'error', message: 'Error retrieving deleted account audit history.' });
  }
};


// Get Communities
export const getCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: communities.length, communities });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving communities.' });
  }
};

// Moderate Community
export const moderateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    await Community.findByIdAndDelete(id);

    await logAdminAction(req.user._id, 'DELETE_COMMUNITY', 'Community', id, 'Deleted community for policy violation');

    res.status(200).json({ status: 'success', message: 'Community deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error moderating community.' });
  }
};

// Get Projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving projects.' });
  }
};

/**
 * @desc    Moderate project (delete)
 * @route   DELETE /api/admin/projects/:id
 * @access  Private (Admin / Super Admin)
 */
export const moderateProject = async (req, res) => {
  try {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);

    await logAdminAction(req.user._id, 'DELETE_PROJECT', 'Project', id, 'Deleted project workspace');

    res.status(200).json({ status: 'success', message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error moderating project.' });
  }
};

/**
 * @desc    Get resources for moderation
 * @route   GET /api/admin/resources
 * @access  Private (Admin / Super Admin)
 */
export const getResources = async (req, res) => {
  try {
    let resources = await Resource.find().populate('creator', 'name email').sort({ createdAt: -1 });

    if (resources.length === 0 && req.user) {
      const defaultResources = [
        {
          creator: req.user._id,
          title: 'System Architecture & Microservices Guide',
          shortDescription: 'Comprehensive overview of microservices patterns, message queues, and API gateways.',
          content: 'A complete architectural guide to building scalable Node.js microservices with event-driven architecture.',
          resourceType: 'Documentation',
          category: 'Web Development',
          visibility: 'Public',
          likesCount: 12,
          views: 145,
        },
        {
          creator: req.user._id,
          title: 'Mastering React 19 & Modern Hooks',
          shortDescription: 'Best practices for state management, custom hooks, and server components.',
          content: 'In-depth guide covering performance optimization, memory leak prevention, and custom React hooks.',
          resourceType: 'Article',
          category: 'Web Development',
          visibility: 'Public',
          likesCount: 8,
          views: 98,
        },
      ];
      await Resource.insertMany(defaultResources);
      resources = await Resource.find().populate('creator', 'name email').sort({ createdAt: -1 });
    }

    res.status(200).json({ status: 'success', count: resources.length, resources });
  } catch (error) {
    console.error('[ADMIN GET RESOURCES ERROR]:', error);
    res.status(500).json({ status: 'error', message: 'Error retrieving resources.' });
  }
};

/**
 * @desc    Moderate resource (delete)
 * @route   DELETE /api/admin/resources/:id
 * @access  Private (Admin / Super Admin)
 */
export const moderateResource = async (req, res) => {
  try {
    const { id } = req.params;
    await Resource.findByIdAndDelete(id);

    await logAdminAction(req.user._id, 'DELETE_RESOURCE', 'Resource', id, 'Deleted resource document');

    res.status(200).json({ status: 'success', message: 'Resource deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error moderating resource.' });
  }
};

/**
 * @desc    Get workshops for moderation
 * @route   GET /api/admin/workshops
 * @access  Private (Admin / Super Admin)
 */
export const getWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find().populate('host', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: workshops.length, workshops });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving workshops.' });
  }
};

/**
 * @desc    Moderate workshop (cancel / delete)
 * @route   DELETE /api/admin/workshops/:id
 * @access  Private (Admin / Super Admin)
 */
export const moderateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    await Workshop.findByIdAndDelete(id);

    await logAdminAction(req.user._id, 'DELETE_WORKSHOP', 'Workshop', id, 'Deleted workshop event');

    res.status(200).json({ status: 'success', message: 'Workshop deleted.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error moderating workshop.' });
  }
};

/**
 * @desc    Submit content report (Any User)
 * @route   POST /api/reports
 * @access  Private
 */
export const submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description,
    });

    res.status(201).json({ status: 'success', report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to submit report.' });
  }
};

/**
 * @desc    Get reports queue (Admin / Super Admin)
 * @route   GET /api/admin/reports
 * @access  Private (Admin / Super Admin)
 */
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('reporter', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving reports queue.' });
  }
};

/**
 * @desc    Resolve or dismiss report (Admin / Super Admin)
 * @route   PUT /api/admin/reports/:id
 * @access  Private (Admin / Super Admin)
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ status: 'fail', message: 'Report not found.' });
    }

    report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    report.reviewedBy = req.user._id;
    await report.save();

    await logAdminAction(req.user._id, 'RESOLVE_REPORT', 'Report', id, `Set report status to ${status}`);

    res.status(200).json({ status: 'success', report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error updating report.' });
  }
};

/**
 * @desc    Publish system announcement (Admin / Super Admin)
 * @route   POST /api/admin/announcements
 * @access  Private (Admin / Super Admin)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, isBanner } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'General',
      isBanner: isBanner !== undefined ? isBanner : true,
      createdBy: req.user._id,
    });

    await logAdminAction(req.user._id, 'PUBLISH_ANNOUNCEMENT', 'Announcement', announcement._id.toString(), `Published ${title}`);

    res.status(201).json({ status: 'success', announcement });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to publish announcement.' });
  }
};

/**
 * @desc    Get active announcements
 * @route   GET /api/admin/announcements
 * @access  Private
 */
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(5);
    res.status(200).json({ status: 'success', announcements });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving announcements.' });
  }
};

/**
 * @desc    Get platform overall analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin / Super Admin)
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const analytics = await getPlatformAnalyticsService();
    res.status(200).json({ status: 'success', analytics });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving platform analytics.' });
  }
};

/**
 * @desc    Get security audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Super Admin)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('admin', 'name email role').sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ status: 'success', count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving audit logs.' });
  }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private (Super Admin)
 */
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await getSystemSettingsService();
    res.status(200).json({ status: 'success', settings });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving system settings.' });
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private (Super Admin)
 */
export const updateSystemSettings = async (req, res) => {
  try {
    const settings = await updateSystemSettingsService(req.body, req.user._id);
    res.status(200).json({ status: 'success', settings });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error updating system settings.' });
  }
};
