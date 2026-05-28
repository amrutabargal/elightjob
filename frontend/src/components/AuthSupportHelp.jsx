import Icon from './Icon';
import { CONTACT_LINKS } from '../config/contact';

/** Shown on login / OTP / forgot-password for placement help */
export default function AuthSupportHelp() {
  return (
    <div className="auth-support-help">
      <p className="auth-support-help-title">Need help?</p>
      <p className="auth-support-help-name">{CONTACT_LINKS.name}</p>
      <a href={CONTACT_LINKS.mailto} className="auth-support-help-link">
        <Icon name="mail" size={18} />
        {CONTACT_LINKS.email}
      </a>
      <a href={CONTACT_LINKS.phoneTel} className="auth-support-help-link">
        <Icon name="call" size={18} />
        {CONTACT_LINKS.phoneDisplay}
      </a>
    </div>
  );
}
