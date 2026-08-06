import mongoose from 'mongoose';

const impactHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
    },
    impactPoints: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    referenceType: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

impactHistorySchema.index({ user: 1, createdAt: -1 });

const ImpactHistory = mongoose.model('ImpactHistory', impactHistorySchema);

export default ImpactHistory;
