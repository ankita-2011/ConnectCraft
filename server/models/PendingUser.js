import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: Auto-delete unverified pending registrations after 15 minutes
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;
