import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '🏆',
    },
    category: {
      type: String,
      enum: ['Networking', 'Community', 'Collaboration', 'Knowledge', 'Leadership'],
      default: 'Collaboration',
    },
    criteriaType: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
