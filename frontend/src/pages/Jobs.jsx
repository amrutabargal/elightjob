import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

export default function Jobs() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: '',
    skills: '',
    location: '',
    experience: '',
    remote: false,
    fullTime: false,
    partTime: false,
    freshers: false,
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v === true) params[k] = 'true';
        else if (v) params[k] = v;
      });
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs || []);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get('/ai/recommended')
        .then((res) => setRecommended(res.data.jobs || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleSave = async (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please login to save jobs');
      return;
    }
    try {
      await api.post(`/users/saved-jobs/${encodeURIComponent(jobId)}`);
      await refreshUser();
      toast.success('Job saved!');
    } catch {
      toast.error('Failed to save job');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Live Job Listings</h1>
      <p className="text-slate-600 mb-8">
        Jobs automatically fetched from Adzuna, JSearch & Remote APIs
      </p>

      <form onSubmit={handleFilter} className="card mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            className="input-field"
            placeholder="Job Title"
            value={filters.title}
            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Skills (e.g. React, Python)"
            value={filters.skills}
            onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Experience"
            value={filters.experience}
            onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {[
            ['remote', 'Remote Only'],
            ['fullTime', 'Full-time'],
            ['partTime', 'Part-time'],
            ['freshers', 'Freshers'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn-primary mt-4">
          Search Jobs
        </button>
      </form>

      {isAuthenticated && recommended.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">🤖 AI Recommended for You</h2>
          <div className="grid gap-4">
            {recommended.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                matchScore={job.matchScore}
                onSave={handleSave}
                isSaved={user?.savedJobs?.includes(job.id)}
              />
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-center text-slate-500 py-12">No jobs found. Try different filters.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{jobs.length} jobs found</p>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={isAuthenticated ? handleSave : null}
                isSaved={user?.savedJobs?.includes(job.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
