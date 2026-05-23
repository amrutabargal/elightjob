import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { scrollToSection } from '../utils/scroll';
import Icon from './Icon';

export default function JobModal({ jobId, onClose, onOpenAuth, onApplied }) {
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState(null);
  const [skillMatch, setSkillMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    api
      .get(`/jobs/${encodeURIComponent(jobId)}`)
      .then((res) => {
        setJob(res.data.job);
        setSkillMatch(res.data.skillMatch);
      })
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      onClose();
      onOpenAuth('login');
      return;
    }
    if (!user?.isVerified) {
      toast.error('Verify your email before applying');
      onClose();
      onOpenAuth('verify', user?.email);
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('jobId', job.id);
      formData.append('coverLetter', coverLetter);
      if (resume) formData.append('resume', resume);

      const { data } = await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      setShowApply(false);
      onClose();
      onApplied?.();
      scrollToSection('applied');
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        onClose();
        onOpenAuth('verify', user?.email);
      }
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 job-modal-overlay flex items-center justify-center p-4 z-[100]" onClick={onClose}>
      <div className="job-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="job-modal-header">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">Job Details</p>
              <h2 className="text-xl md:text-2xl font-extrabold leading-snug">
                {loading ? 'Loading…' : job?.title}
              </h2>
              {!loading && job && (
                <p className="text-teal-100 font-semibold mt-2 flex items-center gap-2">
                  <Icon name="apartment" size={20} />
                  {job.company}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="job-modal-close shrink-0">
              <Icon name="close" size={24} />
            </button>
          </div>
        </div>

        <div className="job-modal-content">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full" />
            </div>
          ) : !job ? (
            <div className="jobs-empty-state py-12">
              <Icon name="error_outline" size={48} className="text-slate-300" />
              <p className="text-slate-600 font-medium mt-3">Job not found</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="job-tag job-tag-location">
                  <Icon name="location_on" size={14} />
                  {job.city || job.location}
                </span>
                {job.category && job.category !== 'General' && (
                  <span className="job-tag job-tag-category">
                    <Icon name="category" size={14} />
                    {job.category}
                  </span>
                )}
                {job.salary && job.salary !== 'Not disclosed' && (
                  <span className="job-tag job-tag-salary">
                    <Icon name="payments" size={14} />
                    {job.salary}
                  </span>
                )}
                {job.remote && (
                  <span className="job-tag job-tag-remote">
                    <Icon name="home_work" size={14} />
                    Remote
                  </span>
                )}
              </div>

              {skillMatch && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                  <div className="job-match-bar mb-2">
                    <div className="job-match-fill" style={{ width: `${skillMatch.score}%` }} />
                  </div>
                  <p className="font-bold text-violet-800 flex items-center gap-2">
                    <Icon name="auto_awesome" size={22} filled />
                    AI Skill Match: {skillMatch.score}%
                  </p>
                  {skillMatch.matchedSkills?.length > 0 && (
                    <p className="mt-2 text-sm text-violet-700">
                      Matched skills: {skillMatch.matchedSkills.join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Icon name="description" size={20} className="text-brand-orange" />
                  Description
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {(job.description || 'No description provided.').replace(/<[^>]*>/g, '').slice(0, 4000)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <button type="button" onClick={() => setShowApply(true)} className="btn-primary flex-1 sm:flex-none py-3.5 px-8">
                  <Icon name="send" size={20} />
                  Apply Now
                </button>
                {job.applyUrl && (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3.5">
                    <Icon name="open_in_new" size={20} />
                    Company Site
                  </a>
                )}
              </div>

              {showApply && (
                <form onSubmit={handleApply} className="mt-6 p-5 bg-orange-50/50 rounded-xl border border-orange-100 space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Icon name="upload_file" size={22} className="text-brand-orange" />
                    Submit Application
                  </h4>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files[0])} className="input-field bg-white" />
                  <textarea
                    className="input-field min-h-[100px] bg-white"
                    placeholder="Cover letter (optional)"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={applying} className="btn-primary flex-1">
                      <Icon name="check_circle" size={18} />
                      {applying ? 'Submitting…' : 'Submit Application'}
                    </button>
                    <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
