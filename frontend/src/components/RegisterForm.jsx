import { useState, useCallback } from 'react';
import Icon from './Icon';

const GENDERS = ['Male', 'Female', 'Other'];

/** DOM tab order — matches visual flow top to bottom */
const FIELD_ORDER = [
  'reg-name',
  'reg-dob',
  'reg-gender',
  'reg-mobile',
  'reg-email',
  'reg-address',
  'reg-password',
  'reg-confirm',
];

const emptyForm = () => ({
  name: '',
  dateOfBirth: '',
  gender: '',
  mobile: '',
  email: '',
  address: '',
  password: '',
  confirmPassword: '',
});

function maxDobFor18Plus() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function formatDobForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** 10-digit Indian mobile — strips +91, spaces, leading 0 */
export function normalizeIndianMobile(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export function getRegisterFieldErrors(form) {
  const f = form && typeof form === 'object' && !Array.isArray(form) ? form : emptyForm();
  const errors = {};

  const name = String(f.name ?? '').trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Enter your full name';

  if (!f.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
  else {
    const dob = new Date(f.dateOfBirth);
    if (Number.isNaN(dob.getTime())) errors.dateOfBirth = 'Invalid date';
    else {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
      if (age < 18) errors.dateOfBirth = 'You must be at least 18 years old';
    }
  }

  if (!f.gender) errors.gender = 'Please select gender';

  const phone = normalizeIndianMobile(f.mobile);
  if (!phone) errors.mobile = 'Mobile number is required';
  else if (phone.length < 10) errors.mobile = `${phone.length}/10 digits — enter full number`;
  else if (!/^[6-9]\d{9}$/.test(phone)) errors.mobile = 'Must start with 6, 7, 8 or 9 (10 digits)';

  const email = String(f.email ?? '').trim();
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';

  const address = String(f.address ?? '').trim();
  if (!address) errors.address = 'Address is required';
  else if (address.length < 10) errors.address = 'Address must be at least 10 characters';

  if (!f.password) errors.password = 'Password is required';
  else if (f.password.length < 6) errors.password = 'Password must be at least 6 characters';

  if (!f.confirmPassword) errors.confirmPassword = 'Confirm your password';
  else if (f.password !== f.confirmPassword) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

export function validateRegisterForm(form) {
  const errors = getRegisterFieldErrors(form);
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : null;
}

export function formToPayload(form) {
  return {
    name: String(form.name).trim(),
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    mobile: normalizeIndianMobile(form.mobile),
    email: String(form.email).trim().toLowerCase(),
    address: String(form.address).trim(),
    password: form.password,
  };
}

function focusNextField(currentId) {
  const idx = FIELD_ORDER.indexOf(currentId);
  if (idx < 0 || idx >= FIELD_ORDER.length - 1) return false;
  const next = document.getElementById(FIELD_ORDER[idx + 1]);
  if (!next) return false;
  next.focus({ preventScroll: true });
  next.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return true;
}

function scrollFieldIntoView(e) {
  const el = e.target;
  window.setTimeout(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 320);
}

function Field({
  id,
  label,
  hint,
  error,
  className = '',
  children,
}) {
  return (
    <div className={`register-field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error ? <span className="register-field-hint">{hint}</span> : null}
      {error ? <span className="register-field-error" role="alert">{error}</span> : null}
    </div>
  );
}

/** Must live outside RegisterForm — inline component remounts inputs every keystroke */
function RegisterSection({ title, premium, children }) {
  if (premium) {
    return (
      <div className="register-section">
        {title ? <h4 className="register-section-title">{title}</h4> : null}
        <div className="register-form-grid">{children}</div>
      </div>
    );
  }
  return <div className="register-form-grid">{children}</div>;
}

/** Full registration form */
export default function RegisterForm({ onSubmit, loading, footer, premium = false }) {
  const [form, setForm] = useState(() => emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const inputCls = premium ? 'input-field input-field-premium' : 'input-field';
  const maxDob = maxDobFor18Plus();
  const errCls = (field) => (fieldErrors[field] ? `${inputCls} input-field--error` : inputCls);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  };

  const handleFieldKeyDown = useCallback((e, fieldId) => {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA' && e.shiftKey) return;

    if (fieldId === 'reg-mobile') {
      const digits = normalizeIndianMobile(e.target.value);
      if (digits.length < 10) return;
    }

    e.preventDefault();

    if (fieldId === 'reg-confirm') {
      e.target.form?.requestSubmit();
      return;
    }

    focusNextField(fieldId);
  }, []);

  const handleMobileChange = (e) => {
    update('mobile', normalizeIndianMobile(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = getRegisterFieldErrors(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      onSubmit(null, Object.values(errors)[0]);
      return;
    }
    setFieldErrors({});
    await onSubmit(formToPayload(form));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`register-form ${premium ? 'register-form--premium' : ''}`}
      noValidate
    >
      <RegisterSection title={premium ? 'Personal Details' : null} premium={premium}>
        <Field id="reg-name" label="Full Name *" error={fieldErrors.name} className="register-field-full">
          <input
            id="reg-name"
            type="text"
            className={errCls('name')}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-name')}
            onFocus={scrollFieldIntoView}
            placeholder="e.g. Amruta Bargal"
            autoComplete="name"
            enterKeyHint="next"
            required
          />
        </Field>
        <Field id="reg-dob" label="Date of Birth *" error={fieldErrors.dateOfBirth}>
          <input
            id="reg-dob"
            type="date"
            className={errCls('dateOfBirth')}
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-dob')}
            onFocus={scrollFieldIntoView}
            max={maxDob}
            enterKeyHint="next"
            required
          />
        </Field>
        <Field id="reg-gender" label="Gender *" error={fieldErrors.gender}>
          <select
            id="reg-gender"
            className={errCls('gender')}
            value={form.gender}
            onChange={(e) => update('gender', e.target.value)}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-gender')}
            onFocus={scrollFieldIntoView}
            enterKeyHint="next"
            required
          >
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      </RegisterSection>

      <RegisterSection title={premium ? 'Contact' : null} premium={premium}>
        <Field
          id="reg-mobile"
          label="Mobile No *"
          hint={
            form.mobile.length === 10
              ? '✓ 10 digits entered'
              : `${form.mobile.length}/10 digits (starts with 6, 7, 8 or 9)`
          }
          error={fieldErrors.mobile}
        >
          <div className={`mobile-input-group ${fieldErrors.mobile ? 'mobile-input-group--error' : ''}`}>
            <span className="mobile-input-prefix" aria-hidden="true">
              +91
            </span>
            <input
              id="reg-mobile"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={errCls('mobile')}
              value={form.mobile}
              onChange={handleMobileChange}
              onBlur={() => clearFieldError('mobile')}
              onKeyDown={(e) => handleFieldKeyDown(e, 'reg-mobile')}
              onFocus={scrollFieldIntoView}
              placeholder="9876543210"
              autoComplete="tel-national"
              enterKeyHint="next"
              aria-label="10 digit mobile number without country code"
              required
            />
          </div>
        </Field>
        <Field id="reg-email" label="Email *" error={fieldErrors.email}>
          <input
            id="reg-email"
            type="email"
            className={errCls('email')}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => clearFieldError('email')}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-email')}
            onFocus={scrollFieldIntoView}
            placeholder="you@example.com"
            autoComplete="email"
            enterKeyHint="next"
            required
          />
        </Field>
        <Field
          id="reg-address"
          label="Full Address *"
          hint="House, area, city, state, PIN"
          error={fieldErrors.address}
          className="register-field-full"
        >
          <textarea
            id="reg-address"
            className={`${errCls('address')} min-h-[80px] resize-y`}
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            onBlur={() => clearFieldError('address')}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-address')}
            onFocus={scrollFieldIntoView}
            placeholder="Flat 12, MG Road, Pune, Maharashtra 411001"
            autoComplete="street-address"
            enterKeyHint="next"
            required
            rows={3}
          />
        </Field>
      </RegisterSection>

      <RegisterSection title={premium ? 'Security' : null} premium={premium}>
        <Field id="reg-password" label="Password *" error={fieldErrors.password}>
          <input
            id="reg-password"
            type="password"
            className={errCls('password')}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-password')}
            onFocus={scrollFieldIntoView}
            placeholder="Min 6 characters"
            autoComplete="new-password"
            enterKeyHint="next"
            required
            minLength={6}
          />
        </Field>
        <Field id="reg-confirm" label="Confirm Password *" error={fieldErrors.confirmPassword}>
          <input
            id="reg-confirm"
            type="password"
            className={errCls('confirmPassword')}
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            onKeyDown={(e) => handleFieldKeyDown(e, 'reg-confirm')}
            onFocus={scrollFieldIntoView}
            placeholder="Re-enter password"
            autoComplete="new-password"
            enterKeyHint="go"
            required
            minLength={6}
          />
        </Field>
      </RegisterSection>

      <button type="submit" disabled={loading} className="btn-primary w-full register-submit">
        <Icon name="person_add" size={18} />
        {loading ? 'Creating account…' : 'Register Free'}
      </button>

      {footer}
    </form>
  );
}

/** Profile fields (logged-in user) */
export function ProfileFieldsForm({ profile, setProfile, onSubmit, saving, extraFields, userId }) {
  return (
    <form onSubmit={onSubmit} className="register-form space-y-4">
      {userId && (
        <div className="register-user-id-badge">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</span>
          <span className="font-extrabold text-brand-orange tracking-wide">{userId}</span>
        </div>
      )}
      <div className="register-form-grid">
        <label className="register-field register-field-full">
          <span>Name</span>
          <input
            type="text"
            className="input-field"
            value={profile.name ?? ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </label>
        <label className="register-field">
          <span>DOB</span>
          <input
            type="date"
            className="input-field"
            value={profile.dateOfBirth ?? ''}
            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
          />
        </label>
        <label className="register-field">
          <span>Gender</span>
          <select
            className="input-field"
            value={profile.gender ?? ''}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="">Select</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="register-field">
          <span>Mobile No</span>
          <div className="mobile-input-group">
            <span className="mobile-input-prefix" aria-hidden="true">
              +91
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="input-field"
              value={profile.mobile ?? ''}
              onChange={(e) =>
                setProfile({ ...profile, mobile: normalizeIndianMobile(e.target.value) })
              }
              placeholder="9876543210"
              autoComplete="tel-national"
            />
          </div>
        </label>
        <label className="register-field">
          <span>Email</span>
          <input
            type="email"
            className="input-field"
            value={profile.email ?? ''}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </label>
        <label className="register-field register-field-full">
          <span>Address</span>
          <textarea
            className="input-field min-h-[72px] resize-y"
            value={profile.address ?? ''}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            rows={2}
          />
        </label>
        {extraFields}
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

export { formatDobForInput, GENDERS };
