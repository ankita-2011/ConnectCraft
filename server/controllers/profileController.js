import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Resource from '../models/Resource.js';
import ResourceLike from '../models/ResourceLike.js';
import ResourceBookmark from '../models/ResourceBookmark.js';
import jwt from 'jsonwebtoken';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Workshop from '../models/Workshop.js';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import { generateRecommendationReasons } from '../services/recommendationService.js';
import { processImageUpload } from '../services/uploadService.js';
import { hardDeleteUserAccount } from '../services/accountDeletionService.js';
import { broadcastOnlineUsers } from '../socket/socketManager.js';


// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Auto-generate unique username
const generateUniqueUsername = async (fullName) => {
  // Convert to lowercase, remove spaces and special characters
  let baseUsername = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!baseUsername) {
    baseUsername = 'user';
  }

  let username = baseUsername;
  let counter = 1;
  let exists = await Profile.findOne({ username });

  // Append incrementing numbers if username is already taken
  while (exists) {
    username = `${baseUsername}${counter}`;
    exists = await Profile.findOne({ username });
    counter++;
  }

  return username;
};

// Helper: Calculate Profile Completion Percentage
const calculateCompletion = (profile) => {
  let score = 0;

  if (profile.headline && profile.headline.trim() !== '') {
    score += 10;
  }
  if (profile.bio && profile.bio.trim() !== '') {
    score += 10;
  }
  if (profile.location && profile.location.trim() !== '') {
    score += 10;
  }
  if (profile.skillsToTeach && profile.skillsToTeach.length > 0) {
    score += 20;
  }
  if (profile.skillsToLearn && profile.skillsToLearn.length > 0) {
    score += 20;
  }
  if (profile.interests && profile.interests.length > 0) {
    score += 10;
  }
  if (profile.languages && profile.languages.length > 0) {
    score += 10;
  }

  // Check if at least one social link is populated
  const links = profile.socialLinks || {};
  const hasSocial = Object.values(links).some(
    (link) => link && link.trim() !== ''
  );
  if (hasSocial) {
    score += 10;
  }

  return score;
};

// Helper: Delete file from local disk (if it exists)
const deleteLocalFile = (relativePath) => {
  if (!relativePath) return;
  
  try {
    const filename = relativePath.split('/uploads/')[1];
    if (!filename) return;

    const absolutePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.warn('[PROFILE] Failed to delete local file:', relativePath, err.message);
  }
};

/**
 * @desc    Get current user profile (Creates draft profile if none exists)
 * @route   GET /api/profile/me
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });

    // If profile doesn't exist, create a draft profile automatically
    if (!profile) {
      const username = await generateUniqueUsername(req.user.name);
      profile = await Profile.create({
        userId: req.user._id,
        username,
      });
    }

    // Ensure completion score is dynamically synced
    const currentScore = calculateCompletion(profile);
    if (profile.profileCompletion !== currentScore) {
      profile.profileCompletion = currentScore;
      await profile.save();
    }

    res.status(200).json({
      status: 'success',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user profile.',
    });
  }
};

/**
 * @desc    Update user profile data
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      username,
      headline,
      bio,
      location,
      skillsToTeach,
      skillsToLearn,
      interests,
      languages,
      availability,
      socialLinks,
      privacySettings,
      notificationSettings,
      onboardingCompleted,
    } = req.body;

    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile not found.',
      });
    }

    // Validate username uniqueness
    if (username && username !== profile.username) {
      const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      if (sanitizedUsername.length < 3) {
        return res.status(400).json({
          status: 'fail',
          message: 'Username must be at least 3 characters and contain alphanumeric characters, dashes, or underscores.',
        });
      }

      const usernameTaken = await Profile.findOne({ username: sanitizedUsername });
      if (usernameTaken) {
        return res.status(400).json({
          status: 'fail',
          message: 'This username is already taken.',
        });
      }
      profile.username = sanitizedUsername;
    }

    // Validate field length limits
    if (headline && headline.length > 100) {
      return res.status(400).json({
        status: 'fail',
        message: 'Headline length limit is 100 characters.',
      });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bio length limit is 500 characters.',
      });
    }

    // Validate social links format
    if (socialLinks) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      for (const [key, value] of Object.entries(socialLinks)) {
        if (value && value.trim() !== '') {
          if (!urlRegex.test(value.trim())) {
            return res.status(400).json({
              status: 'fail',
              message: `Invalid URL format for ${key}.`,
            });
          }
        }
      }
      profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
    }

    // Update profile fields
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;
    if (skillsToTeach !== undefined) profile.skillsToTeach = skillsToTeach;
    if (skillsToLearn !== undefined) profile.skillsToLearn = skillsToLearn;
    if (interests !== undefined) profile.interests = interests;
    if (languages !== undefined) profile.languages = languages;
    if (availability !== undefined) profile.availability = availability;
    if (privacySettings !== undefined) {
      profile.privacySettings = { ...profile.privacySettings, ...privacySettings };
      broadcastOnlineUsers();
    }
    if (notificationSettings !== undefined) profile.notificationSettings = { ...profile.notificationSettings, ...notificationSettings };
    if (onboardingCompleted !== undefined) profile.onboardingCompleted = onboardingCompleted;

    // Recalculate profile completion
    profile.profileCompletion = calculateCompletion(profile);

    await profile.save();

    res.status(200).json({
      status: 'success',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating profile details.',
    });
  }
};

export const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Search by username first
    let profile = await Profile.findOne({
      username: username.toLowerCase().trim(),
    }).populate('userId', 'name email role accountStatus');

    // Fallback: If identifier is a valid MongoDB ObjectId (userId or profile _id), search by userId or _id!
    if (!profile && mongoose.Types.ObjectId.isValid(username)) {
      profile = await Profile.findOne({
        $or: [
          { userId: username },
          { userId: new mongoose.Types.ObjectId(username) },
          { _id: username },
        ],
      }).populate('userId', 'name email role accountStatus');
    }

    if (!profile || !profile.userId || profile.userId.accountStatus !== 'active') {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile not found or is currently unavailable.',
      });
    }

    // Fetch user's owned and joined communities for public profile display
    const ownedCommunities = await Community.find({ owner: profile.userId._id })
      .select('communityName slug category memberCount logo');

    const joinedCommunities = await Community.find({
      members: profile.userId._id,
      owner: { $ne: profile.userId._id },
    }).select('communityName slug category memberCount logo');

    // Fetch projects created, joined, and completed for public profile display
    const projectsCreated = await Project.find({
      owner: profile.userId._id,
      visibility: 'Public',
    }).select('title shortDescription category status difficulty bannerImage teamSize createdAt');

    const joinedMemberships = await ProjectMember.find({
      user: profile.userId._id,
      role: 'Collaborator',
    });

    const joinedProjectIds = joinedMemberships.map((m) => m.project);
    const projectsJoined = await Project.find({
      _id: { $in: joinedProjectIds },
      visibility: 'Public',
      status: { $ne: 'Completed' },
    }).select('title shortDescription category status difficulty bannerImage teamSize createdAt');

    const allMemberships = await ProjectMember.find({ user: profile.userId._id });
    const allMemberProjectIds = allMemberships.map((m) => m.project);
    const projectsCompleted = await Project.find({
      _id: { $in: allMemberProjectIds },
      visibility: 'Public',
      status: 'Completed',
    }).select('title shortDescription category status difficulty bannerImage teamSize createdAt');

    // Fetch resources shared, liked, and saved for profile display
    const resourcesShared = await Resource.find({
      creator: profile.userId._id,
      visibility: 'Public',
    }).select('title shortDescription resourceType category externalLink likesCount bookmarksCount views createdAt');

    const userLikes = await ResourceLike.find({ user: profile.userId._id });
    const likedResourceIds = userLikes.map((l) => l.resource);
    const resourcesLiked = await Resource.find({
      _id: { $in: likedResourceIds },
      visibility: 'Public',
    }).select('title shortDescription resourceType category externalLink likesCount bookmarksCount views createdAt');

    const userBookmarks = await ResourceBookmark.find({ user: profile.userId._id });
    const bookmarkedResourceIds = userBookmarks.map((b) => b.resource);
    const resourcesSaved = await Resource.find({
      _id: { $in: bookmarkedResourceIds },
      visibility: 'Public',
    }).select('title shortDescription resourceType category externalLink likesCount bookmarksCount views createdAt');

    // Workshops hosted and attended
    const workshopsHosted = await Workshop.find({ host: profile.userId._id }).select('title eventType category date mode startTime status');
    const registrations = await WorkshopRegistration.find({ user: profile.userId._id });
    const regWorkshopIds = registrations.map((r) => r.workshop);
    const workshopsAttended = await Workshop.find({ _id: { $in: regWorkshopIds } }).select('title eventType category date mode startTime status');

    // Check active connection status between viewer (if logged in) and profile user
    let connectionStatus = 'none';
    let connectionId = null;
    let requestId = null;
    let recommendationSummary = null;

    if (req.cookies && req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        const currentUserId = decoded.id;

        if (currentUserId && currentUserId.toString() !== profile.userId._id.toString()) {
          const currentUserProfile = await Profile.findOne({ userId: currentUserId });
          const myCommunities = await Community.find({ members: currentUserId }).select('communityName members');

          const connection = await Connection.findOne({
            $or: [
              { user1: currentUserId, user2: profile.userId._id },
              { user1: profile.userId._id, user2: currentUserId },
            ],
          });

          if (connection) {
            connectionStatus = 'connected';
            connectionId = connection._id;
          } else {
            const request = await ConnectionRequest.findOne({
              $or: [
                { sender: currentUserId, receiver: profile.userId._id, status: 'pending' },
                { sender: profile.userId._id, receiver: currentUserId, status: 'pending' },
              ],
            });

            if (request) {
              connectionStatus =
                request.sender.toString() === currentUserId.toString()
                  ? 'pending_sent'
                  : 'pending_received';
              requestId = request._id;
              recommendationSummary = request.recommendationSummary;
            }
          }

          if (!recommendationSummary && currentUserProfile) {
            recommendationSummary = generateRecommendationReasons(currentUserProfile, profile, myCommunities);
          }
        }
      } catch (err) {
        // Quiet catch token error
      }
    }

    res.status(200).json({
      status: 'success',
      profile,
      ownedCommunities,
      joinedCommunities,
      projectsCreated,
      projectsJoined,
      projectsCompleted,
      resourcesShared,
      resourcesLiked,
      resourcesSaved,
      workshopsHosted,
      workshopsAttended,
      connectionStatus,
      connectionId,
      requestId,
      recommendationSummary,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching profile details.',
    });
  }
};

/**
 * @desc    Upload profile avatar photo
 * @route   POST /api/profile/photo
 * @access  Private
 */
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload an image file.',
      });
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile not found.',
      });
    }

    // Upload image to Cloudinary (or local fallback)
    const imageUrl = await processImageUpload(req.file, 'connectcraft/avatars');
    profile.profilePhoto = imageUrl;
    profile.profileCompletion = calculateCompletion(profile);
    await profile.save();

    res.status(200).json({
      status: 'success',
      profilePhoto: profile.profilePhoto,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while uploading profile photo.',
    });
  }
};

/**
 * @desc    Remove profile avatar photo
 * @route   DELETE /api/profile/photo
 * @access  Private
 */
export const deletePhoto = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile not found.',
      });
    }

    profile.profilePhoto = '';
    profile.profileCompletion = calculateCompletion(profile);
    await profile.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile photo removed successfully.',
      profilePhoto: '',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while removing profile photo.',
    });
  }
};

/**
 * @desc    Upload profile banner cover
 * @route   POST /api/profile/cover
 * @access  Private
 */
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload an image file.',
      });
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile not found.',
      });
    }

    // Upload cover image to Cloudinary (or local fallback)
    const imageUrl = await processImageUpload(req.file, 'connectcraft/covers');
    profile.coverPhoto = imageUrl;
    await profile.save();

    res.status(200).json({
      status: 'success',
      coverPhoto: profile.coverPhoto,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while uploading cover photo.',
    });
  }
};

/**
 * @desc    Permanently delete own user account (Hard Delete)
 * @route   DELETE /api/profile
 * @access  Private
 */
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, confirmationText, reason } = req.body || {};

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is required to delete your account.',
      });
    }

    if (confirmationText !== 'DELETE') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please type DELETE to confirm account removal.',
      });
    }

    // Verify current user password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect password. Account deletion aborted.',
      });
    }

    await hardDeleteUserAccount({
      userId,
      deletedBy: 'Self',
      reason: reason || 'User requested permanent account deletion',
    });

    // Clear HttpOnly token cookie
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      status: 'success',
      message: 'Your account has been permanently deleted.',
    });
  } catch (error) {
    console.error('[PROFILE] Account deletion error:', error);
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Failed to delete account. Please try again.',
    });
  }
};

