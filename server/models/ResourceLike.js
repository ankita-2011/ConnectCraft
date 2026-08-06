import mongoose from 'mongoose';

const resourceLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate likes per user per resource
resourceLikeSchema.index({ user: 1, resource: 1 }, { unique: true });

const ResourceLike = mongoose.model('ResourceLike', resourceLikeSchema);

export default ResourceLike;
