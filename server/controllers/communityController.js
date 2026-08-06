import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Community from '../models/Community.js';
import Profile from '../models/Profile.js';
import { getRecommendedCommunities } from '../services/communityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate a unique slug
const generateUniqueSlug = async (name) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, '');    // Trim hyphens from ends
  
  if (!baseSlug) baseSlug = 'community';
  
  let uniqueSlug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await Community.findOne({ slug: uniqueSlug });
    if (!existing) break;
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

/**
 * @desc    Create a new Community
 * @route   POST /api/communities
 * @access  Private
 */
export const createCommunity = async (req, res) => {
  try {
    const { communityName, description, category, tags = [], visibility = 'public', location = '', rules = [] } = req.body;
    const ownerId = req.user._id;

    if (!communityName || !description || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, description, and category are required.',
      });
    }

    const slug = await generateUniqueSlug(communityName);

    // Files handling (Multer middleware fields uploads)
    let logoPath = '';
    let coverPath = '';
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        logoPath = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.cover && req.files.cover[0]) {
        coverPath = `/uploads/${req.files.cover[0].filename}`;
      }
    }

    // Parsed tags/rules formats
    const parsedTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
    const parsedRules = Array.isArray(rules) ? rules : typeof rules === 'string' ? rules.split('\n').map(r => r.trim()).filter(Boolean) : [];

    const community = new Community({
      communityName,
      slug,
      description,
      category,
      tags: parsedTags,
      visibility,
      location,
      rules: parsedRules,
      logo: logoPath,
      coverImage: coverPath,
      owner: ownerId,
      members: [ownerId],
      memberCount: 1,
    });

    await community.save();

    res.status(201).json({
      status: 'success',
      community,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating community.',
    });
  }
};

/**
 * @desc    Get communities landing feed
 * @route   GET /api/communities
 * @access  Private
 */
export const getCommunitiesLanding = async (req, res) => {
  try {
    const userId = req.user._id;

    // Joined Communities
    const joined = await Community.find({ members: userId }).populate('owner', 'name');

    // Featured Communities (Most Members)
    const featured = await Community.find({ members: { $ne: userId } })
      .sort({ memberCount: -1 })
      .limit(6)
      .populate('owner', 'name');

    // Newest Communities
    const newest = await Community.find({ members: { $ne: userId } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('owner', 'name');

    // Recommended Communities
    const recommended = await getRecommendedCommunities(userId, 6);

    // Categories frequencies from DB
    const categoryStats = await Community.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        joined,
        featured,
        newest,
        recommended,
        categories: categoryStats.map(c => ({ name: c._id, count: c.count })),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching communities landing feeds.',
    });
  }
};

/**
 * @desc    Get Community details by unique slug
 * @route   GET /api/communities/:slug
 * @access  Private
 */
export const getCommunityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const community = await Community.findOne({ slug }).populate('owner', 'name email');
    if (!community) {
      return res.status(404).json({
        status: 'error',
        message: 'Community not found.',
      });
    }

    // Retrieve profiles of all members to display Cards in Members tab
    const memberProfiles = await Profile.find({
      userId: { $in: community.members },
    }).populate('userId', 'name email');

    res.status(200).json({
      status: 'success',
      community,
      members: memberProfiles,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving community details.',
    });
  }
};

/**
 * @desc    Update Community Details
 * @route   PUT /api/communities/:id
 * @access  Private
 */
export const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { communityName, description, category, tags = [], visibility = 'public', location = '', rules = [] } = req.body;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        status: 'error',
        message: 'Community not found.',
      });
    }

    // Auth check: Owner only
    if (community.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to modify this community.',
      });
    }

    community.communityName = communityName || community.communityName;
    community.description = description || community.description;
    community.category = category || community.category;
    community.visibility = visibility || community.visibility;
    community.location = location !== undefined ? location : community.location;

    if (tags) {
      community.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (rules) {
      community.rules = Array.isArray(rules) ? rules : rules.split('\n').map(r => r.trim()).filter(Boolean);
    }

    // Handles files update & deletes old local copies
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        if (community.logo && community.logo.startsWith('/uploads/')) {
          const oldLogoPath = path.join(__dirname, '..', community.logo);
          fs.unlink(oldLogoPath, () => {});
        }
        community.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.cover && req.files.cover[0]) {
        if (community.coverImage && community.coverImage.startsWith('/uploads/')) {
          const oldCoverPath = path.join(__dirname, '..', community.coverImage);
          fs.unlink(oldCoverPath, () => {});
        }
        community.coverImage = `/uploads/${req.files.cover[0].filename}`;
      }
    }

    await community.save();

    res.status(200).json({
      status: 'success',
      community,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error updating community settings.',
    });
  }
};

/**
 * @desc    Delete a Community
 * @route   DELETE /api/communities/:id
 * @access  Private
 */
export const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        status: 'error',
        message: 'Community not found.',
      });
    }

    if (community.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this community.',
      });
    }

    // Erase uploads from local disk
    if (community.logo && community.logo.startsWith('/uploads/')) {
      const logoPath = path.join(__dirname, '..', community.logo);
      fs.unlink(logoPath, () => {});
    }
    if (community.coverImage && community.coverImage.startsWith('/uploads/')) {
      const coverPath = path.join(__dirname, '..', community.coverImage);
      fs.unlink(coverPath, () => {});
    }

    await Community.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Community deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting community.',
    });
  }
};

/**
 * @desc    Join Community
 * @route   POST /api/communities/:id/join
 * @access  Private
 */
export const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        status: 'error',
        message: 'Community not found.',
      });
    }

    // Prevent duplicate join
    if (community.members.includes(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already a member of this community.',
      });
    }

    if (community.visibility === 'public') {
      community.members.push(userId);
      community.memberCount = community.members.length;
      await community.save();
      return res.status(200).json({
        status: 'success',
        joined: true,
        community,
      });
    } else {
      // Private Visibility: Push to joinRequests
      if (community.joinRequests.includes(userId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Join request already submitted.',
        });
      }
      community.joinRequests.push(userId);
      await community.save();
      return res.status(200).json({
        status: 'success',
        requested: true,
        community,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error joining community.',
    });
  }
};

/**
 * @desc    Leave Community
 * @route   POST /api/communities/:id/leave
 * @access  Private
 */
export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        status: 'error',
        message: 'Community not found.',
      });
    }

    if (!community.members.includes(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not a member of this community.',
      });
    }

    // Safety checks for owners
    if (community.owner.toString() === userId.toString()) {
      if (community.members.length === 1) {
        // If owner is the only member, delete community entirely!
        if (community.logo && community.logo.startsWith('/uploads/')) {
          fs.unlink(path.join(__dirname, '..', community.logo), () => {});
        }
        if (community.coverImage && community.coverImage.startsWith('/uploads/')) {
          fs.unlink(path.join(__dirname, '..', community.coverImage), () => {});
        }
        await Community.findByIdAndDelete(id);
        return res.status(200).json({
          status: 'success',
          deleted: true,
          message: 'Community was deleted as the owner left.',
        });
      }
      return res.status(400).json({
        status: 'error',
        message: 'Owner cannot leave without transferring ownership first.',
      });
    }

    // Pop member
    community.members = community.members.filter(m => m.toString() !== userId.toString());
    community.memberCount = community.members.length;
    await community.save();

    res.status(200).json({
      status: 'success',
      left: true,
      community,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error leaving community.',
    });
  }
};

/**
 * @desc    Search Communities
 * @route   GET /api/communities/search
 * @access  Private
 */
export const searchCommunities = async (req, res) => {
  try {
    const { q, category, visibility, sortBy = 'newest', page = 1, limit = 12 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skipNum = (pageNum - 1) * limitNum;

    const queryConditions = {};

    // Search query conditions (regex check name, desc, tags)
    if (q) {
      const sanitized = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      queryConditions.$or = [
        { communityName: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (category) {
      queryConditions.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    if (visibility) {
      queryConditions.visibility = visibility;
    }

    // Sort stages mapping
    let sortCondition = { createdAt: -1 };
    if (sortBy === 'most_members') {
      sortCondition = { memberCount: -1, createdAt: -1 };
    } else if (sortBy === 'alphabetical') {
      sortCondition = { communityName: 1 };
    }

    const total = await Community.countDocuments(queryConditions);
    const communities = await Community.find(queryConditions)
      .sort(sortCondition)
      .skip(skipNum)
      .limit(limitNum)
      .populate('owner', 'name');

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      communities,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error searching communities.',
    });
  }
};
