import mongoose from 'mongoose';

const workshopSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Workshop title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        'Workshop',
        'Webinar',
        'Study Session',
        'Project Meeting',
        'Hackathon',
        'AMA',
        'Community Meetup',
        'Code Review Session',
        'Tech Talk',
        'Other',
      ],
      default: 'Workshop',
    },
    category: {
      type: String,
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
      required: [true, 'Category is required'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
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
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    duration: {
      type: String,
      default: '60 mins',
    },
    maxParticipants: {
      type: Number,
      default: 50,
      min: [1, 'Maximum participants must be at least 1'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'],
      default: 'Upcoming',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search text index for fast keyword matching
workshopSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
workshopSchema.index({ date: 1, status: 1 });

const Workshop = mongoose.model('Workshop', workshopSchema);

export default Workshop;
