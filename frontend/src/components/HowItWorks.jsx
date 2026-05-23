import Icon from './Icon';

const STEPS = [
  {
    icon: 'work',
    tone: 'blue',
    title: 'Career Categories',
    desc: 'IT, Back Office, BPO & telecalling opportunities across India.',
  },
  {
    icon: 'mark_email_read',
    tone: 'violet',
    title: 'Email Verification',
    desc: 'Secure OTP registration before you apply for any role.',
  },
  {
    icon: 'smart_toy',
    tone: 'indigo',
    title: 'AI Resume Analyzer',
    desc: 'Instant ATS score and skill detection from your resume.',
  },
  {
    icon: 'track_changes',
    tone: 'emerald',
    title: 'AI Skill Match',
    desc: 'See how your skills match each role you apply for.',
  },
  {
    icon: 'support_agent',
    tone: 'amber',
    title: 'Placement Support',
    desc: 'Our team connects you with the right opportunities.',
  },
  {
    icon: 'analytics',
    tone: 'rose',
    title: 'Track Applications',
    desc: 'Full application status from applied to selected.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how-section scroll-mt-16">
      <div className="how-section-inner">
        <header className="how-section-header">
          <span className="how-section-kicker">Simple Process</span>
          <h2 className="how-section-title">How It Works</h2>
          <p className="how-section-sub">
            Register once, verify your email, and manage your placement journey in one place.
          </p>
        </header>

        <div className="how-grid">
          {STEPS.map((step, index) => (
            <article key={step.title} className={`how-card how-card--${step.tone}`}>
              <span className="how-card-step">{String(index + 1).padStart(2, '0')}</span>
              <div className={`how-card-icon how-card-icon--${step.tone}`}>
                <Icon name={step.icon} size={30} />
              </div>
              <h3 className="how-card-title">{step.title}</h3>
              <p className="how-card-desc">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
