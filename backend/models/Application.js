import mongoose from 'mongoose';

const STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
];

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, default: 'Unknown' },
    companyLogo: String,
    location: String,
    salary: String,
    jobSource: String,
    applyUrl: String,
    resumePath: String,
    resumeOriginalName: String,
    coverLetter: { type: String, default: '' },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Applied',
    },
    skillMatchScore: Number,
    atsScore: Number,
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, jobId: 1 }, { unique: true });

export { STATUSES };
export default mongoose.model('Application', applicationSchema);
