import mongoose from 'mongoose';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import { getRecommendedPartners, generateRecommendationReasons } from '../services/recommendationService.js';

/**
 * @desc    Get Discover Page Landing sections (Featured, Trending, Recommended)
 * @route   GET /api/discover
 * @access  Private
 */
export const getDiscoverLanding = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch non-connectable user IDs (admins and non-active account statuses)
    const nonConnectableUsers = await User.find({
      $or: [
        { role: { $in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] } },
        { accountStatus: { $ne: 'active' } },
      ],
    }).select('_id');
    const nonConnectableUserIds = nonConnectableUsers.map((u) => u._id);

    // Aggregate trending skills
    const trendingSkills = await Profile.aggregate([
      { $match: { onboardingCompleted: true, userId: { $nin: nonConnectableUserIds } } },
      { $project: { allSkills: { $concatArrays: ['$skillsToTeach', '$skillsToLearn'] } } },
      { $unwind: '$allSkills' },
      { $group: { _id: { $toLower: '$allSkills' }, originalName: { $first: '$allSkills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Aggregate popular interests
    const popularInterests = await Profile.aggregate([
      { $match: { onboardingCompleted: true, userId: { $nin: nonConnectableUserIds } } },
      { $unwind: '$interests' },
      { $group: { _id: { $toLower: '$interests' }, originalName: { $first: '$interests' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Featured members (excluding current user, admins, non-active, and deleted users)
    const featuredUsersRaw = await Profile.find({
      userId: { $ne: userId, $nin: nonConnectableUserIds },
      onboardingCompleted: true,
    })
      .sort({ profileCompletion: -1, createdAt: -1 })
      .limit(12)
      .populate('userId', 'name email role accountStatus');

    const featuredUsers = featuredUsersRaw
      .filter((p) => p.userId && p.userId.accountStatus === 'active' && !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(p.userId.role))
      .slice(0, 6);

    // Recently joined members (excluding current user, admins, non-active, and deleted users)
    const recentlyJoinedRaw = await Profile.find({
      userId: { $ne: userId, $nin: nonConnectableUserIds },
      onboardingCompleted: true,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('userId', 'name email role accountStatus');

    const recentlyJoined = recentlyJoinedRaw
      .filter((p) => p.userId && p.userId.accountStatus === 'active' && !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(p.userId.role))
      .slice(0, 3);

    // Recommended partners
    const recommended = await getRecommendedPartners(userId, 6);

    res.status(200).json({
      status: 'success',
      data: {
        trendingSkills: trendingSkills.map(s => ({ name: s.originalName, count: s.count })),
        popularInterests: popularInterests.map(i => ({ name: i.originalName, count: i.count })),
        featuredUsers,
        recentlyJoined,
        recommended,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while loading discover dashboard.',
    });
  }
};

/**
 * @desc    Search and filter users profiles
 * @route   GET /api/discover/search
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      q,
      location,
      teach,
      learn,
      skill,
      language,
      interest,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skipNum = (pageNum - 1) * limitNum;

    // Sanitize input search query
    let sanitizedQuery = '';
    if (q) {
      sanitizedQuery = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape regex operators
    }

    // Build matching filters
    const matchStage = {
      onboardingCompleted: true,
      userId: { $ne: new mongoose.Types.ObjectId(userId) }, // Exclude current user
      'userInfo.role': { $nin: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] }, // Exclude admin accounts
      'userInfo.accountStatus': 'active', // Exclude suspended or non-active accounts
    };

    const escapeFilterRegex = (str) => str.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const andConditions = [];

    // Text query match (Regex across multiple fields)
    if (sanitizedQuery) {
      andConditions.push({
        $or: [
          { 'userInfo.name': { $regex: sanitizedQuery, $options: 'i' } },
          { username: { $regex: sanitizedQuery, $options: 'i' } },
          { headline: { $regex: sanitizedQuery, $options: 'i' } },
          { bio: { $regex: sanitizedQuery, $options: 'i' } },
          { location: { $regex: sanitizedQuery, $options: 'i' } },
          { skillsToTeach: { $regex: sanitizedQuery, $options: 'i' } },
          { skillsToLearn: { $regex: sanitizedQuery, $options: 'i' } },
          { interests: { $regex: sanitizedQuery, $options: 'i' } },
          { languages: { $regex: sanitizedQuery, $options: 'i' } },
        ],
      });
    }

    // Skill filter (matches skillsToTeach OR skillsToLearn)
    if (skill) {
      const skillPattern = { $regex: escapeFilterRegex(skill), $options: 'i' };
      andConditions.push({
        $or: [
          { skillsToTeach: skillPattern },
          { skillsToLearn: skillPattern },
        ],
      });
    }

    if (andConditions.length > 0) {
      matchStage.$and = andConditions;
    }

    // Category filter matches (Location, Teach, Learn, Language, Interest)
    if (location) {
      matchStage.location = { $regex: escapeFilterRegex(location), $options: 'i' };
    }
    if (teach) {
      matchStage.skillsToTeach = { $regex: escapeFilterRegex(teach), $options: 'i' };
    }
    if (learn) {
      matchStage.skillsToLearn = { $regex: escapeFilterRegex(learn), $options: 'i' };
    }
    if (language) {
      matchStage.languages = { $regex: escapeFilterRegex(language), $options: 'i' };
    }
    if (interest) {
      matchStage.interests = { $regex: escapeFilterRegex(interest), $options: 'i' };
    }

    // Sorting rule
    let sortStage = {};
    if (sortBy === 'most_completed') {
      sortStage = { profileCompletion: -1, createdAt: -1 };
    } else if (sortBy === 'alphabetical') {
      sortStage = { 'userInfo.name': 1 };
    } else {
      // Default: newest
      sortStage = { createdAt: -1 };
    }

    // Execute aggregation pipeline to lookup User info and Paginate
    const aggregationResult = await Profile.aggregate([
      // 1. Join with Users collection
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      // 2. Flatten join result array
      { $unwind: '$userInfo' },
      // 3. Filter matched criteria
      { $match: matchStage },
      // 4. Sort results
      { $sort: sortStage },
      // 5. Facet for pagination count & results slice
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skipNum },
            { $limit: limitNum },
            // Project out password and private information
            {
              $project: {
                _id: 1,
                userId: {
                  _id: '$userInfo._id',
                  name: '$userInfo.name',
                  email: '$userInfo.email',
                  role: '$userInfo.role',
                  accountStatus: '$userInfo.accountStatus',
                },
                username: 1,
                profilePhoto: 1,
                headline: 1,
                location: 1,
                skillsToTeach: 1,
                skillsToLearn: 1,
                interests: 1,
                languages: 1,
                profileCompletion: 1,
                reputation: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = aggregationResult[0]?.metadata[0]?.total || 0;
    const rawProfiles = aggregationResult[0]?.data || [];

    // Attach recommendation summaries to search results
    const myProfile = await Profile.findOne({ userId });
    const myCommunities = await Community.find({ members: userId }).select('communityName members');

    const profiles = rawProfiles.map((p) => {
      const summary = myProfile
        ? generateRecommendationReasons(myProfile, p, myCommunities)
        : null;
      return { ...p, recommendationSummary: summary };
    });

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      profiles,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error while running user searches.',
    });
  }
};
