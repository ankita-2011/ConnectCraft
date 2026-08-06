import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import { sendMessage } from '../services/chatService.js';

/**
 * @desc    Get user conversations list
 * @route   GET /api/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const rawConversations = await Conversation.find({
      participants: userId,
    })
      .sort({ lastMessageTime: -1 })
      .populate('participants', 'name email');

    // Find peer user and profile details for each conversation
    const peerUserIds = [];
    rawConversations.forEach((conv) => {
      conv.participants.forEach((p) => {
        if (p._id.toString() !== userId.toString()) {
          peerUserIds.push(p._id);
        }
      });
    });

    const peerProfiles = await Profile.find({ userId: { $in: peerUserIds } });

    const conversations = rawConversations.map((conv) => {
      const cObj = conv.toObject();
      const peerUser = cObj.participants.find((p) => p._id.toString() !== userId.toString());
      const peerProfile = peerProfiles.find((prof) => prof.userId.toString() === (peerUser?._id || '').toString());

      cObj.peer = peerUser ? {
        _id: peerUser._id,
        name: peerUser.name,
        email: peerUser.email,
        username: peerProfile?.username || '',
        headline: peerProfile?.headline || '',
        profilePhoto: peerProfile?.profilePhoto || '',
        showOnlineStatus: peerProfile?.privacySettings?.showOnlineStatus !== false,
      } : null;

      return cObj;
    });

    res.status(200).json({
      status: 'success',
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving conversations.',
    });
  }
};

/**
 * @desc    Get single conversation details by ID
 * @route   GET /api/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid conversation ID.',
      });
    }

    const conversation = await Conversation.findById(id).populate('participants', 'name email');
    if (!conversation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Conversation not found.',
      });
    }

    const isParticipant = conversation.participants.some((p) => p._id.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not a participant in this conversation.',
      });
    }

    const cObj = conversation.toObject();
    const peerUser = cObj.participants.find((p) => p._id.toString() !== userId.toString());
    const peerProfile = peerUser ? await Profile.findOne({ userId: peerUser._id }) : null;

    cObj.peer = peerUser ? {
      _id: peerUser._id,
      name: peerUser.name,
      email: peerUser.email,
      username: peerProfile?.username || '',
      headline: peerProfile?.headline || '',
      profilePhoto: peerProfile?.profilePhoto || '',
    } : null;

    res.status(200).json({
      status: 'success',
      conversation: cObj,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving conversation details.',
    });
  }
};

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid conversation ID.',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Conversation not found.',
      });
    }

    const isParticipant = conversation.participants.some((pId) => pId.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view messages in this conversation.',
      });
    }

    const rawMessages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    const senderIds = rawMessages.map((m) => m.sender._id);
    const profiles = await Profile.find({ userId: { $in: senderIds } });

    const messages = rawMessages.map((m) => {
      const mObj = m.toObject();
      const p = profiles.find((prof) => prof.userId.toString() === m.sender._id.toString());
      mObj.senderProfile = p ? p.toObject() : null;
      return mObj;
    });

    res.status(200).json({
      status: 'success',
      messages,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving conversation messages.',
    });
  }
};

/**
 * @desc    Send a private message via REST API
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessageHttp = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Recipient ID and message content are required.',
      });
    }

    const messageObj = await sendMessage(senderId, receiverId, message);

    res.status(201).json({
      status: 'success',
      message: messageObj,
    });
  } catch (error) {
    console.error('[CHAT] Error sending message:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while sending message. Please try again.',
    });
  }
};
