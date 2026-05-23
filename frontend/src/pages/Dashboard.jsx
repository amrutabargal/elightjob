import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-purple-100 text-purple-800',
  Interview: 'bg-indigo-100 text-indigo-800',
  Selected: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    skills: (user?.skills || []).join(', '),
    experience: user?.experience || '',
    location: user?.location || '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [savedJobDetails, setSavedJobDetails] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get('/applications').then((res) => setApplications(res.data.applications || []));
    api.get('/ai/recommended').then((res) => setRecommended(res.data.jobs || []));
  }, []);

  useEffect(() => {
    if (user?.savedJobs?.length) {
      Promise.all(
        user.savedJobs.slice(0, 10).map((id) =>
          api.get(`/jobs/${encodeURIComponent(id)}`).then((r) => r.data.job).catch(() => null)
        )
      ).then((jobs) => setSavedJobDetails(jobs.filter(Boolean)));
    }
  }, [user?.savedJobs]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = profile.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put('/users/profile', { ...profile, skills });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) {
      toast.error('Select a resume file');
      return;
    }
    const formData = new FormData();
    formData.append('resume', resumeFile);
    setAnalyzing(true);
    try {
      const { data } = await api.post('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(data.analysis);
      await refreshUser();
      toast.success('Resume uploaded & analyzed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalyzer = async () => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      const { data } = await api.post('/ai/resume-analyzer', formData, {
        headers: resumeFile ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      setAnalysis(data.analysis);
      toast.success('Resume analyzed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {!user?.isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 font-medium">⚠️ Email not verified</p>
          <p className="text-sm text-amber-700 mt-1">
            Verify your email to apply for jobs.{' '}
            <Link to="/verify-email" state={{ email: user?.email }} className="underline">
              Verify now
            </Link>
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="input-field"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
              <input
                className="input-field"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="React, Node.js, Python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Experience</label>
              <input
                className="input-field"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="2 years in web development"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                className="input-field"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="text-xl font-bold mb-4">🤖 AI Resume Analyzer</h2>
          {user?.resumeOriginalName && (
            <p className="text-sm text-slate-600 mb-2">
              Current resume: {user.resumeOriginalName}
            </p>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0])}
            className="input-field mb-3"
          />
          <div className="flex gap-2 flex-wrap">
            <button onClick={uploadResume} disabled={analyzing} className="btn-primary text-sm">
              Upload & Analyze
            </button>
            <button onClick={runAnalyzer} disabled={analyzing} className="btn-secondary text-sm">
              Analyze Resume
            </button>
          </div>

          {analysis && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-primary-600">{analysis.atsScore}%</div>
                <div>
                  <p className="font-semibold">ATS Resume Score</p>
                  <p className="text-sm text-slate-500">{analysis.wordCount} words detected</p>
                </div>
              </div>
              {analysis.detectedSkills?.length > 0 && (
                <p className="text-sm mb-2">
                  <strong>Skills:</strong> {analysis.detectedSkills.join(', ')}
                </p>
              )}
              {analysis.suggestions?.length > 0 && (
                <ul className="text-sm text-slate-600 list-disc ml-4">
                  {analysis.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Applications</h2>
          <Link to="/applied" className="text-primary-600 text-sm hover:underline">
            View all →
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-slate-500">No applications yet.</p>
        ) : (
          <div className="grid gap-3">
            {applications.slice(0, 5).map((app) => (
              <div key={app._id} className="card flex justify-between items-center py-4">
                <div>
                  <p className="font-semibold">{app.jobTitle}</p>
                  <p className="text-sm text-slate-500">{app.company}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-slate-100'}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">AI Recommended Jobs</h2>
          <div className="grid gap-4">
            {recommended.slice(0, 4).map((job) => (
              <JobCard key={job.id} job={job} matchScore={job.matchScore} />
            ))}
          </div>
        </section>
      )}

      {savedJobDetails.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Saved Jobs</h2>
          <div className="grid gap-4">
            {savedJobDetails.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
