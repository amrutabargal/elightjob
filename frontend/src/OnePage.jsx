import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from './api/axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeHero from './components/HomeHero';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { ProfileFieldsForm, formatDobForInput } from './components/RegisterForm';
import HowItWorks from './components/HowItWorks';
import { scrollToSection } from './utils/scroll';
import Icon from './components/Icon';
import { CONTACT_LINKS } from './config/contact';

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-purple-100 text-purple-800',
  Interview: 'bg-indigo-100 text-indigo-800',
  Selected: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

export default function OnePage() {
  const { user, isAuthenticated, refreshUser, loading: authLoading } = useAuth();

  const [authMode, setAuthMode] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [verifyToken, setVerifyToken] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    mobile: '',
    email: '',
    address: '',
    skills: '',
    experience: '',
    location: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [appFilter, setAppFilter] = useState('all');
  const [appsLoading, setAppsLoading] = useState(false);

  const openAuth = (mode, email = '') => {
    setAuthEmail(email);
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
    setVerifyToken(null);
    setResetToken(null);
  };

  const switchAuth = (mode, email = '') => {
    setAuthEmail(email || authEmail);
    setAuthMode(mode);
  };

  const loadApplications = useCallback(() => {
    if (!isAuthenticated) return;
    setAppsLoading(true);
    api
      .get('/applications')
      .then((res) => setApplications(res.data.applications || []))
      .finally(() => setAppsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const legacyToken = params.get('token');
    const verify = params.get('verify');
    const reset = params.get('reset');

    if (verify || (path.includes('verify-email') && legacyToken)) {
      setVerifyToken(verify || legacyToken);
      setAuthMode('verify');
    } else if (reset || (path.includes('reset-password') && legacyToken)) {
      setResetToken(reset || legacyToken);
      setAuthMode('reset');
    }

    if (verify || reset || legacyToken) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated, loadApplications]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        dateOfBirth: formatDobForInput(user.dateOfBirth),
        gender: user.gender || '',
        mobile: user.mobile || '',
        email: user.email || '',
        address: user.address || '',
        skills: (user.skills || []).join(', '),
        experience: user.experience || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = profile.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put('/users/profile', { ...profile, skills });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) {
      toast.error('Select a resume file');
      return;
    }
    const formData = new FormData();
    formData.append('resume', resumeFile);
    setAnalyzing(true);
    try {
      const { data } = await api.post('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(data.analysis);
      await refreshUser();
      toast.success('Resume uploaded & analyzed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalyzer = async () => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      const { data } = await api.post('/ai/resume-analyzer', formData, {
        headers: resumeFile ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      setAnalysis(data.analysis);
      toast.success('Resume analyzed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const scrollContact = () => scrollToSection('contact');
  const handleApplyCategory = () => scrollContact(); /* VIEW VACANCIES → contact */

  const filteredApps =
    appFilter === 'all' ? applications : applications.filter((a) => a.status === appFilter);
  const appCounts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenAuth={openAuth} onOpenProfile={() => setProfileOpen(true)} />

      <HomeHero onBrowseJobs={scrollContact} onApplyCategory={handleApplyCategory} />

      {/* Stats strip */}
      <section id="testimonials" className="stats-section scroll-mt-16">
        <div className="stats-section-inner">
          {[
            { icon: 'trending_up', label: 'Open Roles', value: '300+' },
            { icon: 'groups', label: 'Cities', value: '36+' },
            { icon: 'star', label: 'AI Match', value: '4.8/5' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon-wrap">
                <Icon name={s.icon} size={28} className="text-brand-orange" />
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About + CTA row */}
      <section id="about" className="page-section scroll-mt-16 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-orange-100 text-brand-orange rounded-full px-4 py-2 text-sm font-bold mb-5">
              <Icon name="star" size={18} filled />
              300+ Openings Available Now!
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
              Start Your{' '}
              <span className="text-brand-orange">High-Earning Career</span> in Telecalling & More
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Join India&apos;s fastest-growing job network. Mumbai to Kochi — data entry, back office, IT & BPO roles with
              AI matching and one-click apply.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={scrollContact} className="btn-primary">
                Contact Us
                <Icon name="arrow_forward" size={20} />
              </button>
              {!isAuthenticated && (
                <button type="button" onClick={() => openAuth('login')} className="btn-secondary">
                  Employee Login
                </button>
              )}
            </div>
          </div>
          <div className="cta-gradient-card lg:text-left lg:px-10">
            <h3 className="text-xl font-extrabold mb-3">Your Success Story Starts Here</h3>
            <p className="text-orange-50 text-sm leading-relaxed mb-6 opacity-95">
              Hundreds of successful candidates earn ₹40K–80K monthly while building careers across financial sales,
              support & office roles.
            </p>
            <button
              type="button"
              onClick={scrollContact}
              className="bg-white text-brand-orange font-bold px-6 py-3 rounded-xl hover:bg-orange-50 w-full sm:w-auto"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Contact */}
      <section id="contact" className="contact-section scroll-mt-16">
        <div className="contact-section-inner">
          <span className="contact-kicker">Get Placed</span>
          <h2 className="contact-title">Contact Elite Placement Hub</h2>
          <p className="contact-desc">
            Register free, verify email with OTP from Elite Placement Hub, and our team will connect you with IT, Back Office,
            BPO, and telecalling opportunities across India.
          </p>

          <div className="contact-help-card">
            <p className="contact-help-title">Need help?</p>
            <p className="contact-help-name">{CONTACT_LINKS.name}</p>
            <div className="contact-help-links">
              <a href={CONTACT_LINKS.mailto} className="contact-help-link">
                <Icon name="mail" size={20} />
                {CONTACT_LINKS.email}
              </a>
              <a href={CONTACT_LINKS.phoneTel} className="contact-help-link">
                <Icon name="call" size={20} />
                {CONTACT_LINKS.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="contact-actions">
            {!isAuthenticated ? (
              <>
                <button type="button" onClick={() => openAuth('register')} className="btn-apply-now">
                  <Icon name="person_add" size={22} />
                  Register Free
                </button>
                <button type="button" onClick={() => openAuth('login')} className="btn-secondary">
                  <Icon name="login" size={20} />
                  Employee Login
                </button>
              </>
            ) : (
              <button type="button" onClick={() => scrollToSection('dashboard')} className="btn-apply-now">
                <Icon name="dashboard" size={22} />
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      {isAuthenticated && (
        <section id="dashboard" className="page-section scroll-mt-16 py-12 sm:py-16 px-4">
          <div className="max-w-7xl mx-auto w-full">
            <h2 className="section-title section-title-row mb-8 flex items-center gap-2">
              <Icon name="dashboard" size={32} className="text-primary-600" />
              My Dashboard
            </h2>

            {!user?.isVerified && (
              <div className="verify-banner bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Icon name="warning" size={24} className="text-amber-600 shrink-0" />
                  <p className="text-amber-800 font-medium">Email not verified</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAuth('verify', user?.email)}
                  className="text-sm text-amber-700 font-semibold underline"
                >
                  Verify now to apply for jobs
                </button>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="card lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">My Profile</h3>
                <ProfileFieldsForm
                  profile={profile}
                  setProfile={setProfile}
                  onSubmit={saveProfile}
                  saving={saving}
                  extraFields={
                    <>
                      <label className="register-field register-field-full">
                        <span>Skills (comma separated)</span>
                        <input
                          className="input-field"
                          value={profile.skills}
                          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                        />
                      </label>
                      <label className="register-field">
                        <span>Experience</span>
                        <input
                          className="input-field"
                          value={profile.experience}
                          onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                        />
                      </label>
                      <label className="register-field">
                        <span>Location</span>
                        <input
                          className="input-field"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        />
                      </label>
                    </>
                  }
                />
              </div>

              <div className="card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="description" size={24} className="text-primary-600" />
                  AI Resume Analyzer
                </h3>
                {user?.resumeOriginalName && <p className="text-sm text-slate-600 mb-2">Current: {user.resumeOriginalName}</p>}
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} className="input-field mb-3" />
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={uploadResume} disabled={analyzing} className="btn-primary text-sm">Upload & Analyze</button>
                  <button type="button" onClick={runAnalyzer} disabled={analyzing} className="btn-secondary text-sm">Analyze</button>
                </div>
                {analysis && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm">
                    <p className="text-2xl font-bold text-primary-600">{analysis.atsScore}% ATS Score</p>
                    {analysis.suggestions?.map((s) => (
                      <p key={s} className="text-slate-600 mt-1">• {s}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* APPLIED */}
      {isAuthenticated && (
        <section id="applied" className="page-section scroll-mt-16 bg-slate-50 py-12 sm:py-16 px-4">
          <div className="max-w-5xl mx-auto w-full">
            <h2 className="section-title section-title-row mb-2 flex items-center gap-2">
              <Icon name="assignment" size={32} className="text-primary-600" />
              Applied Jobs
            </h2>
            <p className="text-slate-600 mb-8 flex items-center gap-2">
              <Icon name="timeline" size={20} className="text-slate-400" />
              Track your application status
            </p>

            <div className="app-status-scroll">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAppFilter(status)}
                  className={`app-status-chip card py-3 text-center ${appFilter === status ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <p className="text-xl sm:text-2xl font-bold">{appCounts[status] || 0}</p>
                  <p className="text-xs text-slate-600 mt-1 whitespace-nowrap">{status}</p>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setAppFilter('all')} className={`text-sm mb-4 ${appFilter === 'all' ? 'text-primary-600 font-medium' : 'text-slate-500'}`}>
              Show all ({applications.length})
            </button>

            {appsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full" />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-slate-500">No applications yet.</p>
                <button type="button" onClick={scrollContact} className="btn-primary mt-4">
                  <Icon name="mail" size={18} />
                  Contact Us
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map((app) => (
                  <div key={app._id} className="card">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                        <p className="text-slate-600">{app.company}</p>
                        <p className="text-sm text-slate-500 mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`h-fit text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                      {app.skillMatchScore != null && <span className="text-primary-600">Match: {app.skillMatchScore}%</span>}
                      {app.atsScore != null && <span className="text-green-600">ATS: {app.atsScore}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA — orange gradient card */}
      <section className="page-section py-12 sm:py-16 px-4 max-w-4xl mx-auto w-full">
        <div className="cta-gradient-card">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Your Success Story Starts Here</h2>
          <p className="text-orange-50 mb-8 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Register free, get a welcome email, and use AI-powered resume analysis with full application tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={scrollContact}
              className="bg-white text-brand-orange font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 shadow-lg transition-all"
            >
              Contact Us
            </button>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="border-2 border-white text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all"
              >
                Learn More / Register
              </button>
            )}
          </div>
        </div>
      </section>

      <Footer />

      <AuthModal
        mode={authMode}
        onClose={closeAuth}
        onSwitch={switchAuth}
        verifyToken={verifyToken}
        resetToken={resetToken}
        defaultEmail={authEmail}
      />

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

    </div>
  );
}
