import Icon from './Icon';
import JobCard from './JobCard';
import { INDIAN_CITIES } from '../data/indianCities';

function JobSkeleton() {
  return (
    <div className="job-skeleton">
      <div className="flex gap-4">
        <div className="job-skeleton-avatar" />
        <div className="flex-1 space-y-3">
          <div className="job-skeleton-line w-3/4" />
          <div className="job-skeleton-line w-1/2" />
          <div className="flex gap-2">
            <div className="job-skeleton-pill w-20" />
            <div className="job-skeleton-pill w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsListSection({
  filters,
  setFilters,
  jobCategories,
  jobs,
  jobsLoading,
  jobsMeta,
  apiStatus,
  recommended,
  isAuthenticated,
  user,
  formatJobTime,
  fetchJobs,
  onViewJob,
  onSaveJob,
}) {
  const cityCount =
    jobs.length > 0
      ? new Set(jobs.map((j) => j.city || j.location?.split(',')[0]?.trim()).filter(Boolean)).size
      : 0;

  return (
    <section id="jobs" className="scroll-mt-16 jobs-section">
      {/* Header band */}
      <div className="jobs-section-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-amber-300 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                Live from APIs
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon name="work" size={28} className="text-amber-300" />
                </span>
                Job Listings
              </h2>
              <p className="text-teal-100 mt-3 text-sm md:text-base max-w-2xl">
                {filters.location === 'all'
                  ? 'All India — 36 cities · Data Entry, Back Office, IT, BPO & more'
                  : `Showing openings in ${filters.location}`}
                {filters.category !== 'all' && (
                  <span className="text-amber-200 font-semibold">
                    {' '}
                    · {jobCategories.find((c) => c.id === filters.category)?.label}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="jobs-header-stat">
                <p className="text-2xl font-extrabold text-white">
                  {jobsLoading ? '…' : jobs.length}
                </p>
                <p className="text-teal-200 text-xs font-semibold uppercase">Jobs Found</p>
              </div>
              {filters.location === 'all' && cityCount > 0 && (
                <div className="jobs-header-stat">
                  <p className="text-2xl font-extrabold text-white">{cityCount}</p>
                  <p className="text-teal-200 text-xs font-semibold uppercase">Cities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* Live status bar */}
        <div className="jobs-live-bar">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <span className="jobs-live-dot" />
            <span className="font-bold text-emerald-800">
              {jobsMeta.live ? 'Live jobs from APIs' : 'Connecting…'}
            </span>
            <span className="text-emerald-700 text-sm">
              {jobsMeta.lastUpdated
                ? `Updated ${formatJobTime(jobsMeta.lastUpdated)}`
                : 'Fetching latest…'}
              {jobsMeta.fromCache && ' · cached 10 min'}
            </span>
          </div>
          {jobsMeta.sources && (
            <div className="hidden md:flex flex-wrap gap-2 text-xs">
              {Object.entries(jobsMeta.sources)
                .filter(([, n]) => n > 0)
                .slice(0, 5)
                .map(([k, n]) => (
                  <span key={k} className="jobs-source-chip">
                    {k} {n}
                  </span>
                ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fetchJobs(true)}
            disabled={jobsLoading}
            className="jobs-refresh-btn"
          >
            <Icon name="refresh" size={18} className={jobsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {apiStatus?.setupHint && (
          <div className="jobs-hint-bar">
            <Icon name="info" size={20} className="shrink-0 text-amber-600" />
            <p>{apiStatus.setupHint}</p>
          </div>
        )}

        {/* Search panel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs();
          }}
          className="jobs-search-panel"
        >
          <div className="jobs-search-panel-head">
            <Icon name="tune" size={22} className="text-brand-orange" />
            <h3 className="font-bold text-slate-900">Find Your Perfect Job</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="jobs-field-label">
              <span>Job Field</span>
              <select
                className="input-field jobs-input"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                {jobCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="jobs-field-label">
              <span>Job Title</span>
              <input
                className="input-field jobs-input"
                placeholder="e.g. Data Entry"
                value={filters.title}
                onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              />
            </label>
            <label className="jobs-field-label">
              <span>Skills</span>
              <input
                className="input-field jobs-input"
                placeholder="Excel, English…"
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
              />
            </label>
            <label className="jobs-field-label">
              <span>City</span>
              <select
                className="input-field jobs-input"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              >
                <option value="all">All India (36)</option>
                {INDIAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="jobs-field-label">
              <span>Experience</span>
              <input
                className="input-field jobs-input"
                placeholder="Fresher, 2 years…"
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              />
            </label>
          </div>

          <div className="jobs-filter-chips">
            {[
              ['remote', 'Remote', 'home_work'],
              ['fullTime', 'Full-time', 'schedule'],
              ['partTime', 'Part-time', 'timelapse'],
              ['freshers', 'Freshers', 'school'],
            ].map(([key, label, icon]) => (
              <label
                key={key}
                className={`jobs-chip ${filters[key] ? 'jobs-chip-active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.checked })}
                  className="sr-only"
                />
                <Icon name={icon} size={18} />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto px-10 py-3.5 text-base">
            <Icon name="search" size={22} />
            Search {jobs.length > 0 ? `${jobs.length} Jobs` : 'Jobs'}
          </button>
        </form>

        {/* AI Recommended */}
        {isAuthenticated && recommended.length > 0 && (
          <div className="mb-10">
            <div className="jobs-subsection-head">
              <Icon name="auto_awesome" size={26} className="text-violet-600" filled />
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">AI Recommended For You</h3>
                <p className="text-slate-500 text-sm">Matched to your profile & skills</p>
              </div>
            </div>
            <div className="grid lg:grid-cols-1 gap-4">
              {recommended.slice(0, 3).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  matchScore={job.matchScore}
                  onView={onViewJob}
                  onSave={onSaveJob}
                  isSaved={user?.savedJobs?.includes(job.id)}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="jobs-results-head">
          <h3 className="text-lg font-extrabold text-slate-900">
            {jobsLoading ? 'Loading jobs…' : `${jobs.length} Open Positions`}
          </h3>
          {!jobsLoading && jobs.length > 0 && (
            <p className="text-sm text-slate-500">Click any job to view details & apply</p>
          )}
        </div>

        {jobsLoading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <JobSkeleton key={n} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs-empty-state">
            <Icon name="search_off" size={64} className="text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800 mt-4">No jobs found</h3>
            <p className="text-slate-500 mt-2 max-w-md text-center">
              Try changing city or field, or click Refresh to load live jobs from APIs.
            </p>
            <button type="button" onClick={() => fetchJobs(true)} className="btn-primary mt-6">
              <Icon name="refresh" size={20} />
              Refresh Live Jobs
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onView={onViewJob}
                onSave={isAuthenticated ? onSaveJob : null}
                isSaved={user?.savedJobs?.includes(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
