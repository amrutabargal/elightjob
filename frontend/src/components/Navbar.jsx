import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { scrollToSection } from '../utils/scroll';
import { getUploadUrl, getUserInitials } from '../utils/uploads';
import Logo from './Logo';
import Icon from './Icon';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'opportunities', label: 'Job Opportunities', chevron: true },
  { id: 'how', label: 'How it Works' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar({ onOpenAuth, onOpenProfile }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');
  const profileRef = useRef(null);

  const nav = (id) => {
    setMenuOpen(false);
    setProfileOpen(false);
    setActiveId(id);
    scrollToSection(id);
  };

  const closeAnd = (fn) => () => {
    setMenuOpen(false);
    fn();
  };

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  const photoUrl = getUploadUrl(user?.profilePhotoPath);
  const initials = getUserInitials(user?.name);

  const openProfile = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    onOpenProfile?.();
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between min-h-[58px] h-auto py-2 sm:py-0 sm:h-[58px] items-center gap-2 sm:gap-4">
          <button type="button" onClick={() => nav('home')} className="shrink-0 hover:opacity-90 max-w-[55%] sm:max-w-none">
            <Logo size="sm" />
          </button>

          <div className="hidden lg:flex flex-1 justify-center items-center gap-1 xl:gap-2 min-w-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => nav(item.id)}
                className={`tc-nav-link ${activeId === item.id ? 'tc-nav-link-active' : ''}`}
              >
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">
                  {item.id === 'opportunities' ? 'Jobs' : item.id === 'testimonials' ? 'Stats' : item.label.split(' ')[0]}
                </span>
                {item.chevron && <Icon name="expand_more" size={18} className="opacity-70 -ml-0.5" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <button type="button" onClick={() => nav('dashboard')} className="tc-nav-link hidden md:inline-flex text-sm">
                  Dashboard
                </button>

                <div className="nav-profile-wrap" ref={profileRef}>
                  <button
                    type="button"
                    className="nav-profile-btn"
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-expanded={profileOpen}
                    aria-label="Open profile menu"
                  >
                    <span className="nav-profile-avatar">
                      {photoUrl ? (
                        <img src={photoUrl} alt={user?.name || 'Profile'} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </span>
                    <Icon name="expand_more" size={18} className="nav-profile-chevron hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div className="nav-profile-dropdown">
                      <div className="nav-profile-dropdown-head">
                        <p className="nav-profile-dropdown-name">{user?.name}</p>
                        <p className="nav-profile-dropdown-email">{user?.email}</p>
                        {user?.userId && <p className="nav-profile-dropdown-id">{user.userId}</p>}
                      </div>
                      <button type="button" onClick={openProfile} className="nav-profile-dropdown-item">
                        <Icon name="person" size={20} />
                        Edit Profile
                      </button>
                      <button type="button" onClick={() => nav('dashboard')} className="nav-profile-dropdown-item">
                        <Icon name="dashboard" size={20} />
                        Dashboard
                      </button>
                      <button type="button" onClick={closeAnd(logout)} className="nav-profile-dropdown-item nav-profile-dropdown-item--danger">
                        <Icon name="logout" size={20} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button type="button" onClick={() => onOpenAuth('login')} className="tc-nav-link hidden sm:inline-flex text-sm">
                Login
              </button>
            )}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 flex flex-col gap-0.5 pb-4 max-h-[min(70vh,480px)] overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={`m-${item.id}`}
                type="button"
                onClick={() => nav(item.id)}
                className={`tc-nav-link justify-start w-full ${activeId === item.id ? 'tc-nav-link-active' : ''}`}
              >
                {item.label}
                {item.chevron && <Icon name="expand_more" size={18} />}
              </button>
            ))}

            <div className="nav-mobile-auth">
              {isAuthenticated ? (
                <>
                  <button type="button" onClick={openProfile} className="btn-secondary">
                    <span className="nav-mobile-avatar">
                      {photoUrl ? <img src={photoUrl} alt="" /> : initials}
                    </span>
                    My Profile
                  </button>
                  <button type="button" onClick={() => nav('dashboard')} className="btn-primary">
                    <Icon name="dashboard" size={20} />
                    Dashboard
                  </button>
                  <button type="button" onClick={closeAnd(logout)} className="btn-secondary">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={closeAnd(() => onOpenAuth('login'))} className="btn-primary">
                    <Icon name="login" size={20} />
                    Login
                  </button>
                  <button type="button" onClick={closeAnd(() => onOpenAuth('register'))} className="btn-secondary">
                    <Icon name="person_add" size={20} />
                    Register Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
