import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import { generateRecommendationReasons, getSuggestedPartners } from '../services/recommendationService.js';
import { createNotification } from '../services/notificationService.js';


/**
 * @desc    Get active user connections
 * @route   GET /api/connections
 * @access  Private
 */
export const getConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find connections where user is user1 or user2
    const connections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
    });

    const activeUserIds = connections.map((c) =>
      c.user1.toString() === userId.toString() ? c.user2 : c.user1
    );

    // Load full profile details for connected users
    const profiles = await Profile.find({
      userId: { $in: activeUserIds },
    }).populate('userId', 'name email');

    // Filter out deleted users where populated userId is null
    const validProfiles = profiles.filter((p) => p.userId);

    // Merge connection information into the profiles payload
    const result = validProfiles.map((p) => {
      const conn = connections.find(
        (c) =>
          c.user1.toString() === p.userId._id.toString() ||
          c.user2.toString() === p.userId._id.toString()
      );
      const pObj = p.toObject();
      pObj.connectionId = conn._id;
      pObj.connectedAt = conn.connectedAt;
      return pObj;
    });

    res.status(200).json({
      status: 'success',
      connections: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving connections.',
    });
  }
};

/**
 * @desc    Get suggested connections
 * @route   GET /api/connections/suggestions
 * @access  Private
 */
export const getSuggestions = async (req, res) => {
  try {
    const suggestions = await getSuggestedPartners(req.user._id, 12);
    res.status(200).json({
      status: 'success',
      suggestions,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving suggestions.',
    });
  }
};

/**
 * @desc    Get pending received connection requests
 * @route   GET /api/connections/pending
 * @access  Private
 */
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ConnectionRequest.find({
      receiver: userId,
      status: 'pending',
    }).populate('sender', 'name email');

    const validRequests = requests.filter((r) => r.sender);
    const senderIds = validRequests.map((r) => r.sender._id);
    const senderProfiles = await Profile.find({ userId: { $in: senderIds } });

    const result = validRequests.map((r) => {
      const p = senderProfiles.find((profile) => profile.userId && profile.userId.toString() === r.sender._id.toString());
      const rObj = r.toObject();
      rObj.senderProfile = p ? p.toObject() : null;
      return rObj;
    });

    res.status(200).json({
      status: 'success',
      requests: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving pending requests.',
    });
  }
};

/**
 * @desc    Get sent connection requests
 * @route   GET /api/connections/sent
 * @access  Private
 */
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ConnectionRequest.find({
      sender: userId,
      status: 'pending',
    }).populate('receiver', 'name email');

    const validRequests = requests.filter((r) => r.receiver);
    const receiverIds = validRequests.map((r) => r.receiver._id);
    const receiverProfiles = await Profile.find({ userId: { $in: receiverIds } });

    const result = validRequests.map((r) => {
      const p = receiverProfiles.find((profile) => profile.userId && profile.userId.toString() === r.receiver._id.toString());
      const rObj = r.toObject();
      rObj.receiverProfile = p ? p.toObject() : null;
      return rObj;
    });

    res.status(200).json({
      status: 'success',
      requests: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving sent requests.',
    });
  }
};

/**
 * @desc    Send connection request
 * @route   POST /api/connections/request
 * @access  Private
 */
export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId, connectionType = 'learning', message = '' } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Receiver ID is required.',
      });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot connect with yourself.',
      });
    }

    // Check receiver user, role, and account status
    const receiverUser = await User.findById(receiverId);
    if (!receiverUser || receiverUser.accountStatus !== 'active' || ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(receiverUser.role)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot send connection request to this account.',
      });
    }

    // Check receiver profile exists
    const receiverProfile = await Profile.findOne({ userId: receiverId });
    if (!receiverProfile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Recipient profile not found.',
      });
    }

    const senderProfile = await Profile.findOne({ userId: senderId });
    if (!senderProfile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sender profile not found.',
      });
    }

    // Check if already connected
    const alreadyConnected = await Connection.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    });

    if (alreadyConnected) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already connected with this user.',
      });
    }

    // Check if active pending request exists
    const activeRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' },
      ],
    });

    if (activeRequest) {
      return res.status(400).json({
        status: 'fail',
        message: 'A connection request between you is already pending.',
      });
    }

    // Calculate match reasons in real-time
    const myCommunities = await Community.find({ members: senderId }).select('communityName members');
    const reasons = generateRecommendationReasons(senderProfile, receiverProfile, myCommunities);

    const request = new ConnectionRequest({
      sender: senderId,
      receiver: receiverId,
      connectionType,
      message: message.slice(0, 250),
      recommendationSummary: reasons,
      status: 'pending',
    });

    await request.save();

    // Trigger real-time notification
    createNotification({
      recipientId: receiverId,
      senderId: senderId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${req.user.name || 'A peer'} sent you a connection request.`,
      referenceId: request._id,
      referenceType: 'ConnectionRequest',
    });

    res.status(201).json({
      status: 'success',
      request,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error sending request.',
    });
  }
};

/**
 * @desc    Accept connection request
 * @route   POST /api/connections/accept/:id
 * @access  Private
 */
export const acceptConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection request not found.',
      });
    }

    // Auth check: Receiver only
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to accept this request.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Request is already ${request.status}.`,
      });
    }

    // Update request
    request.status = 'accepted';
    await request.save();

    // Create Connection pair
    const connection = new Connection({
      user1: request.sender,
      user2: request.receiver,
      connectionType: request.connectionType,
    });

    await connection.save();

    // Trigger real-time notification
    createNotification({
      recipientId: request.sender,
      senderId: userId,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${req.user.name || 'A peer'} accepted your connection request!`,
      referenceId: connection._id,
      referenceType: 'Connection',
    });

    res.status(200).json({
      status: 'success',
      message: 'Request accepted successfully.',
      connection,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error accepting request.',
    });
  }
};

/**
 * @desc    Reject connection request
 * @route   POST /api/connections/reject/:id
 * @access  Private
 */
export const rejectConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection request not found.',
      });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to reject this request.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Request is already ${request.status}.`,
      });
    }

    request.status = 'rejected';
    await request.save();

    res.status(200).json({
      status: 'success',
      message: 'Request rejected successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error rejecting request.',
    });
  }
};

/**
 * @desc    Cancel connection request
 * @route   POST /api/connections/cancel/:id
 * @access  Private
 */
export const cancelConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection request not found.',
      });
    }

    if (request.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only cancel requests you sent.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Request is already ${request.status}.`,
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      status: 'success',
      message: 'Request cancelled successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error cancelling request.',
    });
  }
};

/**
 * @desc    Remove an active Connection
 * @route   DELETE /api/connections/:id
 * @access  Private
 */
export const removeConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found.',
      });
    }

    // Auth check: User1 or User2
    if (
      connection.user1.toString() !== userId.toString() &&
      connection.user2.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to remove this connection.',
      });
    }

    await Connection.findByIdAndDelete(id);

    // Also update any pending or accepted connection request records between the users to keep historical consistency
    await ConnectionRequest.updateMany(
      {
        $or: [
          { sender: connection.user1, receiver: connection.user2 },
          { sender: connection.user2, receiver: connection.user1 },
        ],
        status: 'accepted',
      },
      { status: 'cancelled' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Connection removed successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error removing connection.',
    });
  }
};
