import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Community from '../models/Community.js';
import Resource from '../models/Resource.js';
import ResourceBookmark from '../models/ResourceBookmark.js';
import ResourceLike from '../models/ResourceLike.js';
import Workshop from '../models/Workshop.js';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import UserAchievement from '../models/UserAchievement.js';
import ImpactHistory from '../models/ImpactHistory.js';

/**
 * Calculates start date based on timeframe filter string ('7d', '30d', '90d', '365d')
 */
const getTimeframeStartDate = (timeRange = '30d') => {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '365d':
      return new Date(now.setDate(now.getDate() - 365));
    case '30d':
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
};

/**
 * Personal Analytics Summary & Monthly breakdown
 */
export const getPersonalAnalytics = async (userId, timeRange = '30d') => {
  const startDate = getTimeframeStartDate(timeRange);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const profile = await Profile.findOne({ userId });

  // Overall totals
  const [
    projectsCreated,
    projectsCompleted,
    projectsJoined,
    communitiesCreated,
    communitiesJoined,
    connectionsCount,
    resourcesShared,
    workshopsHosted,
    workshopsAttended,
    messagesSent,
    achievementsEarned,
  ] = await Promise.all([
    Project.countDocuments({ owner: userId }),
    Project.countDocuments({ owner: userId, status: 'Completed' }),
    ProjectMember.countDocuments({ user: userId, role: 'Collaborator' }),
    Community.countDocuments({ owner: userId }),
    Community.countDocuments({ members: userId }),
    Connection.countDocuments({ $or: [{ user1: userId }, { user2: userId }] }),
    Resource.countDocuments({ creator: userId }),
    Workshop.countDocuments({ host: userId }),
    WorkshopRegistration.countDocuments({ user: userId }),
    Message.countDocuments({ sender: userId }),
    UserAchievement.countDocuments({ user: userId }),
  ]);

  // 2. Activity Breakdown in timeframe
  const [
    recentProjects,
    recentResources,
    recentWorkshops,
    recentConnections,
  ] = await Promise.all([
    Project.countDocuments({ owner: userId, createdAt: { $gte: startDate } }),
    Resource.countDocuments({ creator: userId, createdAt: { $gte: startDate } }),
    WorkshopRegistration.countDocuments({ user: userId, registeredAt: { $gte: startDate } }),
    Connection.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      createdAt: { $gte: startDate },
    }),
  ]);

  // 3. Monthly activity breakdown for charts (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyHistory = await ImpactHistory.aggregate([
    {
      $match: {
        user: userObjectId,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        impactEarned: { $sum: '$impactPoints' },
        activityCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Resource Category Distribution
  const resourceCategories = await Resource.aggregate([
    { $match: { creator: userObjectId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  return {
    profileLevel: profile?.level || 'Explorer',
    impactScore: profile?.impactScore || 0,
    timeRange,
    totals: {
      projectsCreated,
      projectsCompleted,
      projectsJoined,
      communitiesCreated,
      communitiesJoined,
      connectionsCount,
      resourcesShared,
      workshopsHosted,
      workshopsAttended,
      messagesSent,
      achievementsEarned,
    },
    timeframeStats: {
      recentProjects,
      recentResources,
      recentWorkshops,
      recentConnections,
    },
    monthlyHistory,
    resourceCategories,
  };
};

/**
 * Monthly Summary Growth Comparison
 */
export const getMonthlySummary = async (userId) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    currProjects,
    prevProjects,
    currResources,
    prevResources,
    currWorkshops,
    prevWorkshops,
    currConnections,
    prevConnections,
  ] = await Promise.all([
    Project.countDocuments({ owner: userId, status: 'Completed', updatedAt: { $gte: currentMonthStart } }),
    Project.countDocuments({ owner: userId, status: 'Completed', updatedAt: { $gte: prevMonthStart, $lt: currentMonthStart } }),
    Resource.countDocuments({ creator: userId, createdAt: { $gte: currentMonthStart } }),
    Resource.countDocuments({ creator: userId, createdAt: { $gte: prevMonthStart, $lt: currentMonthStart } }),
    WorkshopRegistration.countDocuments({ user: userId, registeredAt: { $gte: currentMonthStart } }),
    WorkshopRegistration.countDocuments({ user: userId, registeredAt: { $gte: prevMonthStart, $lt: currentMonthStart } }),
    Connection.countDocuments({ $or: [{ user1: userId }, { user2: userId }], createdAt: { $gte: currentMonthStart } }),
    Connection.countDocuments({ $or: [{ user1: userId }, { user2: userId }], createdAt: { $gte: prevMonthStart, $lt: currentMonthStart } }),
  ]);

  const calcGrowth = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    monthName: now.toLocaleString('default', { month: 'long' }),
    metrics: {
      projectsCompleted: { current: currProjects, previous: prevProjects, growthPercent: calcGrowth(currProjects, prevProjects) },
      resourcesShared: { current: currResources, previous: prevResources, growthPercent: calcGrowth(currResources, prevResources) },
      workshopsAttended: { current: currWorkshops, previous: prevWorkshops, growthPercent: calcGrowth(currWorkshops, prevWorkshops) },
      newConnections: { current: currConnections, previous: prevConnections, growthPercent: calcGrowth(currConnections, prevConnections) },
    },
  };
};

/**
 * Community Analytics
 */
export const getCommunityAnalytics = async (communityId) => {
  const commObjId = new mongoose.Types.ObjectId(communityId);
  const community = await Community.findById(communityId);
  if (!community) return null;

  const [
    totalMembers,
    resourcesCount,
    projectsCount,
    workshopsCount,
  ] = await Promise.all([
    Community.aggregate([
      { $match: { _id: commObjId } },
      { $project: { memberCount: { $size: '$members' } } },
    ]),
    Resource.countDocuments({ community: communityId }),
    Project.countDocuments({ community: communityId }),
    Workshop.countDocuments({ community: communityId }),
  ]);

  return {
    communityName: community.communityName,
    category: community.category,
    visibility: community.visibility,
    totalMembers: totalMembers[0]?.memberCount || community.members?.length || 0,
    resourcesCount,
    projectsCount,
    workshopsCount,
    createdAt: community.createdAt,
  };
};

/**
 * Project Analytics
 */
export const getProjectAnalytics = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  const [
    membersCount,
    resourcesCount,
    meetingsCount,
  ] = await Promise.all([
    ProjectMember.countDocuments({ project: projectId }),
    Resource.countDocuments({ project: projectId }),
    Workshop.countDocuments({ project: projectId }),
  ]);

  const createdDate = new Date(project.createdAt);
  const durationDays = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));

  return {
    title: project.title,
    status: project.status,
    category: project.category,
    teamSize: membersCount + 1, // Lead + Members
    resourcesAttached: resourcesCount,
    syncMeetingsConducted: meetingsCount,
    durationDays,
    createdAt: project.createdAt,
  };
};

/**
 * Workshop Analytics
 */
export const getWorkshopAnalytics = async (userId) => {
  const [
    hostedCount,
    upcomingCount,
    completedCount,
    totalRegistrations,
    typeBreakdown,
  ] = await Promise.all([
    Workshop.countDocuments({ host: userId }),
    Workshop.countDocuments({ host: userId, status: 'Upcoming' }),
    Workshop.countDocuments({ host: userId, status: 'Completed' }),
    WorkshopRegistration.countDocuments({
      workshop: { $in: await Workshop.find({ host: userId }).distinct('_id') },
    }),
    Workshop.aggregate([
      { $match: { host: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    hostedCount,
    upcomingCount,
    completedCount,
    totalRegistrations,
    typeBreakdown,
  };
};

/**
 * Resource Analytics
 */
export const getResourceAnalytics = async (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [
    totalShared,
    totalLikes,
    totalBookmarks,
    typeBreakdown,
  ] = await Promise.all([
    Resource.countDocuments({ creator: userId }),
    ResourceLike.countDocuments({
      resource: { $in: await Resource.find({ creator: userId }).distinct('_id') },
    }),
    ResourceBookmark.countDocuments({
      resource: { $in: await Resource.find({ creator: userId }).distinct('_id') },
    }),
    Resource.aggregate([
      { $match: { creator: userObjId } },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalShared,
    totalLikes,
    totalBookmarks,
    typeBreakdown,
  };
};

/**
 * Generate CSV Content String
 */
export const generateCSVExport = async (userId, timeRange = '30d') => {
  const analytics = await getPersonalAnalytics(userId, timeRange);
  const totals = analytics.totals;

  let csv = `ConnectCraft Analytics Report (${timeRange})\n`;
  csv += `Generated Date,${new Date().toLocaleDateString()}\n`;
  csv += `User Level,${analytics.profileLevel}\n`;
  csv += `Impact Score,${analytics.impactScore}\n\n`;

  csv += `Metric,Total Count\n`;
  csv += `Projects Created,${totals.projectsCreated}\n`;
  csv += `Projects Completed,${totals.projectsCompleted}\n`;
  csv += `Projects Joined,${totals.projectsJoined}\n`;
  csv += `Communities Created,${totals.communitiesCreated}\n`;
  csv += `Communities Joined,${totals.communitiesJoined}\n`;
  csv += `Connected Peers,${totals.connectionsCount}\n`;
  csv += `Resources Shared,${totals.resourcesShared}\n`;
  csv += `Workshops Hosted,${totals.workshopsHosted}\n`;
  csv += `Workshops Attended,${totals.workshopsAttended}\n`;
  csv += `Messages Sent,${totals.messagesSent}\n`;
  csv += `Achievements Earned,${totals.achievementsEarned}\n`;

  return csv;
};

/**
 * Generate Printable HTML Report for PDF Export
 */
export const generatePDFExport = async (userId, timeRange = '30d') => {
  const analytics = await getPersonalAnalytics(userId, timeRange);
  const totals = analytics.totals;
  const user = await User.findById(userId);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ConnectCraft Analytics Summary Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        .card-val { font-size: 28px; font-weight: bold; color: #4f46e5; margin-top: 5px; }
        .card-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 14px; }
        th { background: #f1f5f9; color: #475569; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">ConnectCraft Professional Analytics Summary</div>
        <div class="subtitle">Report for ${user?.name || 'Member'} | Timeframe: ${timeRange} | Generated: ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-lbl">Current Level</div>
          <div class="card-val">${analytics.profileLevel}</div>
        </div>
        <div class="card">
          <div class="card-lbl">Total Impact Score</div>
          <div class="card-val">${analytics.impactScore} pts</div>
        </div>
      </div>

      <h3>Contribution Metrics Overview</h3>
      <table>
        <thead>
          <tr>
            <th>Contribution Category</th>
            <th>Total Count</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Projects Created</td><td>${totals.projectsCreated}</td></tr>
          <tr><td>Projects Completed</td><td>${totals.projectsCompleted}</td></tr>
          <tr><td>Projects Collaborated</td><td>${totals.projectsJoined}</td></tr>
          <tr><td>Communities Created</td><td>${totals.communitiesCreated}</td></tr>
          <tr><td>Communities Joined</td><td>${totals.communitiesJoined}</td></tr>
          <tr><td>Connected Peers</td><td>${totals.connectionsCount}</td></tr>
          <tr><td>Knowledge Resources Shared</td><td>${totals.resourcesShared}</td></tr>
          <tr><td>Workshops Hosted</td><td>${totals.workshopsHosted}</td></tr>
          <tr><td>Workshops Attended</td><td>${totals.workshopsAttended}</td></tr>
          <tr><td>Achievements Earned</td><td>${totals.achievementsEarned}</td></tr>
        </tbody>
      </table>
      <script>window.print();</script>
    </body>
    </html>
  `;
};
