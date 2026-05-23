import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: '🔍', title: 'Live Job Search', desc: 'Jobs auto-fetched from Adzuna, JSearch & Remote APIs' },
    { icon: '✉️', title: 'Email Verification', desc: 'Secure registration with mandatory email verification' },
    { icon: '🤖', title: 'AI Resume Analyzer', desc: 'ATS score, skill detection & improvement tips' },
    { icon: '🎯', title: 'AI Skill Match', desc: 'See how your skills match each job posting' },
    { icon: '⭐', title: 'Recommended Jobs', desc: 'AI-powered job recommendations based on your profile' },
    { icon: '📊', title: 'Track Applications', desc: 'Applied, Under Review, Shortlisted, Interview & more' },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Elite Placement Hub
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Discover live vacancies, apply with AI-powered insights, and track your career journey — no admin panel needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/jobs" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition">
              Browse Live Jobs
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition">
                Get Started Free
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition">
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card text-center">
              <span className="text-4xl">{f.icon}</span>
              <h3 className="font-semibold text-lg mt-4 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to find your dream job?</h2>
          <p className="text-slate-600 mb-6">
            Register, verify your email, upload your resume, and start applying to live positions today.
          </p>
          <Link to="/jobs" className="btn-primary inline-block">
            Explore Jobs Now
          </Link>
        </div>
      </section>
    </div>
  );
}
