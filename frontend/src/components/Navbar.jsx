import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { scrollToSection } from '../utils/scroll';
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

export default function Navbar({ onOpenAuth }) {
  const { logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');

  const nav = (id) => {
    setMenuOpen(false);
    setActiveId(id);
    scrollToSection(id);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[58px] items-center gap-4">
          <button type="button" onClick={() => nav('home')} className="shrink-0 hover:opacity-90">
            <Logo size="sm" />
          </button>

          <div className="hidden lg:flex flex-1 justify-center items-center gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => nav(item.id)}
                className={`tc-nav-link ${activeId === item.id ? 'tc-nav-link-active' : ''}`}
              >
                {item.label}
                {item.chevron && <Icon name="expand_more" size={18} className="opacity-70 -ml-0.5" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <button type="button" onClick={() => nav('dashboard')} className="tc-nav-link hidden md:inline-flex text-sm">
                  Dashboard
                </button>
                <button type="button" onClick={logout} className="tc-nav-link hidden sm:inline-flex text-sm">
                  Logout
                </button>
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
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 flex flex-col gap-0.5 pb-4">
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
          </div>
        )}
      </div>
    </nav>
  );
}
