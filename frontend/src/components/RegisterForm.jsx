import { useState } from 'react';
import Icon from './Icon';

const GENDERS = ['Male', 'Female', 'Other'];

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

function formatDobForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function validateRegisterForm(form) {
  if (!form.name.trim()) return 'Name is required';
  if (!form.dateOfBirth) return 'Date of birth is required';
  if (!form.gender) return 'Please select gender';
  if (!form.mobile.trim()) return 'Mobile number is required';
  const phone = form.mobile.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit mobile number';
  if (!form.email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email';
  if (!form.address.trim()) return 'Address is required';
  if (form.address.trim().length < 10) return 'Address must be at least 10 characters';
  if (!form.password) return 'Password is required';
  if (form.password.length < 6) return 'Password must be at least 6 characters';
  if (form.password !== form.confirmPassword) return 'Passwords do not match';

  const dob = new Date(form.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  if (age < 18) return 'You must be at least 18 years old';

  return null;
}

export function formToPayload(form) {
  return {
    name: form.name.trim(),
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    mobile: form.mobile.replace(/\D/g, ''),
    email: form.email.trim().toLowerCase(),
    address: form.address.trim(),
    password: form.password,
  };
}

/** Full registration form */
export default function RegisterForm({ onSubmit, loading, footer, premium = false }) {
  const [form, setForm] = useState(emptyForm);
  const inputCls = premium ? 'input-field input-field-premium' : 'input-field';

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateRegisterForm(form);
    if (err) {
      onSubmit(null, err);
      return;
    }
    await onSubmit(formToPayload(form));
  };

  const Section = ({ title, children }) =>
    premium ? (
      <div className="register-section">
        {title ? <h4 className="register-section-title">{title}</h4> : null}
        <div className="register-form-grid">{children}</div>
      </div>
    ) : (
      <div className="register-form-grid">{children}</div>
    );

  return (
    <form onSubmit={handleSubmit} className={`register-form ${premium ? 'register-form--premium' : ''}`}>
      <Section title={premium ? 'Personal Details' : null}>
        <label className="register-field register-field-full">
          <span>Name</span>
          <input
            type="text"
            className={inputCls}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Full name"
            required
          />
        </label>
        <label className="register-field">
          <span>DOB</span>
          <input
            type="date"
            className={inputCls}
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        <label className="register-field">
          <span>Gender</span>
          <select className={inputCls} value={form.gender} onChange={(e) => update('gender', e.target.value)} required>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </Section>

      <Section title={premium ? 'Contact' : null}>
        <label className="register-field">
          <span>Mobile No</span>
          <input
            type="tel"
            className={inputCls}
            value={form.mobile}
            onChange={(e) => update('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            required
            maxLength={10}
          />
        </label>
        <label className="register-field">
          <span>Email</span>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="register-field register-field-full">
          <span>Address</span>
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Full address (city, state, PIN)"
            required
            rows={2}
          />
        </label>
      </Section>

      <Section title={premium ? 'Security' : null}>
        <label className="register-field">
          <span>Password</span>
          <input
            type="password"
            className={inputCls}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Min 6 characters"
            required
            minLength={6}
          />
        </label>
        <label className="register-field">
          <span>Confirm Password</span>
          <input
            type="password"
            className={inputCls}
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            placeholder="Re-enter password"
            required
            minLength={6}
          />
        </label>
      </Section>

      <button type="submit" disabled={loading} className="btn-primary w-full register-submit">
        <Icon name="person_add" size={18} />
        {loading ? 'Registering...' : 'Register'}
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
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </label>
        <label className="register-field">
          <span>DOB</span>
          <input
            type="date"
            className="input-field"
            value={profile.dateOfBirth}
            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
          />
        </label>
        <label className="register-field">
          <span>Gender</span>
          <select
            className="input-field"
            value={profile.gender}
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
          <input
            type="tel"
            className="input-field"
            value={profile.mobile}
            onChange={(e) =>
              setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
            }
            maxLength={10}
          />
        </label>
        <label className="register-field">
          <span>Email</span>
          <input
            type="email"
            className="input-field"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </label>
        <label className="register-field register-field-full">
          <span>Address</span>
          <textarea
            className="input-field min-h-[72px] resize-y"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            rows={2}
          />
        </label>
        {extraFields}
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

export { formatDobForInput, GENDERS };
