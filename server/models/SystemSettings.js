import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'GLOBAL_SETTINGS',
      unique: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    userRegistration: {
      type: Boolean,
      default: true,
    },
    communityCreation: {
      type: Boolean,
      default: true,
    },
    workshopCreation: {
      type: Boolean,
      default: true,
    },
    maxUploadLimitMB: {
      type: Number,
      default: 10,
    },
    defaultUserRole: {
      type: String,
      default: 'USER',
    },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
