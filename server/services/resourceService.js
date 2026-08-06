import ResourceLike from '../models/ResourceLike.js';
import ResourceBookmark from '../models/ResourceBookmark.js';
import Community from '../models/Community.js';
import ProjectMember from '../models/ProjectMember.js';

/**
 * Checks if a user has access to view a specific resource based on visibility rules.
 * @param {Object} resource 
 * @param {String|ObjectId} userId 
 * @returns {Boolean}
 */
export const canUserAccessResource = async (resource, userId) => {
  if (!resource) return false;

  if (resource.visibility === 'Public') {
    return true;
  }

  if (!userId) return false;

  // Creator always has access
  const creatorId = resource.creator?._id || resource.creator;
  if (creatorId && creatorId.toString() === userId.toString()) {
    return true;
  }

  if (resource.visibility === 'Community Only') {
    if (!resource.community) return false;
    const community = await Community.findById(resource.community);
    if (!community) return false;
    return community.members.some((mId) => mId.toString() === userId.toString());
  }

  if (resource.visibility === 'Project Only') {
    if (!resource.project) return false;
    const member = await ProjectMember.findOne({ project: resource.project, user: userId });
    return !!member;
  }

  return false;
};

/**
 * Enriches resource objects with isLiked and isBookmarked boolean flags for current user.
 * @param {Array} resources 
 * @param {String|ObjectId} userId 
 * @returns {Array} Enriched resource objects.
 */
export const enrichResourcesUserFlags = async (resources, userId) => {
  if (!resources || resources.length === 0) return [];

  const resourceIds = resources.map((r) => r._id);

  let likedResourceIds = new Set();
  let bookmarkedResourceIds = new Set();

  if (userId) {
    const likes = await ResourceLike.find({
      user: userId,
      resource: { $in: resourceIds },
    });
    likes.forEach((l) => likedResourceIds.add(l.resource.toString()));

    const bookmarks = await ResourceBookmark.find({
      user: userId,
      resource: { $in: resourceIds },
    });
    bookmarks.forEach((b) => bookmarkedResourceIds.add(b.resource.toString()));
  }

  return resources.map((r) => {
    const rObj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
    const rIdStr = rObj._id.toString();

    rObj.isLiked = likedResourceIds.has(rIdStr);
    rObj.isBookmarked = bookmarkedResourceIds.has(rIdStr);
    rObj.isCreator = userId && rObj.creator && (rObj.creator._id || rObj.creator).toString() === userId.toString();

    return rObj;
  });
};
