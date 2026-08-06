import Profile from '../models/Profile.js';
import Community from '../models/Community.js';

/**
 * Calculates recommendation score for a community based on user's profile.
 * @param {Object} profile - User profile.
 * @param {Object} community - Community object.
 * @returns {Number} Matching score.
 */
export const calculateCommunityScore = (profile, community) => {
  let score = 0;

  // 1. My Skills to Learn overlap with Community tags (+5 points per overlap)
  const learnOverlap = community.tags.filter((tag) =>
    profile.skillsToLearn.some((s) => s.toLowerCase() === tag.toLowerCase())
  );
  score += learnOverlap.length * 5;

  // 2. My Skills to Teach overlap with Community tags (+3 points per overlap)
  const teachOverlap = community.tags.filter((tag) =>
    profile.skillsToTeach.some((s) => s.toLowerCase() === tag.toLowerCase())
  );
  score += teachOverlap.length * 3;

  // 3. My Interests match Community Category (+2 points)
  if (profile.interests.some((i) => i.toLowerCase() === community.category.toLowerCase())) {
    score += 2;
  }

  // 4. My Interests overlap with Community tags (+1 point per overlap)
  const interestOverlap = community.tags.filter((tag) =>
    profile.interests.some((i) => i.toLowerCase() === tag.toLowerCase())
  );
  score += interestOverlap.length * 1;

  return score;
};

/**
 * Service to fetch recommended communities for a user.
 * @param {String} userId - Active user's ID.
 * @param {Number} limit - Limits size of results.
 * @returns {Array} List of recommended communities.
 */
export const getRecommendedCommunities = async (userId, limit = 6) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      // Fallback: return most popular communities if profile is missing
      return await Community.find().sort({ memberCount: -1 }).limit(limit).populate('owner', 'name');
    }

    // Fetch all communities where user is not currently a member
    const allCommunities = await Community.find({
      members: { $ne: userId },
    }).populate('owner', 'name');

    const recommendations = allCommunities
      .map((comm) => {
        const score = calculateCommunityScore(profile, comm);
        const commObj = comm.toObject();
        commObj.recomScore = score;
        return commObj;
      })
      .filter((c) => c.recomScore > 0)
      .sort((a, b) => b.recomScore - a.recomScore)
      .slice(0, limit);

    // Fallback: if no matches based on score, recommend popular ones
    if (recommendations.length === 0) {
      return await Community.find({ members: { $ne: userId } })
        .sort({ memberCount: -1 })
        .limit(limit)
        .populate('owner', 'name');
    }

    return recommendations;
  } catch (error) {
    return [];
  }
};
