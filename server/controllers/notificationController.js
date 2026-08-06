import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';

/**
 * @desc    Get user's notifications list (newest first)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const rawNotifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email');

    const senderIds = rawNotifications.map((n) => n.sender?._id).filter(Boolean);
    const profiles = await Profile.find({ userId: { $in: senderIds } });

    const notifications = rawNotifications.map((n) => {
      const nObj = n.toObject();
      if (nObj.sender) {
        const p = profiles.find((prof) => prof.userId.toString() === nObj.sender._id.toString());
        nObj.senderProfile = p ? p.toObject() : null;
      }
      return nObj;
    });

    res.status(200).json({
      status: 'success',
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving notifications.',
    });
  }
};

/**
 * @desc    Delete single notification by ID
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found.',
      });
    }

    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this notification.',
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting notification.',
    });
  }
};

/**
 * @desc    Clear all notifications for logged-in user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      status: 'success',
      message: 'All notifications cleared successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error clearing notifications.',
    });
  }
};
