import mongoose from 'mongoose';

const projectInvitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      maxlength: [250, 'Message cannot exceed 250 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize pending invitation queries
projectInvitationSchema.index({ project: 1, receiver: 1, status: 1 });
projectInvitationSchema.index({ sender: 1, status: 1 });

const ProjectInvitation = mongoose.model('ProjectInvitation', projectInvitationSchema);

export default ProjectInvitation;
