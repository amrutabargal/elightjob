import { SavingsArt, CreditArt, DematArt } from './CategoryCardArt';

const CARDS = [
  {
    id: 'savings',
    tone: 'blue',
    Art: SavingsArt,
    title: 'Savings Accounts',
    tagline: 'Help Clients Start Saving Today!',
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

export default function CategoryCards({ onSelect }) {
  return (
    <div className="ep-cards-row">
      {CARDS.map((card) => {
        const Art = card.Art;
        return (
          <article key={card.id} className={`ep-card ep-card--${card.tone}`}>
            <div className="ep-card-icon">
              <Art />
            </div>

            <h3 className="ep-card-title">{card.title}</h3>
            <p className="ep-card-tagline">{card.tagline}</p>

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

            <button type="button" onClick={() => onSelect(card.id)} className={`ep-card-btn ep-card-btn--${card.tone}`}>
              View Vacancies
            </button>
          </article>
        );
      })}
    </div>
  );
}

export { CARDS as CATEGORY_CARDS };
