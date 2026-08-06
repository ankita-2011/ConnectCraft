import mongoose from 'mongoose';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectInvitation from '../models/ProjectInvitation.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { enrichProjects, validateProjectInvite, getProjectMemberCountsMap } from '../services/projectService.js';
import { createNotification } from '../services/notificationService.js';


/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      description,
      category,
      requiredSkills = [],
      tags = [],
      difficulty = 'Intermediate',
      estimatedDuration = '1-2 months',
      teamSize = 4,
      visibility = 'Public',
      status = 'Recruiting',
      bannerImage = '',
    } = req.body;

    if (!title || !shortDescription || !description || !category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide title, short description, detailed description, and category.',
      });
    }

    if (teamSize < 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'Team size must be at least 1 member.',
      });
    }

    const project = new Project({
      owner: req.user._id,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category: category.trim(),
      requiredSkills,
      tags,
      difficulty,
      estimatedDuration: estimatedDuration.trim(),
      teamSize: Number(teamSize),
      visibility,
      status,
      bannerImage,
    });

    await project.save();

    // Automatically add owner to ProjectMember
    await ProjectMember.create({
      project: project._id,
      user: req.user._id,
      role: 'Owner',
    });

    res.status(201).json({
      status: 'success',
      project,
    });
  } catch (error) {
    console.error('[PROJECT] Error creating project:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating project. Please try again.',
    });
  }
};

/**
 * @desc    Discover public projects with filters & search
 * @route   GET /api/projects/discover
 * @access  Private
 */
export const getDiscoverProjects = async (req, res) => {
  try {
    const {
      q,
      category,
      skill,
      difficulty,
      status,
      visibility,
      sortBy = 'newest',
      page = 1,
      limit = 9,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 9;
    const skipNum = (pageNum - 1) * limitNum;

    // Filter criteria
    const matchStage = {};

    // Filter visibility (default Public for discover)
    if (visibility) {
      matchStage.visibility = visibility;
    } else {
      matchStage.visibility = 'Public';
    }

    if (category) {
      matchStage.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    if (difficulty) {
      matchStage.difficulty = difficulty;
    }
    if (status) {
      matchStage.status = status;
    }
    if (skill) {
      matchStage.requiredSkills = { $elemMatch: { $regex: `^${skill.trim()}$`, $options: 'i' } };
    }

    if (q) {
      const sanitized = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      matchStage.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { shortDescription: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
        { requiredSkills: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
      ];
    }

    let sortStage = { createdAt: -1 };
    if (sortBy === 'team_size') {
      sortStage = { teamSize: -1, createdAt: -1 };
    } else if (sortBy === 'alphabetical') {
      sortStage = { title: 1 };
    }

    const total = await Project.countDocuments(matchStage);
    const rawProjects = await Project.find(matchStage)
      .sort(sortStage)
      .skip(skipNum)
      .limit(limitNum)
      .populate('owner', 'name email');

    const enrichedProjects = await enrichProjects(rawProjects, req.user._id);

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      projects: enrichedProjects,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while discovering projects.',
    });
  }
};

/**
 * @desc    Get user's projects (Owned, Joined, Pending Invitations, Sent Invitations, Completed)
 * @route   GET /api/projects/my
 * @access  Private
 */
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Owned projects
    const ownedRaw = await Project.find({ owner: userId }).sort({ createdAt: -1 }).populate('owner', 'name email');
    const owned = await enrichProjects(ownedRaw, userId);

    // 2. Joined projects (collaborator role)
    const memberships = await ProjectMember.find({ user: userId, role: 'Collaborator' });
    const joinedProjectIds = memberships.map((m) => m.project);
    const joinedRaw = await Project.find({ _id: { $in: joinedProjectIds } })
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');
    const joined = await enrichProjects(joinedRaw, userId);

    // 3. Pending received invitations
    const pendingInvites = await ProjectInvitation.find({
      receiver: userId,
      status: 'Pending',
    })
      .populate('project')
      .populate('sender', 'name email');

    const senderIds = pendingInvites.map((i) => i.sender._id);
    const senderProfiles = await Profile.find({ userId: { $in: senderIds } });

    const pendingInvitations = pendingInvites.map((inv) => {
      const p = senderProfiles.find((profile) => profile.userId.toString() === inv.sender._id.toString());
      const invObj = inv.toObject();
      invObj.senderProfile = p ? p.toObject() : null;
      return invObj;
    });

    // 4. Sent invitations
    const sentInvites = await ProjectInvitation.find({
      sender: userId,
      status: 'Pending',
    })
      .populate('project')
      .populate('receiver', 'name email');

    const receiverIds = sentInvites.map((i) => i.receiver._id);
    const receiverProfiles = await Profile.find({ userId: { $in: receiverIds } });

    const sentInvitations = sentInvites.map((inv) => {
      const p = receiverProfiles.find((profile) => profile.userId.toString() === inv.receiver._id.toString());
      const invObj = inv.toObject();
      invObj.receiverProfile = p ? p.toObject() : null;
      return invObj;
    });

    // 5. Completed projects
    const allUserMemberships = await ProjectMember.find({ user: userId });
    const allProjectIds = allUserMemberships.map((m) => m.project);
    const completedRaw = await Project.find({
      _id: { $in: allProjectIds },
      status: 'Completed',
    }).populate('owner', 'name email');
    const completed = await enrichProjects(completedRaw, userId);

    res.status(200).json({
      status: 'success',
      data: {
        owned,
        joined,
        pendingInvitations,
        sentInvitations,
        completed,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user projects.',
    });
  }
};

/**
 * @desc    Get project details by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID.',
      });
    }

    const project = await Project.findById(id).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    // Members check
    const members = await ProjectMember.find({ project: id }).populate('user', 'name email');
    const memberUserIds = members.map((m) => m.user._id);

    const isMember = memberUserIds.some((mId) => mId.toString() === userId.toString());
    const isOwner = project.owner._id.toString() === userId.toString();

    // Check visibility authorization
    if (project.visibility === 'Private' && !isMember && !isOwner) {
      return res.status(403).json({
        status: 'fail',
        message: 'This project is private and accessible to team members only.',
      });
    }

    // Attach profile details for members roster
    const profiles = await Profile.find({ userId: { $in: memberUserIds } });
    const enrichedMembers = members.map((m) => {
      const p = profiles.find((prof) => prof.userId.toString() === m.user._id.toString());
      const mObj = m.toObject();
      mObj.userProfile = p ? p.toObject() : null;
      return mObj;
    });

    const memberCount = members.length;
    const openPositions = Math.max(0, project.teamSize - memberCount);

    // Check user's role and pending invitation
    let userRole = null;
    const currentUserMember = members.find((m) => m.user._id.toString() === userId.toString());
    if (currentUserMember) {
      userRole = currentUserMember.role;
    }

    const pendingInvite = await ProjectInvitation.findOne({
      project: id,
      receiver: userId,
      status: 'Pending',
    }).populate('sender', 'name email');

    const projectObj = project.toObject();
    projectObj.memberCount = memberCount;
    projectObj.openPositions = openPositions;
    projectObj.isOwner = isOwner;
    projectObj.isMember = isMember;
    projectObj.userRole = userRole;

    res.status(200).json({
      status: 'success',
      project: projectObj,
      members: enrichedMembers,
      pendingInvite,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving project details.',
    });
  }
};

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private (Owner only)
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the project owner can update project details.',
      });
    }

    const {
      title,
      shortDescription,
      description,
      category,
      requiredSkills,
      tags,
      difficulty,
      estimatedDuration,
      teamSize,
      visibility,
      status,
      bannerImage,
    } = req.body;

    if (title !== undefined) project.title = title.trim();
    if (shortDescription !== undefined) project.shortDescription = shortDescription.trim();
    if (description !== undefined) project.description = description.trim();
    if (category !== undefined) project.category = category.trim();
    if (requiredSkills !== undefined) project.requiredSkills = requiredSkills;
    if (tags !== undefined) project.tags = tags;
    if (difficulty !== undefined) project.difficulty = difficulty;
    if (estimatedDuration !== undefined) project.estimatedDuration = estimatedDuration;
    if (teamSize !== undefined) project.teamSize = Number(teamSize);
    if (visibility !== undefined) project.visibility = visibility;
    if (status !== undefined) project.status = status;
    if (bannerImage !== undefined) project.bannerImage = bannerImage;

    await project.save();

    res.status(200).json({
      status: 'success',
      project,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error updating project.',
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the project owner can delete this project.',
      });
    }

    await Project.findByIdAndDelete(id);
    await ProjectMember.deleteMany({ project: id });
    await ProjectInvitation.deleteMany({ project: id });

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting project.',
    });
  }
};

/**
 * @desc    Invite connection to join project
 * @route   POST /api/projects/:id/invite
 * @access  Private (Owner only)
 */
export const inviteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId, message = '' } = req.body;
    const senderId = req.user._id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    if (project.owner.toString() !== senderId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the project owner can send invitations.',
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Recipient ID is required.',
      });
    }

    const validation = await validateProjectInvite(senderId, receiverId, id);
    if (!validation.valid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.message,
      });
    }

    const invitation = new ProjectInvitation({
      project: id,
      sender: senderId,
      receiver: receiverId,
      message: message.slice(0, 250),
      status: 'Pending',
    });

    await invitation.save();

    // Trigger real-time notification
    createNotification({
      recipientId: receiverId,
      senderId: senderId,
      type: 'project_invitation',
      title: 'Project Collaboration Invite',
      message: `${req.user.name || 'A peer'} invited you to join "${project.title}".`,
      referenceId: invitation._id,
      referenceType: 'ProjectInvitation',
    });

    res.status(201).json({
      status: 'success',
      invitation,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error sending project invitation.',
    });
  }
};

/**
 * @desc    Accept project invitation
 * @route   POST /api/project-invitations/:id/accept
 * @access  Private
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const invitation = await ProjectInvitation.findById(id).populate('project');
    if (!invitation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invitation not found.',
      });
    }

    if (invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to accept this invitation.',
      });
    }

    if (invitation.status !== 'Pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Invitation is already ${invitation.status}.`,
      });
    }

    const project = invitation.project;
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Associated project no longer exists.',
      });
    }

    // Check capacity
    const currentMemberCount = await ProjectMember.countDocuments({ project: project._id });
    if (currentMemberCount >= project.teamSize) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project has reached its maximum team size capacity.',
      });
    }

    // Update invitation status
    invitation.status = 'Accepted';
    await invitation.save();

    // Create member record (Collaborator)
    const member = await ProjectMember.create({
      project: project._id,
      user: userId,
      role: 'Collaborator',
    });

    // Trigger real-time notification to project owner
    createNotification({
      recipientId: invitation.sender,
      senderId: userId,
      type: 'project_invitation_accepted',
      title: 'Project Invite Accepted',
      message: `${req.user.name || 'A peer'} accepted your invitation to join "${project.title}".`,
      referenceId: project._id,
      referenceType: 'Project',
    });

    res.status(200).json({
      status: 'success',
      message: 'Project invitation accepted.',
      member,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error accepting invitation.',
    });
  }
};

/**
 * @desc    Reject project invitation
 * @route   POST /api/project-invitations/:id/reject
 * @access  Private
 */
export const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const invitation = await ProjectInvitation.findById(id).populate('project');
    if (!invitation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invitation not found.',
      });
    }

    if (invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to reject this invitation.',
      });
    }

    if (invitation.status !== 'Pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Invitation is already ${invitation.status}.`,
      });
    }

    invitation.status = 'Rejected';
    await invitation.save();

    // Trigger real-time notification to project owner
    createNotification({
      recipientId: invitation.sender,
      senderId: userId,
      type: 'project_invitation_rejected',
      title: 'Project Invite Declined',
      message: `${req.user.name || 'A peer'} declined the invitation to join "${invitation.project?.title || 'Project'}".`,
      referenceId: invitation.project?._id || '',
      referenceType: 'Project',
    });

    res.status(200).json({
      status: 'success',
      message: 'Project invitation rejected.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error rejecting invitation.',
    });
  }
};

/**
 * @desc    Cancel sent project invitation
 * @route   POST /api/project-invitations/:id/cancel
 * @access  Private
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const invitation = await ProjectInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invitation not found.',
      });
    }

    if (invitation.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only cancel invitations you sent.',
      });
    }

    if (invitation.status !== 'Pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Invitation is already ${invitation.status}.`,
      });
    }

    invitation.status = 'Cancelled';
    await invitation.save();

    res.status(200).json({
      status: 'success',
      message: 'Project invitation cancelled.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error cancelling invitation.',
    });
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:projectId/members/:memberId
 * @access  Private (Owner only)
 */
export const removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the project owner can remove members.',
      });
    }

    if (memberId.toString() === project.owner.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot remove the project owner.',
      });
    }

    const memberRecord = await ProjectMember.findOneAndDelete({
      project: projectId,
      user: memberId,
    });

    if (!memberRecord) {
      return res.status(404).json({
        status: 'fail',
        message: 'Member record not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Member removed from project successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error removing member.',
    });
  }
};

/**
 * @desc    Leave project
 * @route   POST /api/projects/:id/leave
 * @access  Private
 */
export const leaveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      });
    }

    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project owner cannot leave the project. Delete project or transfer ownership.',
      });
    }

    const memberRecord = await ProjectMember.findOneAndDelete({
      project: id,
      user: userId,
    });

    if (!memberRecord) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are not a member of this project.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'You have left the project.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while leaving project.',
    });
  }
};

/**
 * @desc    Get meetings for a specific project
 * @route   GET /api/projects/:id/meetings
 * @access  Private
 */
export const getProjectMeetings = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Project not found.' });
    }

    const meetings = await ProjectMeeting.find({ project: id })
      .sort({ meetingDate: 1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      meetings,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error retrieving project meetings.' });
  }
};

/**
 * @desc    Schedule a new meeting for a project
 * @route   POST /api/projects/:id/meetings
 * @access  Private (Project Owner or Member)
 */
export const createProjectMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, agenda, meetingDate, durationMinutes, platform, meetingLink } = req.body;

    if (!title || !meetingDate || !meetingLink) {
      return res.status(400).json({
        status: 'fail',
        message: 'Meeting title, date/time, and meeting link are required.',
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Project not found.' });
    }

    const isOwner = project.owner.toString() === userId.toString();
    const isMember = await ProjectMember.exists({ project: id, user: userId });

    if (!isOwner && !isMember) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only active team members or owners can schedule project meetings.',
      });
    }

    const meeting = await ProjectMeeting.create({
      project: id,
      title: title.trim(),
      agenda: (agenda || '').trim(),
      meetingDate: new Date(meetingDate),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      platform: platform || 'Google Meet',
      meetingLink: meetingLink.trim(),
      createdBy: userId,
    });

    await meeting.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      meeting,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error creating project meeting.' });
  }
};

/**
 * @desc    Delete / Cancel a project meeting
 * @route   DELETE /api/projects/:id/meetings/:meetingId
 * @access  Private (Meeting Creator or Project Owner)
 */
export const deleteProjectMeeting = async (req, res) => {
  try {
    const { id, meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await ProjectMeeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ status: 'fail', message: 'Meeting not found.' });
    }

    const project = await Project.findById(id);
    const isOwner = project && project.owner.toString() === userId.toString();
    const isCreator = meeting.createdBy.toString() === userId.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the meeting creator or project owner can delete this meeting.',
      });
    }

    await ProjectMeeting.findByIdAndDelete(meetingId);

    res.status(200).json({
      status: 'success',
      message: 'Project meeting deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error deleting project meeting.' });
  }
};
