import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema(
  {
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
    connectionType: {
      type: String,
      enum: ['learning', 'mentorship', 'project_collaboration', 'workshop', 'networking'],
      default: 'learning',
    },
    message: {
      type: String,
      maxlength: [250, 'Message cannot exceed 250 characters'],
      default: '',
    },
    recommendationSummary: {
      canTeachYou: { type: [String], default: [] },
      youCanTeach: { type: [String], default: [] },
      sharedInterests: { type: [String], default: [] },
      sharedCommunities: { type: [String], default: [] },
      sharedLanguages: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate pending connection requests
connectionRequestSchema.index({ sender: 1, receiver: 1, connectionType: 1, status: 1 });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;
