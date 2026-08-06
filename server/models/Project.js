import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: mongoose.Schema.Types.ObjectId ? String : String,
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
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
        'Hackathon',
        'Open Source',
        'Other',
      ],
      default: 'Web Development',
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    estimatedDuration: {
      type: String,
      default: '1-2 months',
    },
    teamSize: {
      type: Number,
      required: [true, 'Team size is required'],
      min: [1, 'Team size must be at least 1 member'],
      default: 4,
    },
    visibility: {
      type: String,
      enum: ['Public', 'Private'],
      default: 'Public',
    },
    status: {
      type: String,
      enum: ['Recruiting', 'Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Recruiting',
    },
    bannerImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search queries
projectSchema.index({ category: 1 });
projectSchema.index({ requiredSkills: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
