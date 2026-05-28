import Logo from './Logo';
import Icon from './Icon';
import { scrollToSection } from '../utils/scroll';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';
import { CONTACT_LINKS } from '../config/contact';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Logo size="sm" light />
            <p className="text-sm mt-3 max-w-xs text-slate-500">
              {BRAND_TAGLINE}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <button type="button" onClick={() => scrollToSection('home')} className="hover:text-orange-400 transition-colors">
              Home
            </button>
            <button type="button" onClick={() => scrollToSection('contact')} className="hover:text-orange-400 transition-colors">
              Contact
            </button>
            <button type="button" onClick={() => scrollToSection('how')} className="hover:text-orange-400 transition-colors">
              How it Works
            </button>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300 font-semibold">{CONTACT_LINKS.name}</span>
            <a href={CONTACT_LINKS.mailto} className="footer-contact-link inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Icon name="mail" size={16} className="text-orange-400 shrink-0" />
              {CONTACT_LINKS.email}
            </a>
            <a href={CONTACT_LINKS.phoneTel} className="footer-contact-link inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Icon name="call" size={16} className="text-orange-400" />
              {CONTACT_LINKS.phoneDisplay}
            </a>
          </div>
        </div>
        <p className="text-center text-xs mt-10 text-slate-600 border-t border-slate-800 pt-8">
          © {new Date().getFullYear()} {BRAND_NAME}. Premium placement portal across India.
        </p>
      </div>
    </footer>
  );
}
