import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function JobDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [skillMatch, setSkillMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api
      .get(`/jobs/${encodeURIComponent(id)}`)
      .then((res) => {
        setJob(res.data.job);
        setSkillMatch(res.data.skillMatch);
      })
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }
    if (!user?.isVerified) {
      toast.error('Please verify your email before applying');
      navigate('/verify-email', { state: { email: user?.email } });
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
      navigate('/applied');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.needsVerification) {
        navigate('/verify-email', { state: { email: user?.email } });
      }
      toast.error(msg || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p>Job not found</p>
        <Link to="/jobs" className="text-primary-600 mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/jobs" className="text-primary-600 text-sm hover:underline mb-4 inline-block">
        ← Back to Jobs
      </Link>

      <div className="card">
        <div className="flex gap-4 items-start">
          {job.logo ? (
            <img src={job.logo} alt="" className="w-16 h-16 rounded-lg object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
              {job.company?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-lg text-slate-600">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              <span>📍 {job.location}</span>
              <span>💰 {job.salary}</span>
              {job.experience && <span>📋 {job.experience}</span>}
              {job.remote && <span className="text-green-600 font-medium">Remote</span>}
              {job.type && <span>{job.type}</span>}
            </div>
          </div>
        </div>

        {skillMatch && (
          <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
            <h3 className="font-semibold text-primary-700">🤖 AI Skill Match: {skillMatch.score}%</h3>
            {skillMatch.matchedSkills?.length > 0 && (
              <p className="text-sm mt-2">
                Matched: {skillMatch.matchedSkills.join(', ')}
              </p>
            )}
            {skillMatch.missingSkills?.length > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                Consider learning: {skillMatch.missingSkills.slice(0, 8).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 prose prose-slate max-w-none">
          <h3 className="font-semibold text-lg mb-2">Job Description</h3>
          <p className="text-slate-700 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {(job.description || 'No description available.').replace(/<[^>]*>/g, '').slice(0, 5000)}
          </p>
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => setShowApply(true)} className="btn-primary">
            Apply Now
          </button>
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Apply on Company Site
            </a>
          )}
        </div>
      </div>

      {showApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Apply for {job.title}</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resume (PDF/DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files[0])}
                  className="input-field"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Or use resume from your profile if uploaded
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Letter</label>
                <textarea
                  className="input-field min-h-[120px]"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you a great fit for this role?"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={applying} className="btn-primary flex-1">
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApply(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
