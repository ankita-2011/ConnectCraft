import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly query user conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageTime: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
