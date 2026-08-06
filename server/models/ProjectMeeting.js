import mongoose from 'mongoose';

const projectMeetingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    agenda: {
      type: String,
      trim: true,
      default: '',
    },
    meetingDate: {
      type: Date,
      required: [true, 'Meeting date and time are required'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    platform: {
      type: String,
      default: 'Google Meet',
      enum: ['Google Meet', 'Zoom', 'Microsoft Teams', 'Jitsi', 'Other'],
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectMeeting = mongoose.model('ProjectMeeting', projectMeetingSchema);

export default ProjectMeeting;
