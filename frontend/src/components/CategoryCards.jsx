import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import Icon from './Icon';
import { SavingsArt, CreditArt, DematArt } from './CategoryCardArt';

const CARDS = [
  {
    id: 'savings',
    tone: 'blue',
    Art: SavingsArt,
    title: 'Savings Accounts',
    tagline: 'Help Clients Start Saving Today!',
    jobTitle: 'telecaller savings bank',
    keywords: ['savings', 'bank account', 'passbook', 'deposit', 'account opening'],
    responsibilities: [
      'Help clients start saving today',
      'Passbook & savings account sales',
      'Linked demat account referrals',
    ],
    rewards: [
      'Highest commission per account',
      'Monthly performance incentives',
      'Career growth for top agents',
    ],
  },
  {
    id: 'credit',
    tone: 'orange',
    Art: CreditArt,
    title: 'Credit Cards',
    tagline: 'Unlock Rewards & Convenience!',
    jobTitle: 'telecaller credit card',
    keywords: ['credit card', 'credit cards', 'rewards', 'visa', 'mastercard'],
    responsibilities: [
      'Unlock rewards & financial benefits',
      'Credit card sales & management',
      'Customer relationship specialist',
    ],
    rewards: [
      'Attractive paid payouts',
      'Bonus on financial products',
      'Rewards & convenience perks',
    ],
  },
  {
    id: 'demat',
    tone: 'green',
    Art: DematArt,
    title: 'Demat Accounts',
    tagline: 'Enable Stock Trading & Investing!',
    jobTitle: 'telecaller demat trading',
    keywords: ['demat', 'trading', 'stock', 'investment', 'broker', 'equity'],
    responsibilities: [
      'Enable stock trading & investing',
      'Stock market & board investing',
      'Demat account opening support',
    ],
    rewards: [
      'Preferential sales management',
      'Promote investment products',
      'Enable wealth & trading growth',
    ],
  },
];

function matchCategoryJob(job, keywords) {
  const text = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

function formatPosted(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function CompactJobRow({ job }) {
  const location = job.city || job.location?.split(',')[0] || 'India';
  const posted = formatPosted(job.postedAt);

  return (
    <article className="cat-job-row">
      <div className="cat-job-row-main">
        <h4 className="cat-job-row-title">{job.title}</h4>
        <p className="cat-job-row-meta">
          <Icon name="apartment" size={15} />
          {job.company}
          <span className="cat-job-row-dot">·</span>
          <Icon name="location_on" size={15} />
          {location}
          {posted && (
            <>
              <span className="cat-job-row-dot">·</span>
              {posted}
            </>
          )}
        </p>
      </div>
      {job.applyUrl ? (
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cat-job-row-apply"
        >
          Apply
          <Icon name="open_in_new" size={16} />
        </a>
      ) : null}
    </article>
  );
}

export default function CategoryCards({ onSelect }) {
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [fetchError, setFetchError] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get('/jobs', {
        params: { title: 'telecaller', location: 'india' },
      });
      setAllJobs(data.jobs || []);
      setLive(data.live !== false);
    } catch {
      setFetchError('Could not load live jobs. Try again shortly.');
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const jobsByCategory = useMemo(() => {
    const map = {};
    for (const card of CARDS) {
      const matched = allJobs.filter((job) => matchCategoryJob(job, card.keywords));
      map[card.id] = matched.length ? matched.slice(0, 8) : allJobs.slice(0, 5);
    }
    return map;
  }, [allJobs]);

  const countsByCategory = useMemo(() => {
    const map = {};
    for (const card of CARDS) {
      map[card.id] = allJobs.filter((job) => matchCategoryJob(job, card.keywords)).length;
    }
    return map;
  }, [allJobs]);

  const handleViewVacancies = (cardId) => {
    setExpandedId((prev) => (prev === cardId ? null : cardId));
    onSelect?.(cardId);
  };

  const expandedCard = CARDS.find((c) => c.id === expandedId);
  const expandedJobs = expandedId ? jobsByCategory[expandedId] || [] : [];

  return (
    <div className="ep-cards-wrap">
      <div className="ep-cards-live-bar">
        {loading ? (
          <span className="ep-cards-live-pill ep-cards-live-pill--loading">
            <span className="ep-live-dot" />
            Loading live jobs…
          </span>
        ) : fetchError ? (
          <button type="button" onClick={loadJobs} className="ep-cards-live-pill ep-cards-live-pill--error">
            <Icon name="refresh" size={16} />
            {fetchError} Retry
          </button>
        ) : (
          <span className="ep-cards-live-pill">
            <span className={`ep-live-dot ${live ? 'ep-live-dot--on' : ''}`} />
            {allJobs.length} live telecalling roles · updated now
          </span>
        )}
      </div>

      <div className="ep-cards-row">
        {CARDS.map((card) => {
          const Art = card.Art;
          const count = countsByCategory[card.id] || 0;
          const isOpen = expandedId === card.id;

          return (
            <article
              key={card.id}
              className={`ep-card ep-card--${card.tone} ${isOpen ? 'ep-card--active' : ''}`}
            >
              <div className="ep-card-icon">
                <Art />
              </div>

              <h3 className="ep-card-title">{card.title}</h3>
              <p className="ep-card-tagline">{card.tagline}</p>

              {!loading && count > 0 && (
                <p className="ep-card-live-count">
                  <Icon name="work" size={16} />
                  {count} open {count === 1 ? 'role' : 'roles'} live
                </p>
              )}

              <div className="ep-card-cols">
                <div className="ep-card-col">
                  <p className="ep-card-col-title">Responsibilities</p>
                  <ul>
                    {card.responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="ep-card-col">
                  <p className="ep-card-col-title">Rewards</p>
                  <ul>
                    {card.rewards.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewVacancies(card.id)}
                className={`ep-card-btn ep-card-btn--${card.tone}`}
              >
                {isOpen ? 'Hide Vacancies' : 'View Vacancies'}
                <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={20} />
              </button>
            </article>
          );
        })}
      </div>

      {expandedCard && (
        <div className="cat-jobs-panel">
          <div className="cat-jobs-panel-head">
            <div>
              <p className="cat-jobs-panel-kicker">Live openings</p>
              <h3 className="cat-jobs-panel-title">{expandedCard.title} — Real-time Jobs</h3>
            </div>
            <button type="button" onClick={loadJobs} className="cat-jobs-refresh" disabled={loading}>
              <Icon name="refresh" size={18} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="cat-jobs-loading">
              <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
            </div>
          ) : expandedJobs.length === 0 ? (
            <p className="cat-jobs-empty">No matching roles right now. Check back soon or contact us to apply.</p>
          ) : (
            <div className="cat-jobs-list">
              {expandedJobs.map((job) => (
                <CompactJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { CARDS as CATEGORY_CARDS };
