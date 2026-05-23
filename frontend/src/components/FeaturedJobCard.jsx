import Icon from './Icon';

export default function FeaturedJobCard({ job, onView }) {
  return (
    <article className="featured-job-card-premium group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
          <Icon name="work" size={26} className="text-brand-orange" />
        </div>
        {job.remote && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            Remote
          </span>
        )}
      </div>

      <button type="button" onClick={() => onView?.(job.id)} className="text-left w-full">
        <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-orange transition-colors line-clamp-2 min-h-[2.5rem]">
          {job.title}
        </h4>
      </button>

      <p className="text-sm text-slate-500 mt-1 font-medium">{job.company}</p>

      <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
        <Icon name="location_on" size={16} className="text-sky-600 shrink-0" />
        <span className="truncate">{job.city || job.location?.split(',')[0] || 'India'}</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          <Icon name="payments" size={14} />
          {job.salary !== 'Not disclosed' ? job.salary : 'Apply for salary'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
          <Icon name="schedule" size={14} />
          {job.type || 'Full Time'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onView?.(job.id)}
        className="mt-4 w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold group-hover:bg-brand-orange transition-colors flex items-center justify-center gap-2"
      >
        View Details
        <Icon name="arrow_forward" size={18} />
      </button>
    </article>
  );
}
