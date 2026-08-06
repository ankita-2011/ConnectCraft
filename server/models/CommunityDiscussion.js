import mongoose from 'mongoose';

const communityDiscussionSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Discussion title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Discussion content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    tags: {
      type: [String],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimise queries for community feed and sorting
communityDiscussionSchema.index({ community: 1, createdAt: -1 });
communityDiscussionSchema.index({ community: 1, isPinned: -1, createdAt: -1 });

const CommunityDiscussion = mongoose.model('CommunityDiscussion', communityDiscussionSchema);

export default CommunityDiscussion;
