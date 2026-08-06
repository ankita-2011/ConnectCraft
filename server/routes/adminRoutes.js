import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  bootstrap,
  registerAdmin,
  loginAdmin,
  createAdmin,
  getUsers,
  updateUserStatus,
  deleteUser,
  getDeletedAccounts,
  getCommunities,
  moderateCommunity,
  getProjects,
  moderateProject,
  getResources,
  moderateResource,
  getWorkshops,
  moderateWorkshop,
  getReports,
  updateReportStatus,
  createAnnouncement,
  getAnnouncements,
  getPlatformAnalytics,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/adminController.js';

const router = express.Router();

// Standalone Public Admin Authentication Routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// One-Time Public Super Admin Bootstrap
router.post('/bootstrap', bootstrap);

// Super Admin Only Operations
router.post('/create-admin', protect, authorizeRoles('SUPER_ADMIN'), createAdmin);
router.get('/audit-logs', protect, authorizeRoles('SUPER_ADMIN'), getAuditLogs);
router.get('/settings', protect, authorizeRoles('SUPER_ADMIN'), getSystemSettings);
router.put('/settings', protect, authorizeRoles('SUPER_ADMIN'), updateSystemSettings);

// Admin / Super Admin Operations
router.get('/analytics', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getPlatformAnalytics);
router.get('/users', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getUsers);
router.put('/users/:id/status', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateUserStatus);
router.delete('/users/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteUser);
router.get('/deleted-accounts', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getDeletedAccounts);


router.get('/communities', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getCommunities);
router.delete('/communities/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateCommunity);

router.get('/projects', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getProjects);
router.delete('/projects/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateProject);

router.get('/resources', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getResources);
router.delete('/resources/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateResource);

router.get('/workshops', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getWorkshops);
router.delete('/workshops/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateWorkshop);

router.get('/reports', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getReports);
router.put('/reports/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateReportStatus);

router.post('/announcements', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createAnnouncement);
router.get('/announcements', protect, getAnnouncements);

export default router;
