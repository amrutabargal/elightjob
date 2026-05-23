import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-purple-100 text-purple-800',
  Interview: 'bg-indigo-100 text-indigo-800',
  Selected: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

export default function AppliedJobs() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api
      .get('/applications')
      .then((res) => setApplications(res.data.applications || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Applied Jobs</h1>
      <p className="text-slate-600 mb-8">Track your application status</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`card py-3 text-center cursor-pointer transition ${
              filter === status ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <p className="text-2xl font-bold">{counts[status] || 0}</p>
            <p className="text-xs text-slate-600 mt-1">{status}</p>
          </button>
        ))}
      </div>

      <button
        onClick={() => setFilter('all')}
        className={`text-sm mb-4 ${filter === 'all' ? 'text-primary-600 font-medium' : 'text-slate-500'}`}
      >
        Show all ({applications.length})
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No applications found.</p>
          <Link to="/jobs" className="btn-primary inline-block mt-4">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app._id} className="card">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                  <p className="text-slate-600">{app.company}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    📍 {app.location} · Applied {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`h-fit text-xs font-medium px-3 py-1 rounded-full ${
                    STATUS_COLORS[app.status] || 'bg-slate-100'
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {app.skillMatchScore != null && (
                  <span className="text-primary-600">Skill Match: {app.skillMatchScore}%</span>
                )}
                {app.atsScore != null && (
                  <span className="text-green-600">ATS Score: {app.atsScore}%</span>
                )}
                {app.applyUrl && (
                  <a
                    href={app.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    View original posting
                  </a>
                )}
              </div>
              {app.coverLetter && (
                <p className="mt-3 text-sm text-slate-600 border-t pt-3">
                  <strong>Cover letter:</strong> {app.coverLetter}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
