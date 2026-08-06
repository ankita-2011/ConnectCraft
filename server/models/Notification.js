import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'connection_request',
        'connection_accepted',
        'project_invitation',
        'project_invitation_accepted',
        'project_invitation_rejected',
        'added_to_project',
        'project_status_updated',
        'resource_shared',
        'community_announcement',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
      trim: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    referenceType: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for chronological history queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
