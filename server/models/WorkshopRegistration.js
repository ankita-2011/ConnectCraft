import mongoose from 'mongoose';

const workshopRegistrationSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate registrations
workshopRegistrationSchema.index({ workshop: 1, user: 1 }, { unique: true });

const WorkshopRegistration = mongoose.model('WorkshopRegistration', workshopRegistrationSchema);

export default WorkshopRegistration;
