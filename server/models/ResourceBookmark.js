import mongoose from 'mongoose';

const resourceBookmarkSchema = new mongoose.Schema(
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

// Prevent duplicate bookmarks per user per resource
resourceBookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

const ResourceBookmark = mongoose.model('ResourceBookmark', resourceBookmarkSchema);

export default ResourceBookmark;
