import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import Profile from '../models/Profile.js';
import { emitMessage, emitConversationUpdate } from '../socket/socketManager.js';

/**
 * Sends a private message between two connected users.
 */
export const sendMessage = async (senderId, receiverId, messageText) => {
  if (!senderId || !receiverId || !messageText) {
    throw new Error('Sender, receiver, and message text are required.');
  }

  if (senderId.toString() === receiverId.toString()) {
    throw new Error('You cannot message yourself.');
  }

  // Verify active connection
  const activeConnection = await Connection.findOne({
    $or: [
      { user1: senderId, user2: receiverId },
      { user1: receiverId, user2: senderId },
    ],
  });

  if (!activeConnection) {
    throw new Error('You can only message users with whom you share an active Connection.');
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [senderId, receiverId],
    });
    await conversation.save();
  }

  // Create message document
  const message = new Message({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    message: messageText.trim(),
    messageType: 'Text',
  });
  await message.save();

  // Update conversation metadata
  conversation.lastMessage = messageText.trim();
  conversation.lastMessageTime = message.createdAt;
  await conversation.save();

  // Populate message for real-time dispatch
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email')
    .populate('receiver', 'name email');

  const senderProfile = await Profile.findOne({ userId: senderId });
  const messageObj = populatedMessage.toObject();
  messageObj.senderProfile = senderProfile ? senderProfile.toObject() : null;

  // 6. Emit Socket.IO real-time message and conversation update
  emitMessage(receiverId, messageObj);
  emitConversationUpdate(receiverId, conversation);
  emitConversationUpdate(senderId, conversation);

  return messageObj;
};
