import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

/**
 * Compares two profiles to output a structured reason why they are recommended.
 * @param {Object} profileA - Active user profile.
 * @param {Object} profileB - Another member profile.
 * @param {Array} sharedCommunitiesList - List of communities userA is in, with member arrays.
 * @returns {Object} Structured recommendation reasons.
 */
export const generateRecommendationReasons = (profileA, profileB, sharedCommunitiesList = []) => {
  const pASkillsToLearn = profileA?.skillsToLearn || [];
  const pASkillsToTeach = profileA?.skillsToTeach || [];
  const pAInterests = profileA?.interests || [];
  const pALanguages = profileA?.languages || [];

  const pBSkillsToTeach = profileB?.skillsToTeach || [];
  const pBSkillsToLearn = profileB?.skillsToLearn || [];
  const pBInterests = profileB?.interests || [];
  const pBLanguages = profileB?.languages || [];

  const canTeachYou = pBSkillsToTeach.filter((skill) =>
    pASkillsToLearn.some((s) => s.toLowerCase() === skill.toLowerCase())
  );

  const youCanTeach = pASkillsToTeach.filter((skill) =>
    pBSkillsToLearn.some((s) => s.toLowerCase() === skill.toLowerCase())
  );

  const sharedInterests = pAInterests.filter((interest) =>
    pBInterests.some((i) => i.toLowerCase() === interest.toLowerCase())
  );

  const sharedLanguages = pALanguages.filter((lang) =>
    pBLanguages.some((l) => l.toLowerCase() === lang.toLowerCase())
  );

  const candidateUserId = profileB?.userId?._id ? profileB.userId._id.toString() : profileB?.userId?.toString();

  const sharedCommunities = sharedCommunitiesList
    .filter((comm) => comm.members && comm.members.some((mId) => mId.toString() === candidateUserId))
    .map((comm) => comm.communityName);

  return {
    canTeachYou,
    youCanTeach,
    sharedInterests,
    sharedCommunities,
    sharedLanguages,
  };
};

/**
 * Service to generate suggested partners based on teaching-learning matches,
 * shared interests, shared communities, and activity.
 * @param {String} userId - Active user's ID.
 * @param {Number} limit - Limits size of suggestions.
 * @returns {Array} List of suggested profiles with recommendation reasons.
 */
export const getSuggestedPartners = async (userId, limit = 6) => {
  try {
    // 1. Fetch active user's profile
    const currentProfile = await Profile.findOne({ userId });
    if (!currentProfile) return [];

    // 2. Fetch connection exclusions (active connections, pending/rejected requests, self, admins)
    const activeConnections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
    });

    const activeUserIds = activeConnections.map((c) =>
      c.user1.toString() === userId.toString() ? c.user2.toString() : c.user1.toString()
    );

    const requests = await ConnectionRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: { $in: ['pending', 'rejected', 'accepted'] },
    });

    const requestUserIds = requests.map((r) =>
      r.sender.toString() === userId.toString() ? r.receiver.toString() : r.sender.toString()
    );

    const nonConnectableUsers = await User.find({
      $or: [
        { role: { $in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] } },
        { accountStatus: { $ne: 'active' } },
      ],
    }).select('_id');

    const nonConnectableUserIds = nonConnectableUsers.map((u) => u._id.toString());

    const exclusions = new Set([
      userId.toString(),
      ...activeUserIds,
      ...requestUserIds,
      ...nonConnectableUserIds,
    ]);

    // 3. Fetch communities user has joined to calculate shared ones in-memory
    const myCommunities = await Community.find({ members: userId }).select('communityName members');

    // 4. Fetch all other onboarded profiles not in exclusions
    const candidateProfiles = await Profile.find({
      userId: { $nin: Array.from(exclusions).map((id) => id) },
      onboardingCompleted: true,
    }).populate('userId', 'name email role accountStatus');

    const validCandidateProfiles = candidateProfiles.filter(
      (candidate) => candidate.userId && candidate.userId.accountStatus === 'active' && !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(candidate.userId.role)
    );

    // 5. Build match summaries
    const suggestions = validCandidateProfiles.map((candidate) => {
      const summary = generateRecommendationReasons(
        currentProfile,
        candidate,
        myCommunities
      );
      const candidateObj = candidate.toObject();
      candidateObj.recommendationSummary = summary;
      return candidateObj;
    });

    // 6. Multi-tiered Sort:
    //    Tier 1: Number of teach-learn matches desc
    //    Tier 2: Shared interests count desc
    //    Tier 3: Shared communities count desc
    //    Tier 4: Recently active (updatedAt desc)
    suggestions.sort((a, b) => {
      const aMatches = a.recommendationSummary.canTeachYou.length + a.recommendationSummary.youCanTeach.length;
      const bMatches = b.recommendationSummary.canTeachYou.length + b.recommendationSummary.youCanTeach.length;
      if (bMatches !== aMatches) return bMatches - aMatches;

      const aInterests = a.recommendationSummary.sharedInterests.length;
      const bInterests = b.recommendationSummary.sharedInterests.length;
      if (bInterests !== aInterests) return bInterests - aInterests;

      const aCommunities = a.recommendationSummary.sharedCommunities.length;
      const bCommunities = b.recommendationSummary.sharedCommunities.length;
      if (bCommunities !== aCommunities) return bCommunities - aCommunities;

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    // We can filter out suggestions that have absolutely zero overlap to keep suggestions high quality,
    // but the prompt says to sort suggestions, so we will return them sliced by limit.
    return suggestions.slice(0, limit);
  } catch (error) {
    return [];
  }
};

export const getRecommendedPartners = getSuggestedPartners;

