import mongoose from 'mongoose';
import Workshop from '../models/Workshop.js';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Profile from '../models/Profile.js';
import { enrichWorkshopsWithUserFlags, canUserRegisterForWorkshop } from '../services/workshopService.js';
import { createNotification } from '../services/notificationService.js';
import { processImageUpload } from '../services/uploadService.js';

/**
 * @desc    Get workshops discovery feed with search & filters
 * @route   GET /api/workshops
 * @access  Private
 */
export const getWorkshops = async (req, res) => {
  try {
    const { search, category, eventType, mode, communityId, projectId } = req.query;
    const userId = req.user._id;

    let filter = { status: { $ne: 'Cancelled' } };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }
    if (eventType) {
      filter.eventType = eventType;
    }
    if (mode) {
      filter.mode = mode;
    }
    if (communityId && mongoose.Types.ObjectId.isValid(communityId)) {
      filter.community = communityId;
    }
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      filter.project = projectId;
    }

    const rawWorkshops = await Workshop.find(filter)
      .sort({ date: 1 })
      .populate('host', 'name email')
      .populate('community', 'communityName slug logo')
      .populate('project', 'title category');

    const workshops = await enrichWorkshopsWithUserFlags(rawWorkshops, userId);

    res.status(200).json({
      status: 'success',
      results: workshops.length,
      workshops,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching workshops.',
    });
  }
};

/**
 * @desc    Get single workshop details by ID
 * @route   GET /api/workshops/:id
 * @access  Private
 */
export const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid workshop ID.',
      });
    }

    const workshop = await Workshop.findById(id)
      .populate('host', 'name email')
      .populate('community', 'communityName slug logo')
      .populate('project', 'title category teamSize');

    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    const hostProfile = await Profile.findOne({ userId: workshop.host._id });
    const enriched = (await enrichWorkshopsWithUserFlags([workshop], userId))[0];
    enriched.hostProfile = hostProfile ? hostProfile.toObject() : null;

    res.status(200).json({
      status: 'success',
      workshop: enriched,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving workshop details.',
    });
  }
};

/**
 * @desc    Get user's workshops (Hosting, Registered, Completed, Cancelled)
 * @route   GET /api/workshops/my
 * @access  Private
 */
export const getMyWorkshops = async (req, res) => {
  try {
    const userId = req.user._id;

    // Hosted
    const rawHosted = await Workshop.find({ host: userId })
      .sort({ date: 1 })
      .populate('host', 'name email')
      .populate('community', 'communityName slug')
      .populate('project', 'title');

    // Registered
    const registrations = await WorkshopRegistration.find({ user: userId }).select('workshop');
    const registeredWorkshopIds = registrations.map((r) => r.workshop);

    const rawRegistered = await Workshop.find({
      _id: { $in: registeredWorkshopIds },
      host: { $ne: userId },
    })
      .sort({ date: 1 })
      .populate('host', 'name email')
      .populate('community', 'communityName slug')
      .populate('project', 'title');

    const hosting = await enrichWorkshopsWithUserFlags(rawHosted, userId);
    const registered = await enrichWorkshopsWithUserFlags(rawRegistered, userId);

    res.status(200).json({
      status: 'success',
      data: {
        hosting,
        registered,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching user workshops.',
    });
  }
};

/**
 * @desc    Create a new workshop/event
 * @route   POST /api/workshops
 * @access  Private
 */
export const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      description,
      eventType,
      category,
      tags,
      mode,
      meetingLink,
      location,
      community,
      project,
      date,
      startTime,
      endTime,
      duration,
      maxParticipants,
    } = req.body;

    const hostId = req.user._id;

    let bannerImage = '';
    if (req.file) {
      bannerImage = await processImageUpload(req.file, 'connectcraft/workshops');
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }

    const workshop = new Workshop({
      host: hostId,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      eventType: eventType || 'Workshop',
      category,
      tags: parsedTags,
      mode: mode || 'Online',
      meetingLink: meetingLink ? meetingLink.trim() : '',
      location: location ? location.trim() : '',
      community: community && mongoose.Types.ObjectId.isValid(community) ? community : null,
      project: project && mongoose.Types.ObjectId.isValid(project) ? project : null,
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || '60 mins',
      maxParticipants: maxParticipants ? Number(maxParticipants) : 50,
      bannerImage,
      status: 'Upcoming',
    });

    await workshop.save();

    // Trigger notification to Community Members if Community Scoped
    if (workshop.community) {
      const comm = await Community.findById(workshop.community);
      if (comm && comm.members) {
        comm.members.forEach((memberId) => {
          if (memberId.toString() !== hostId.toString()) {
            createNotification({
              recipientId: memberId,
              senderId: hostId,
              type: 'community_announcement',
              title: `New Community Event: ${workshop.title}`,
              message: `${req.user.name || 'A host'} organized a new event "${workshop.title}" in ${comm.communityName}.`,
              referenceId: workshop._id,
              referenceType: 'Workshop',
            });
          }
        });
      }
    }

    // Trigger notification to Project Members if Project Scoped
    if (workshop.project) {
      const pMembers = await ProjectMember.find({ project: workshop.project });
      pMembers.forEach((pm) => {
        if (pm.user.toString() !== hostId.toString()) {
          createNotification({
            recipientId: pm.user,
            senderId: hostId,
            type: 'added_to_project',
            title: `Project Meeting Scheduled: ${workshop.title}`,
            message: `${req.user.name || 'Project host'} scheduled a meeting "${workshop.title}".`,
            referenceId: workshop._id,
            referenceType: 'Workshop',
          });
        }
      });
    }

    res.status(201).json({
      status: 'success',
      workshop,
    });
  } catch (error) {
    console.error('[WORKSHOP] Error creating workshop:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating workshop. Please try again.',
    });
  }
};

/**
 * @desc    Update workshop details (Host only)
 * @route   PUT /api/workshops/:id
 * @access  Private
 */
export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    if (workshop.host.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the host can edit this workshop.',
      });
    }

    const fieldsToUpdate = [
      'title',
      'shortDescription',
      'description',
      'eventType',
      'category',
      'mode',
      'meetingLink',
      'location',
      'date',
      'startTime',
      'endTime',
      'duration',
      'maxParticipants',
      'status',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        workshop[field] = req.body[field];
      }
    });

    if (req.file) {
      workshop.bannerImage = await processImageUpload(req.file, 'connectcraft/workshops');
    }

    if (req.body.tags) {
      workshop.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map((t) => t.trim());
    }

    await workshop.save();

    // Notify registered participants of update
    const regs = await WorkshopRegistration.find({ workshop: id });
    regs.forEach((r) => {
      createNotification({
        recipientId: r.user,
        senderId: userId,
        type: 'system',
        title: `Workshop Details Updated: ${workshop.title}`,
        message: `The host updated the details for "${workshop.title}".`,
        referenceId: workshop._id,
        referenceType: 'Workshop',
      });
    });

    res.status(200).json({
      status: 'success',
      workshop,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error updating workshop.',
    });
  }
};

/**
 * @desc    Delete / Cancel workshop (Host only)
 * @route   DELETE /api/workshops/:id
 * @access  Private
 */
export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    if (workshop.host.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the host can cancel or delete this workshop.',
      });
    }

    // Notify registered participants
    const regs = await WorkshopRegistration.find({ workshop: id });
    regs.forEach((r) => {
      createNotification({
        recipientId: r.user,
        senderId: userId,
        type: 'system',
        title: `Workshop Cancelled: ${workshop.title}`,
        message: `The workshop "${workshop.title}" has been cancelled by the host.`,
        referenceId: workshop._id,
        referenceType: 'Workshop',
      });
    });

    await WorkshopRegistration.deleteMany({ workshop: id });
    await Workshop.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Workshop deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting workshop.',
    });
  }
};

/**
 * @desc    Register user for a workshop
 * @route   POST /api/workshops/:id/register
 * @access  Private
 */
export const registerWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    const check = await canUserRegisterForWorkshop(workshop, userId);
    if (!check.valid) {
      return res.status(400).json({
        status: 'fail',
        message: check.message,
      });
    }

    const registration = new WorkshopRegistration({
      workshop: id,
      user: userId,
    });
    await registration.save();

    // Trigger confirmation notification to user
    createNotification({
      recipientId: userId,
      senderId: workshop.host,
      type: 'system',
      title: `Registration Confirmed: ${workshop.title}`,
      message: `You successfully registered for "${workshop.title}" on ${new Date(workshop.date).toLocaleDateString()}.`,
      referenceId: workshop._id,
      referenceType: 'Workshop',
    });

    res.status(201).json({
      status: 'success',
      message: 'Successfully registered for workshop.',
      registration,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error registering for workshop.',
    });
  }
};

/**
 * @desc    Cancel workshop registration
 * @route   DELETE /api/workshops/:id/register
 * @access  Private
 */
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const registration = await WorkshopRegistration.findOne({
      workshop: id,
      user: userId,
    });

    if (!registration) {
      return res.status(404).json({
        status: 'fail',
        message: 'You are not registered for this workshop.',
      });
    }

    await WorkshopRegistration.findByIdAndDelete(registration._id);

    res.status(200).json({
      status: 'success',
      message: 'Registration cancelled successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error cancelling registration.',
    });
  }
};

/**
 * @desc    Get registered participants roster for host
 * @route   GET /api/workshops/:id/participants
 * @access  Private (Host only)
 */
export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    if (workshop.host.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the host can view participant roster details.',
      });
    }

    const registrations = await WorkshopRegistration.find({ workshop: id })
      .sort({ registeredAt: -1 })
      .populate('user', 'name email');

    const userIds = registrations.map((r) => r.user._id);
    const profiles = await Profile.find({ userId: { $in: userIds } });

    const participants = registrations.map((r) => {
      const rObj = r.toObject();
      const p = profiles.find((prof) => prof.userId.toString() === r.user._id.toString());
      rObj.profile = p ? p.toObject() : null;
      return rObj;
    });

    res.status(200).json({
      status: 'success',
      participants,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching participants.',
    });
  }
};

/**
 * @desc    Remove participant from workshop (Host only)
 * @route   DELETE /api/workshops/:id/participants/:userId
 * @access  Private (Host only)
 */
export const removeParticipant = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const hostId = req.user._id;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workshop not found.',
      });
    }

    if (workshop.host.toString() !== hostId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the host can remove participants.',
      });
    }

    await WorkshopRegistration.findOneAndDelete({
      workshop: id,
      user: targetUserId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Participant removed from workshop.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error removing participant.',
    });
  }
};
