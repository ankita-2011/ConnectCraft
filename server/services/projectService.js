import ProjectMember from '../models/ProjectMember.js';
import ProjectInvitation from '../models/ProjectInvitation.js';
import Connection from '../models/Connection.js';

/**
 * Get member count for a array of project IDs.
 * @param {Array<String|ObjectId>} projectIds 
 * @returns {Object} Map of projectId string to member count number.
 */
export const getProjectMemberCountsMap = async (projectIds) => {
  if (!projectIds || projectIds.length === 0) return {};

  const counts = await ProjectMember.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);

  const map = {};
  counts.forEach((item) => {
    map[item._id.toString()] = item.count;
  });
  return map;
};

/**
 * Enriches project items with member counts, open positions, and current user role.
 * @param {Array} projects 
 * @param {String|ObjectId} currentUserId 
 * @returns {Array} Enriched project objects.
 */
export const enrichProjects = async (projects, currentUserId = null) => {
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p._id);
  const countsMap = await getProjectMemberCountsMap(projectIds);

  let userMemberships = [];
  if (currentUserId) {
    userMemberships = await ProjectMember.find({
      project: { $in: projectIds },
      user: currentUserId,
    });
  }

  return projects.map((p) => {
    const pObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
    const pIdStr = pObj._id.toString();
    const currentMemberCount = countsMap[pIdStr] || 1;
    const openPositions = Math.max(0, pObj.teamSize - currentMemberCount);

    const userMem = userMemberships.find((m) => m.project.toString() === pIdStr);

    pObj.memberCount = currentMemberCount;
    pObj.openPositions = openPositions;
    pObj.currentUserRole = userMem ? userMem.role : null;
    pObj.isMember = !!userMem;
    pObj.isOwner = currentUserId && pObj.owner && (pObj.owner._id || pObj.owner).toString() === currentUserId.toString();

    return pObj;
  });
};

/**
 * Verifies if a user can invite another user to a project.
 * Receiver must be an active Connection, not already a project member, and have no pending invitation.
 */
export const validateProjectInvite = async (senderId, receiverId, projectId) => {
  if (senderId.toString() === receiverId.toString()) {
    return { valid: false, message: 'You cannot invite yourself to the project.' };
  }

  // 1. Verify active connection
  const activeConnection = await Connection.findOne({
    $or: [
      { user1: senderId, user2: receiverId },
      { user1: receiverId, user2: senderId },
    ],
  });

  if (!activeConnection) {
    return { valid: false, message: 'You can only invite users who are in your active Connections.' };
  }

  // 2. Check if already a team member
  const existingMember = await ProjectMember.findOne({ project: projectId, user: receiverId });
  if (existingMember) {
    return { valid: false, message: 'User is already a member of this project.' };
  }

  // 3. Check if active pending invitation exists
  const pendingInvite = await ProjectInvitation.findOne({
    project: projectId,
    receiver: receiverId,
    status: 'Pending',
  });

  if (pendingInvite) {
    return { valid: false, message: 'A pending invitation has already been sent to this user for this project.' };
  }

  // 4. Check project team size capacity
  const projectDoc = await Project.findById(projectId);
  if (projectDoc) {
    const currentMemberCount = await ProjectMember.countDocuments({ project: projectId });
    if (currentMemberCount >= projectDoc.teamSize) {
      return { valid: false, message: 'Project has reached its maximum team size capacity.' };
    }
  }

  return { valid: true };
};
