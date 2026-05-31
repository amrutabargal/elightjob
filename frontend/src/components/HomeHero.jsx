import CategoryCards, { CATEGORY_CARDS } from './CategoryCards';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=85';

export default function HomeHero({ onBrowseJobs }) {
  return (
    <section id="home" className="hero-stack scroll-mt-16">
      <div className="hero-stack-inner">
        {/* Hero banner — background image */}
        <div className="tc-hero-banner">
          <img
            src={HERO_IMAGE}
            alt="Tele-calling professional with headset in office"
            className="tc-hero-bg-img"
          />
          <div className="tc-hero-overlay" />

          <div className="tc-hero-content">
            <p className="tc-hero-gold">Join Our Winning Team!</p>
            <h1 className="tc-hero-title">Tele-calling Jobs Available!</h1>
            <p className="tc-hero-sub">
              Earn Great Commissions Selling Financial Products.
            </p>
            <button type="button" onClick={onBrowseJobs} className="tc-apply-btn">
              Apply Now!
            </button>
          </div>
        </div>

        {/* Cards float on hero image (reference layout) */}
        <div id="opportunities" className="hero-cards-float scroll-mt-24">
          <div className="hero-cards-inner">
            <CategoryCards />
          </div>
        </div>
      </div>

      {/* White space below — lower half of cards sits here */}
      <div className="hero-stack-spacer" aria-hidden="true" />
    </section>
  );
}

export { CATEGORY_CARDS };
