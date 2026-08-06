import CommunityDiscussion from '../models/CommunityDiscussion.js';
import DiscussionReply from '../models/DiscussionReply.js';
import Community from '../models/Community.js';

/**
 * @desc    Get discussions for a community
 * @route   GET /api/discussions?communityId=xxx
 * @access  Private
 */
export const getDiscussions = async (req, res) => {
  try {
    const { communityId } = req.query;

    if (!communityId) {
      return res.status(400).json({ status: 'fail', message: 'communityId query parameter is required.' });
    }

    const discussions = await CommunityDiscussion.find({ community: communityId })
      .populate('author', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ status: 'success', discussions });
  } catch (error) {
    console.error('[DISCUSSIONS] Fetch error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error while fetching discussions.' });
  }
};

/**
 * @desc    Create a new discussion in a community
 * @route   POST /api/discussions
 * @access  Private (must be a community member)
 */
export const createDiscussion = async (req, res) => {
  try {
    const { communityId, title, content, tags } = req.body;

    if (!communityId || !title || !content) {
      return res.status(400).json({ status: 'fail', message: 'communityId, title, and content are required.' });
    }

    // Verify the user is a member of the community
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ status: 'fail', message: 'Community not found.' });
    }

    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ status: 'fail', message: 'You must be a member of this community to post a discussion.' });
    }

    const discussion = await CommunityDiscussion.create({
      community: communityId,
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      tags: tags || [],
    });

    const populated = await CommunityDiscussion.findById(discussion._id)
      .populate('author', 'name')
      .lean();

    res.status(201).json({ status: 'success', discussion: populated });
  } catch (error) {
    console.error('[DISCUSSIONS] Create error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error while creating discussion.' });
  }
};

/**
 * @desc    Get replies for a discussion
 * @route   GET /api/discussions/:id/replies
 * @access  Private
 */
export const getReplies = async (req, res) => {
  try {
    const { id } = req.params;

    const replies = await DiscussionReply.find({ discussion: id })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ status: 'success', replies });
  } catch (error) {
    console.error('[DISCUSSIONS] Replies fetch error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error while fetching replies.' });
  }
};

/**
 * @desc    Post a reply to a discussion
 * @route   POST /api/discussions/:id/replies
 * @access  Private
 */
export const createReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ status: 'fail', message: 'Reply content is required.' });
    }

    const discussion = await CommunityDiscussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ status: 'fail', message: 'Discussion not found.' });
    }

    const reply = await DiscussionReply.create({
      discussion: id,
      author: req.user._id,
      content: content.trim(),
    });

    // Increment reply count
    discussion.repliesCount = (discussion.repliesCount || 0) + 1;
    await discussion.save();

    const populated = await DiscussionReply.findById(reply._id)
      .populate('author', 'name')
      .lean();

    res.status(201).json({ status: 'success', reply: populated });
  } catch (error) {
    console.error('[DISCUSSIONS] Reply create error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error while posting reply.' });
  }
};
