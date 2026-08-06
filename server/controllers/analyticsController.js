import {
  getPersonalAnalytics as fetchPersonalAnalytics,
  getMonthlySummary as fetchMonthlySummary,
  getCommunityAnalytics as fetchCommunityAnalytics,
  getProjectAnalytics as fetchProjectAnalytics,
  getWorkshopAnalytics as fetchWorkshopAnalytics,
  getResourceAnalytics as fetchResourceAnalytics,
  generateCSVExport,
  generatePDFExport,
} from '../services/analyticsService.js';

/**
 * @desc    Get personal analytics summary
 * @route   GET /api/analytics/personal
 * @access  Private
 */
export const getPersonalAnalytics = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const data = await fetchPersonalAnalytics(req.user._id, timeRange);

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving personal analytics.',
    });
  }
};

/**
 * @desc    Get monthly summary comparisons
 * @route   GET /api/analytics/monthly-summary
 * @access  Private
 */
export const getMonthlySummary = async (req, res) => {
  try {
    const data = await fetchMonthlySummary(req.user._id);

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving monthly summary.',
    });
  }
};

/**
 * @desc    Get community analytics
 * @route   GET /api/analytics/community/:id
 * @access  Private
 */
export const getCommunityAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchCommunityAnalytics(id);

    if (!data) {
      return res.status(404).json({ status: 'fail', message: 'Community not found.' });
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving community analytics.',
    });
  }
};

/**
 * @desc    Get project analytics
 * @route   GET /api/analytics/project/:id
 * @access  Private
 */
export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchProjectAnalytics(id);

    if (!data) {
      return res.status(404).json({ status: 'fail', message: 'Project not found.' });
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving project analytics.',
    });
  }
};

/**
 * @desc    Get workshop analytics
 * @route   GET /api/analytics/workshop
 * @access  Private
 */
export const getWorkshopAnalytics = async (req, res) => {
  try {
    const data = await fetchWorkshopAnalytics(req.user._id);

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving workshop analytics.',
    });
  }
};

/**
 * @desc    Get resource analytics
 * @route   GET /api/analytics/resources
 * @access  Private
 */
export const getResourceAnalytics = async (req, res) => {
  try {
    const data = await fetchResourceAnalytics(req.user._id);

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving resource analytics.',
    });
  }
};

/**
 * @desc    Export analytics report as CSV
 * @route   GET /api/analytics/export/csv
 * @access  Private
 */
export const exportCSV = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const csvData = await generateCSVExport(req.user._id, timeRange);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=connectcraft_analytics_${timeRange}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error generating CSV report.',
    });
  }
};

/**
 * @desc    Export analytics report as PDF printable document
 * @route   GET /api/analytics/export/pdf
 * @access  Private
 */
export const exportPDF = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const htmlData = await generatePDFExport(req.user._id, timeRange);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error generating PDF report.',
    });
  }
};
