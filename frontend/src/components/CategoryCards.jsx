import { useState, useCallback, useRef } from 'react';
import api, { warmUpApi, getApiErrorMessage } from '../api/axios';
import Icon from './Icon';
import { SavingsArt, CreditArt, DematArt } from './CategoryCardArt';

const CARDS = [
  {
    id: 'savings',
    tone: 'blue',
    Art: SavingsArt,
    title: 'Savings Accounts',
    tagline: 'Help Clients Start Saving Today!',
    jobTitle: 'telecaller savings bank account',
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
    jobTitle: 'telecaller credit card sales',
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
    jobTitle: 'telecaller demat trading account',
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

const TELE_KEYWORDS = [
  'telecall',
  'telesales',
  'telecaller',
  'bpo',
  'call center',
  'voice process',
  'customer support',
  'sales executive',
  'financial product',
  'banking sales',
];

function isTelecallingJob(job) {
  const text = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
  return TELE_KEYWORDS.some((kw) => text.includes(kw));
}

function pickJobsForCategory(allJobs, card) {
  const byCategory = allJobs.filter((job) => matchCategoryJob(job, card.keywords));
  if (byCategory.length) return byCategory.slice(0, 10);

  const tele = allJobs.filter(isTelecallingJob);
  if (tele.length) return tele.slice(0, 10);

  return allJobs.slice(0, 8);
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

export default function CategoryCards() {
  const panelRef = useRef(null);

  const [expandedId, setExpandedId] = useState(null);
  const [categoryJobs, setCategoryJobs] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [live, setLive] = useState(false);

  const fetchJobsForCategory = useCallback(async (cardId) => {
    const card = CARDS.find((c) => c.id === cardId);
    if (!card) return;

    setLoadingId(cardId);
    setFetchError('');

    try {
      await warmUpApi();

      const { data } = await api.get('/jobs', {
        params: {
          location: 'india',
          refresh: 'true',
        },
      });

      const jobs = data.jobs || [];
      const displayJobs = pickJobsForCategory(jobs, card);

      setCategoryJobs((prev) => ({ ...prev, [cardId]: displayJobs }));
      setLive(data.live !== false);
    } catch (err) {
      setFetchError(getApiErrorMessage(err, 'Could not load jobs'));
      setCategoryJobs((prev) => ({ ...prev, [cardId]: [] }));
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handleViewVacancies = async (cardId) => {
    if (expandedId === cardId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(cardId);
    await fetchJobsForCategory(cardId);

    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const expandedCard = CARDS.find((c) => c.id === expandedId);
  const expandedJobs = expandedId ? categoryJobs[expandedId] || [] : [];
  const isLoading = loadingId === expandedId;

  return (
    <div className="ep-cards-wrap">
      <div className="ep-cards-row">
        {CARDS.map((card) => {
          const Art = card.Art;
          const isOpen = expandedId === card.id;
          const count = categoryJobs[card.id]?.length;
          const isFetching = loadingId === card.id;

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

              {count > 0 && !isFetching && (
                <p className="ep-card-live-count">
                  <Icon name="work" size={16} />
                  {count} {count === 1 ? 'role' : 'roles'} found
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
                disabled={isFetching}
                className={`ep-card-btn ep-card-btn--${card.tone}`}
              >
                {isFetching ? (
                  <>
                    <span className="cat-btn-spinner" aria-hidden />
                    Fetching jobs…
                  </>
                ) : isOpen ? (
                  <>
                    Hide Vacancies
                    <Icon name="expand_less" size={20} />
                  </>
                ) : (
                  <>
                    View Vacancies
                    <Icon name="expand_more" size={20} />
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>

      {expandedCard && (
        <div className="cat-jobs-panel" ref={panelRef} id="live-jobs-panel">
          <div className="cat-jobs-panel-head">
            <div>
              <p className="cat-jobs-panel-kicker">
                {isLoading ? 'Fetching from API…' : live ? 'Live from API' : 'Latest openings'}
              </p>
              <h3 className="cat-jobs-panel-title">{expandedCard.title} — Jobs</h3>
            </div>
            <button
              type="button"
              onClick={() => fetchJobsForCategory(expandedId)}
              className="cat-jobs-refresh"
              disabled={isLoading}
            >
              <Icon name="refresh" size={18} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="cat-jobs-loading">
              <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
              <p className="cat-jobs-loading-text">Loading real-time jobs from API…</p>
            </div>
          ) : fetchError ? (
            <div className="cat-jobs-error">
              <Icon name="error" size={22} />
              <p>{fetchError}</p>
              <button type="button" onClick={() => fetchJobsForCategory(expandedId)} className="btn-primary text-sm">
                Try Again
              </button>
            </div>
          ) : expandedJobs.length === 0 ? (
            <p className="cat-jobs-empty">No matching roles right now. Try Refresh or contact us to apply.</p>
          ) : (
            <>
              <p className="cat-jobs-count">{expandedJobs.length} jobs loaded</p>
              <div className="cat-jobs-list">
                {expandedJobs.map((job) => (
                  <CompactJobRow key={job.id} job={job} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { CARDS as CATEGORY_CARDS };
