import jwt from 'jsonwebtoken';
import Profile from '../models/Profile.js';

let ioInstance = null;

/**
 * Parses JWT token from cookies string or handshake auth query.
 */
const parseTokenFromSocket = (socket) => {
  let token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token && socket.handshake.headers?.cookie) {
    const cookies = socket.handshake.headers.cookie.split(';');
    for (let cookie of cookies) {
      const [key, val] = cookie.trim().split('=');
      if (key === 'token') {
        token = val;
        break;
      }
    }
  }
  return token;
};

const onlineSocketsMap = new Map(); // userId string => active socket count

/**
 * Broadcasts list of active online user IDs respecting showOnlineStatus privacy settings.
 */
export const broadcastOnlineUsers = async () => {
  if (!ioInstance) return;
  try {
    const activeUserIds = Array.from(onlineSocketsMap.keys());
    if (activeUserIds.length === 0) {
      ioInstance.emit('online-users', []);
      return;
    }

    // Exclude users who disabled online status in privacy preferences.
    const hiddenProfiles = await Profile.find({
      userId: { $in: activeUserIds },
      'privacySettings.showOnlineStatus': false,
    }).select('userId');

    const hiddenUserIdSet = new Set(hiddenProfiles.map((p) => p.userId.toString()));
    const visibleOnlineUserIds = activeUserIds.filter((id) => !hiddenUserIdSet.has(id.toString()));

    ioInstance.emit('online-users', visibleOnlineUserIds);
  } catch (err) {
    console.error('[SOCKET] Error broadcasting online users:', err);
  }
};

/**
 * Initializes Socket.IO server layer with JWT authentication and user room binding.
 * @param {Object} io Socket.IO Server instance
 */
export const initSocketServer = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = parseTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId?.toString();
    const roomName = `user_${userId}`;
    
    socket.join(roomName);

    if (userId) {
      const count = onlineSocketsMap.get(userId) || 0;
      onlineSocketsMap.set(userId, count + 1);
      broadcastOnlineUsers();
    }

    socket.on('join-user', (id) => {
      if (id && id.toString() === userId) {
        socket.join(roomName);
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        const count = onlineSocketsMap.get(userId) || 1;
        if (count <= 1) {
          onlineSocketsMap.delete(userId);
        } else {
          onlineSocketsMap.set(userId, count - 1);
        }
        broadcastOnlineUsers();
      }
    });
  });
};

/**
 * Emits real-time event to a target user room.
 */
export const emitToUser = (userId, eventName, payload) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId.toString()}`).emit(eventName, payload);
  }
};

/**
 * Emits real-time notification to recipient.
 */
export const emitNotification = (recipientId, notificationData) => {
  emitToUser(recipientId, 'new-notification', notificationData);
};

/**
 * Emits private message to receiver.
 */
export const emitMessage = (receiverId, messageData) => {
  emitToUser(receiverId, 'receive-message', messageData);
};

/**
 * Emits conversation update event to user.
 */
export const emitConversationUpdate = (userId, conversationData) => {
  emitToUser(userId, 'conversation-updated', conversationData);
};

/**
 * Disconnects all active sockets for a given user ID upon account deletion.
 */
export const disconnectUserSockets = (userId) => {
  if (ioInstance && userId) {
    const roomName = `user_${userId.toString()}`;
    ioInstance.in(roomName).disconnectSockets(true);
  }
};

