import mongoose from 'mongoose';

const jobCacheSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'all-india', unique: true },
    jobs: { type: Array, default: [] },
    jobCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: null },
    nextRefresh: { type: Date, default: null },
    source: { type: String, default: 'auto' },
  },
  { timestamps: true }
);

export default mongoose.model('JobCache', jobCacheSchema);
