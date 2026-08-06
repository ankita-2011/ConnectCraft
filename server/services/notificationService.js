import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import { emitNotification } from '../socket/socketManager.js';

/**
 * Creates, saves, and emits a real-time notification to the recipient.
 */
export const createNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  referenceId = '',
  referenceType = '',
}) => {
  try {
    if (!recipientId || !type || !title || !message) return null;

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title: title.trim(),
      message: message.trim(),
      referenceId: referenceId ? referenceId.toString() : '',
      referenceType,
    });

    await notification.save();

    // Populate sender user info if sender is provided
    let notifObj = notification.toObject();
    if (senderId) {
      const populated = await Notification.findById(notification._id).populate('sender', 'name email');
      if (populated && populated.sender) {
        notifObj.sender = populated.sender.toObject();
        const senderProfile = await Profile.findOne({ userId: senderId });
        if (senderProfile) {
          notifObj.senderProfile = senderProfile.toObject();
        }
      }
    }

    // Real-time Socket.IO emission
    emitNotification(recipientId, notifObj);

    return notifObj;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
