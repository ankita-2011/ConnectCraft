import mongoose from 'mongoose';

const deletedAccountSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    accountRole: {
      type: String,
      default: 'USER',
    },
    accountCreatedDate: {
      type: Date,
      required: true,
    },
    accountDeletedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletedBy: {
      type: String,
      enum: ['Self', 'Admin'],
      required: true,
    },
    deletionReason: {
      type: String,
      default: '',
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deletedAccountSchema.index({ accountDeletedDate: -1 });
deletedAccountSchema.index({ deletedBy: 1 });

const DeletedAccount = mongoose.model('DeletedAccount', deletedAccountSchema);

export default DeletedAccount;
