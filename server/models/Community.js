import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    communityName: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    joinRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rules: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search queries on tags, categories, and member count
communitySchema.index({ tags: 1 });
communitySchema.index({ category: 1 });
communitySchema.index({ memberCount: -1 });

const Community = mongoose.model('Community', communitySchema);

export default Community;
