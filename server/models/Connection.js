import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user2: {
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
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index optimization on active connections search
connectionSchema.index({ user1: 1, user2: 1 });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
