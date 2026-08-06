import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DeletedAccount from '../models/DeletedAccount.js';
import PendingUser from '../models/PendingUser.js';
import Community from '../models/Community.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectInvitation from '../models/ProjectInvitation.js';
import Workshop from '../models/Workshop.js';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import Resource from '../models/Resource.js';
import ResourceLike from '../models/ResourceLike.js';
import ResourceBookmark from '../models/ResourceBookmark.js';
import CommunityDiscussion from '../models/CommunityDiscussion.js';
import DiscussionReply from '../models/DiscussionReply.js';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';
import ImpactHistory from '../models/ImpactHistory.js';
import UserAchievement from '../models/UserAchievement.js';
import { disconnectUserSockets } from '../socket/socketManager.js';

/**
 * Hard deletes a user account permanently while preserving an isolated administrative audit trail.
 * Completely removes User, Profile, auth credentials, active sessions, sockets, and cleans up all related entities.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.userId - The ID of the user to be hard deleted.
 * @param {'Self'|'Admin'} params.deletedBy - Who initiated the account deletion.
 * @param {string} [params.reason] - Optional deletion reason.
 * @returns {Promise<Object>} Summary of deleted audit record.
 */
export const hardDeleteUserAccount = async ({ userId, deletedBy, reason = '' }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'SUPER_ADMIN') {
    const error = new Error('Super Administrator accounts cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }

  const profile = await Profile.findOne({ userId });

  // 1. Create audit log entry in DeletedAccount (No password, JWT, OTP, messages or sensitive auth stored)
  const auditRecord = await DeletedAccount.create({
    originalUserId: user._id.toString(),
    fullName: user.name,
    username: profile ? profile.username : (user.email ? user.email.split('@')[0] : 'user'),
    email: user.email.toLowerCase().trim(),
    accountRole: user.role,
    accountCreatedDate: user.createdAt,
    accountDeletedDate: new Date(),
    deletedBy: deletedBy || 'Self',
    deletionReason: reason.trim() || (deletedBy === 'Admin' ? 'Administrative removal' : 'User requested account deletion'),
    lastLoginDate: user.updatedAt || null,
  });

  // 2. Disconnect active sockets for the deleted user immediately
  try {
    disconnectUserSockets(user._id);
  } catch (err) {
    console.warn('[ACCOUNT_DELETION] Socket disconnect warning:', err.message);
  }

  // 3. Remove User and Profile documents
  await User.findByIdAndDelete(userId);
  await Profile.findOneAndDelete({ userId });
  await PendingUser.deleteMany({ email: user.email.toLowerCase().trim() });

  // 4. Cascade Clean Related Entities

  // Remove user from community memberships, moderator lists, and pending join requests.
  const userCommunities = await Community.find({
    $or: [{ members: userId }, { moderators: userId }, { joinRequests: userId }, { owner: userId }],
  });

  for (const community of userCommunities) {
    community.members = community.members.filter((m) => m.toString() !== userId.toString());
    community.moderators = community.moderators.filter((m) => m.toString() !== userId.toString());
    community.joinRequests = community.joinRequests.filter((m) => m.toString() !== userId.toString());
    community.memberCount = community.members.length;

    // Handle owner reassignment or deletion if user was community owner.
    if (community.owner && community.owner.toString() === userId.toString()) {
      if (community.moderators.length > 0) {
        community.owner = community.moderators[0];
      } else if (community.members.length > 0) {
        community.owner = community.members[0];
      } else {
        await Community.findByIdAndDelete(community._id);
        continue;
      }
    }
    await community.save();
  }

  // Reassign project ownership to oldest team member or delete project if no members remain.
  const ownedProjects = await Project.find({ owner: userId });
  for (const proj of ownedProjects) {
    const nextOwnerMember = await ProjectMember.findOne({ project: proj._id, user: { $ne: userId } }).sort({ createdAt: 1 });
    if (nextOwnerMember) {
      proj.owner = nextOwnerMember.user;
      await proj.save();
      nextOwnerMember.role = 'Owner';
      await nextOwnerMember.save();
    } else {
      await ProjectMember.deleteMany({ project: proj._id });
      await ProjectInvitation.deleteMany({ project: proj._id });
      await Project.findByIdAndDelete(proj._id);
    }
  }

  await ProjectMember.deleteMany({ user: userId });
  await ProjectInvitation.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

  // Remove registrations and workshops hosted by user.
  await WorkshopRegistration.deleteMany({ user: userId });
  const hostedWorkshops = await Workshop.find({ host: userId });
  for (const ws of hostedWorkshops) {
    await WorkshopRegistration.deleteMany({ workshop: ws._id });
    await Workshop.findByIdAndDelete(ws._id);
  }

  // Delete user likes and bookmarks, updating counts on affected resources.
  const userLikes = await ResourceLike.find({ user: userId });
  for (const like of userLikes) {
    await Resource.findByIdAndUpdate(like.resource, { $inc: { likesCount: -1 } });
  }
  await ResourceLike.deleteMany({ user: userId });

  const userBookmarks = await ResourceBookmark.find({ user: userId });
  for (const bm of userBookmarks) {
    await Resource.findByIdAndUpdate(bm.resource, { $inc: { bookmarksCount: -1 } });
  }
  await ResourceBookmark.deleteMany({ user: userId });

  const userResources = await Resource.find({ creator: userId });
  for (const resItem of userResources) {
    await ResourceLike.deleteMany({ resource: resItem._id });
    await ResourceBookmark.deleteMany({ resource: resItem._id });
    await Resource.findByIdAndDelete(resItem._id);
  }

  // Remove discussions authored by user and clean up replies.
  const userDiscussions = await CommunityDiscussion.find({ author: userId });
  for (const disc of userDiscussions) {
    await DiscussionReply.deleteMany({ discussion: disc._id });
    await CommunityDiscussion.findByIdAndDelete(disc._id);
  }

  const userReplies = await DiscussionReply.find({ author: userId });
  for (const reply of userReplies) {
    await CommunityDiscussion.findByIdAndUpdate(reply.discussion, { $inc: { repliesCount: -1 } });
  }
  await DiscussionReply.deleteMany({ author: userId });

  // Remove connection records and connection requests.
  await Connection.deleteMany({ $or: [{ user1: userId }, { user2: userId }] });
  await ConnectionRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

  // Remove private messages and clear user from multi-participant conversations.
  await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
  await Conversation.updateMany({ participants: userId }, { $pull: { participants: userId } });
  await Conversation.deleteMany({ $expr: { $lt: [{ $size: '$participants' }, 2] } });

  // Remove notifications, reports, and impact achievements.
  await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

  await Report.deleteMany({ reporter: userId });
  await Report.deleteMany({ targetType: 'User', targetId: userId.toString() });

  await ImpactHistory.deleteMany({ user: userId });
  await UserAchievement.deleteMany({ user: userId });

  return auditRecord;
};
