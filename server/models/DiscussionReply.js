import mongoose from 'mongoose';

const discussionReplySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityDiscussion',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Chronological replies for a discussion thread
discussionReplySchema.index({ discussion: 1, createdAt: 1 });

const DiscussionReply = mongoose.model('DiscussionReply', discussionReplySchema);

export default DiscussionReply;
