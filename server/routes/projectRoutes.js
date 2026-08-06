import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createProject,
  getDiscoverProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteConnection,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  removeMember,
  leaveProject,
  getProjectMeetings,
  createProjectMeeting,
  deleteProjectMeeting,
} from '../controllers/projectController.js';

const router = express.Router();

// Project Discovery & My Projects
router.get('/discover', protect, getDiscoverProjects);
router.get('/my', protect, getMyProjects);

// Project CRUD
router.post('/', protect, createProject);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

// Member Actions
router.post('/:id/invite', protect, inviteConnection);
router.delete('/:projectId/members/:memberId', protect, removeMember);
router.post('/:id/leave', protect, leaveProject);

// Project Team Sync Meetings
router.get('/:id/meetings', protect, getProjectMeetings);
router.post('/:id/meetings', protect, createProjectMeeting);
router.delete('/:id/meetings/:meetingId', protect, deleteProjectMeeting);

// Invitation Actions (under /api/projects/invitations)
router.post('/invitations/:id/accept', protect, acceptInvitation);
router.post('/invitations/:id/reject', protect, rejectInvitation);
router.post('/invitations/:id/cancel', protect, cancelInvitation);

export default router;
