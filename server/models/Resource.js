import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [250, 'Short description cannot exceed 250 characters'],
    },
    content: {
      type: String,
      required: [true, 'Resource content or overview is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: [
        'Article',
        'GitHub Repository',
        'YouTube Video',
        'Website',
        'Documentation',
        'Research Paper',
        'Course',
        'Figma Design',
        'Google Drive',
        'Other',
      ],
      default: 'Article',
    },
    externalLink: {
      type: String,
      trim: true,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile Development',
        'AI / Machine Learning',
        'Data Science',
        'Cyber Security',
        'Blockchain',
        'UI / UX',
        'Game Development',
        'Cloud Computing',
        'Research',
        'Other',
      ],
      default: 'Web Development',
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['Public', 'Community Only', 'Project Only'],
      default: 'Public',
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Search and filter indexes
resourceSchema.index({ category: 1 });
resourceSchema.index({ resourceType: 1 });
resourceSchema.index({ visibility: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ likesCount: -1 });
resourceSchema.index({ views: -1 });

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
