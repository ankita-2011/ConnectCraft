import mongoose from 'mongoose';
import Resource from '../models/Resource.js';
import ResourceBookmark from '../models/ResourceBookmark.js';
import ResourceLike from '../models/ResourceLike.js';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import { canUserAccessResource, enrichResourcesUserFlags } from '../services/resourceService.js';

/**
 * @desc    Create a new learning resource
 * @route   POST /api/resources
 * @access  Private
 */
export const createResource = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      content,
      resourceType = 'Article',
      externalLink = '',
      category = 'Web Development',
      tags = [],
      visibility = 'Public',
      community = null,
      project = null,
      thumbnail = '',
    } = req.body;

    if (!title || !shortDescription || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide title, short description, and content overview.',
      });
    }

    if (project) {
      const proj = await Project.findById(project);
      if (proj) {
        const isOwner = proj.owner.toString() === req.user._id.toString();
        const isMember = await ProjectMember.exists({ project: project, user: req.user._id });
        if (!isOwner && !isMember) {
          return res.status(403).json({
            status: 'fail',
            message: 'Only active team members or owners can attach resources to this project.',
          });
        }
      }
    }

    const resource = new Resource({
      creator: req.user._id,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      content: content.trim(),
      resourceType,
      externalLink: externalLink.trim(),
      category,
      tags,
      visibility,
      community: community || null,
      project: project || null,
      thumbnail: thumbnail.trim(),
    });

    await resource.save();

    res.status(201).json({
      status: 'success',
      resource,
    });
  } catch (error) {
    console.error('[RESOURCE] Error creating resource:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating resource. Please try again.',
    });
  }
};

/**
 * @desc    Get resources feed with search, filters & pagination
 * @route   GET /api/resources
 * @access  Private
 */
export const getResources = async (req, res) => {
  try {
    const {
      q,
      category,
      resourceType,
      skillTag,
      visibility,
      communityId,
      projectId,
      sortBy = 'newest',
      page = 1,
      limit = 9,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 9;
    const skipNum = (pageNum - 1) * limitNum;

    const matchStage = {};

    if (communityId) {
      matchStage.community = communityId;
    } else if (projectId) {
      matchStage.project = projectId;
    } else if (visibility) {
      matchStage.visibility = visibility;
    } else {
      matchStage.visibility = 'Public';
    }

    if (category) {
      matchStage.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    if (resourceType) {
      matchStage.resourceType = resourceType;
    }
    if (skillTag) {
      matchStage.tags = { $elemMatch: { $regex: `^${skillTag.trim()}$`, $options: 'i' } };
    }

    if (q) {
      const sanitized = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      matchStage.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { shortDescription: { $regex: sanitized, $options: 'i' } },
        { content: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
      ];
    }

    let sortStage = { createdAt: -1 };
    if (sortBy === 'most_viewed') {
      sortStage = { views: -1, createdAt: -1 };
    } else if (sortBy === 'most_liked') {
      sortStage = { likesCount: -1, createdAt: -1 };
    } else if (sortBy === 'most_bookmarked') {
      sortStage = { bookmarksCount: -1, createdAt: -1 };
    }

    const total = await Resource.countDocuments(matchStage);
    const rawResources = await Resource.find(matchStage)
      .sort(sortStage)
      .skip(skipNum)
      .limit(limitNum)
      .populate('creator', 'name email');

    const enrichedResources = await enrichResourcesUserFlags(rawResources, req.user._id);

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      resources: enrichedResources,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving resources feed.',
    });
  }
};

/**
 * @desc    Get resource details by ID (increments views)
 * @route   GET /api/resources/:id
 * @access  Private
 */
export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid resource ID.',
      });
    }

    // Increment view count atomically
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    ).populate('creator', 'name email');

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resource not found.',
      });
    }

    // Check visibility authorization
    const hasAccess = await canUserAccessResource(resource, userId);
    if (!hasAccess) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this scoped resource.',
      });
    }

    // Creator profile info
    const creatorProfile = await Profile.findOne({ userId: resource.creator._id });
    
    // User flags
    const [enriched] = await enrichResourcesUserFlags([resource], userId);

    res.status(200).json({
      status: 'success',
      resource: enriched,
      creatorProfile,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving resource details.',
    });
  }
};

/**
 * @desc    Update resource
 * @route   PUT /api/resources/:id
 * @access  Private (Creator only)
 */
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resource not found.',
      });
    }

    if (resource.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the creator can edit this resource.',
      });
    }

    const {
      title,
      shortDescription,
      content,
      resourceType,
      externalLink,
      category,
      tags,
      visibility,
      thumbnail,
    } = req.body;

    if (title !== undefined) resource.title = title.trim();
    if (shortDescription !== undefined) resource.shortDescription = shortDescription.trim();
    if (content !== undefined) resource.content = content.trim();
    if (resourceType !== undefined) resource.resourceType = resourceType;
    if (externalLink !== undefined) resource.externalLink = externalLink.trim();
    if (category !== undefined) resource.category = category;
    if (tags !== undefined) resource.tags = tags;
    if (visibility !== undefined) resource.visibility = visibility;
    if (thumbnail !== undefined) resource.thumbnail = thumbnail.trim();

    await resource.save();

    res.status(200).json({
      status: 'success',
      resource,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error updating resource.',
    });
  }
};

/**
 * @desc    Delete resource
 * @route   DELETE /api/resources/:id
 * @access  Private (Creator only)
 */
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resource not found.',
      });
    }

    if (resource.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the creator can delete this resource.',
      });
    }

    await Resource.findByIdAndDelete(id);
    await ResourceLike.deleteMany({ resource: id });
    await ResourceBookmark.deleteMany({ resource: id });

    res.status(200).json({
      status: 'success',
      message: 'Resource deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting resource.',
    });
  }
};

/**
 * @desc    Like a resource
 * @route   POST /api/resources/:id/like
 * @access  Private
 */
export const likeResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existingLike = await ResourceLike.findOne({ user: userId, resource: id });
    if (existingLike) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already liked this resource.',
      });
    }

    await ResourceLike.create({ user: userId, resource: id });
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { likesCount: 1 } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      status: 'success',
      likesCount: resource ? resource.likesCount : 0,
      isLiked: true,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error liking resource.',
    });
  }
};

/**
 * @desc    Unlike a resource
 * @route   DELETE /api/resources/:id/like
 * @access  Private
 */
export const unlikeResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await ResourceLike.findOneAndDelete({ user: userId, resource: id });
    if (deleted) {
      const resource = await Resource.findById(id);
      if (resource && resource.likesCount > 0) {
        resource.likesCount = Math.max(0, resource.likesCount - 1);
        await resource.save();
      }
    }

    const currentResource = await Resource.findById(id);

    res.status(200).json({
      status: 'success',
      likesCount: currentResource ? currentResource.likesCount : 0,
      isLiked: false,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error unliking resource.',
    });
  }
};

/**
 * @desc    Bookmark a resource
 * @route   POST /api/resources/:id/bookmark
 * @access  Private
 */
export const bookmarkResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existingBookmark = await ResourceBookmark.findOne({ user: userId, resource: id });
    if (existingBookmark) {
      return res.status(400).json({
        status: 'fail',
        message: 'Resource is already bookmarked.',
      });
    }

    await ResourceBookmark.create({ user: userId, resource: id });
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { bookmarksCount: 1 } },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      status: 'success',
      bookmarksCount: resource ? resource.bookmarksCount : 0,
      isBookmarked: true,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error bookmarking resource.',
    });
  }
};

/**
 * @desc    Remove bookmark from resource
 * @route   DELETE /api/resources/:id/bookmark
 * @access  Private
 */
export const removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await ResourceBookmark.findOneAndDelete({ user: userId, resource: id });
    if (deleted) {
      const resource = await Resource.findById(id);
      if (resource && resource.bookmarksCount > 0) {
        resource.bookmarksCount = Math.max(0, resource.bookmarksCount - 1);
        await resource.save();
      }
    }

    const currentResource = await Resource.findById(id);

    res.status(200).json({
      status: 'success',
      bookmarksCount: currentResource ? currentResource.bookmarksCount : 0,
      isBookmarked: false,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error removing bookmark.',
    });
  }
};

/**
 * @desc    Get user's saved bookmarked resources
 * @route   GET /api/resources/bookmarks
 * @access  Private
 */
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookmarks = await ResourceBookmark.find({ user: userId }).sort({ createdAt: -1 });
    const resourceIds = bookmarks.map((b) => b.resource);

    const rawResources = await Resource.find({ _id: { $in: resourceIds } }).populate('creator', 'name email');
    const enrichedResources = await enrichResourcesUserFlags(rawResources, userId);

    res.status(200).json({
      status: 'success',
      bookmarks: enrichedResources,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving saved bookmarks.',
    });
  }
};

/**
 * @desc    Get top trending resources for Dashboard
 * @route   GET /api/resources/trending
 * @access  Private
 */
export const getTrendingResources = async (req, res) => {
  try {
    const rawResources = await Resource.find({ visibility: 'Public' })
      .sort({ views: -1, likesCount: -1, createdAt: -1 })
      .limit(4)
      .populate('creator', 'name email');

    const enrichedResources = await enrichResourcesUserFlags(rawResources, req.user._id);

    res.status(200).json({
      status: 'success',
      resources: enrichedResources,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving trending resources.',
    });
  }
};
