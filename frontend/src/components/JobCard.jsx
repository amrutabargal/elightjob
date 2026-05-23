import Icon from './Icon';

const SOURCE_LABELS = {
  remotive: 'Remotive',
  remoteok: 'RemoteOK',
  jobicy: 'Jobicy',
  arbeitnow: 'Arbeitnow',
  jooble: 'Jooble',
  careerjet: 'Careerjet',
  adzuna: 'Adzuna',
  'google-jobs': 'Google Jobs',
  jsearch: 'JSearch',
};

function formatPosted(date) {
  if (!date) return null;
  try {
    const d = new Date(date);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

export default function JobCard({ job, matchScore, onSave, isSaved, onView, featured = false }) {
  const posted = formatPosted(job.postedAt);
  const location = job.city || job.location?.split(',')[0] || 'India';
  const sourceLabel = SOURCE_LABELS[job.source] || job.source;

  return (
    <article className={`job-card-premium ${featured ? 'job-card-featured' : ''}`}>
      <div className="job-card-accent" />

      <div className="job-card-body">
        <div className="flex gap-4">
          {job.logo ? (
            <img
              src={job.logo}
              alt=""
              className="job-card-logo"
            />
          ) : (
            <div className="job-card-logo-placeholder">
              <Icon name="business" size={30} className="text-brand-orange" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <button
                type="button"
                onClick={() => onView?.(job.id)}
                className="text-left group/title flex-1 min-w-0"
              >
                <h3 className="job-card-title">{job.title}</h3>
              </button>
              {posted && (
                <span className="job-card-time shrink-0">
                  <Icon name="schedule" size={14} />
                  {posted}
                </span>
              )}
            </div>

            <p className="job-card-company">
              <Icon name="apartment" size={17} />
              <span className="truncate">{job.company}</span>
            </p>

            <div className="job-card-tags">
              <span className="job-tag job-tag-location">
                <Icon name="location_on" size={14} />
                {location}
              </span>
              {job.category && job.category !== 'General' && (
                <span className="job-tag job-tag-category">
                  <Icon name="category" size={14} />
                  {job.category}
                </span>
              )}
              {job.remote && (
                <span className="job-tag job-tag-remote">
                  <Icon name="home_work" size={14} />
                  Remote
                </span>
              )}
              {job.salary && job.salary !== 'Not disclosed' && (
                <span className="job-tag job-tag-salary">
                  <Icon name="payments" size={14} />
                  <span className="truncate max-w-[140px]">{job.salary}</span>
                </span>
              )}
              {sourceLabel && job.source !== 'demo' && (
                <span className="job-tag job-tag-source">{sourceLabel}</span>
              )}
            </div>

            {matchScore != null && (
              <div className="mt-3">
                <div className="job-match-bar">
                  <div className="job-match-fill" style={{ width: `${Math.min(matchScore, 100)}%` }} />
                </div>
                <p className="job-match-label">
                  <Icon name="auto_awesome" size={16} filled />
                  AI Match {matchScore}%
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="job-card-actions">
          <button type="button" onClick={() => onView?.(job.id)} className="job-btn-primary">
            <Icon name="visibility" size={18} />
            View & Apply
          </button>
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(job.id)}
              className={`job-btn-secondary ${isSaved ? 'job-btn-saved' : ''}`}
            >
              <Icon name={isSaved ? 'bookmark' : 'bookmark_add'} size={18} filled={isSaved} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="job-btn-ghost"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="open_in_new" size={18} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
