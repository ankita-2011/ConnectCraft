import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      maxlength: [100, 'Headline cannot be more than 100 characters'],
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    skillsToTeach: {
      type: [String],
      default: [],
    },
    skillsToLearn: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    availability: {
      type: [String],
      default: [], // e.g. Weekdays, Weekends, etc.
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      dribbble: { type: String, default: '' },
      youtube: { type: String, default: '' },
      instagram: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    reputation: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    profileCompletion: {
      type: Number,
      default: 0,
    },
    impactScore: {
      type: Number,
      default: 0,
      index: true,
    },
    level: {
      type: String,
      enum: ['Explorer', 'Collaborator', 'Creator', 'Mentor', 'Leader', 'Visionary'],
      default: 'Explorer',
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    privacySettings: {
      publicProfile: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
    },
    notificationSettings: {
      emailInvites: { type: Boolean, default: true },
      pushMessages: { type: Boolean, default: true },
      pushMentions: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for optimizing search engine query lookups
profileSchema.index({ skillsToTeach: 1 });
profileSchema.index({ skillsToLearn: 1 });
profileSchema.index({ interests: 1 });
profileSchema.index({ location: 1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
