import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ProfileFieldsForm, formatDobForInput } from './RegisterForm';
import Icon from './Icon';
import { getUploadUrl, getUserInitials } from '../utils/uploads';

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'career', label: 'Career', icon: 'work' },
  { id: 'security', label: 'Security', icon: 'lock' },
];

function formatMemberSince(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ProfileModal({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [tab, setTab] = useState('profile');
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
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('profile');
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
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  const photoUrl = getUploadUrl(user.profilePhotoPath);
  const initials = getUserInitials(user.name);

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

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      await api.post('/users/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/users/change-password', passwords);
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={24} />
        </button>

        <div className="profile-modal-header">
          <div className="profile-modal-avatar-wrap">
            <div className="profile-modal-avatar">
              {photoUrl ? (
                <img src={photoUrl} alt={user.name} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              className="profile-modal-avatar-edit"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              title="Upload photo"
            >
              <Icon name="photo_camera" size={18} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={uploadPhoto}
            />
          </div>

          <div className="profile-modal-identity">
            <h2 id="profile-modal-title" className="profile-modal-name">
              {user.name}
            </h2>
            <p className="profile-modal-email">{user.email}</p>
            <div className="profile-modal-badges">
              {user.userId && (
                <span className="profile-badge profile-badge--id">
                  <Icon name="badge" size={16} />
                  {user.userId}
                </span>
              )}
              <span className="profile-badge">
                <Icon name="calendar_today" size={16} />
                Joined {formatMemberSince(user.createdAt)}
              </span>
              {user.isVerified && (
                <span className="profile-badge profile-badge--verified">
                  <Icon name="verified" size={16} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`profile-modal-tab ${tab === t.id ? 'profile-modal-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={18} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="profile-modal-body">
          {tab === 'profile' && (
            <div className="profile-tab-panel">
              <p className="profile-tab-desc">
                Registration details saved at sign-up. Update anytime below.
              </p>
              <ProfileFieldsForm
                profile={profile}
                setProfile={setProfile}
                onSubmit={saveProfile}
                saving={saving}
              />
            </div>
          )}

          {tab === 'career' && (
            <div className="profile-tab-panel">
              <form onSubmit={saveProfile} className="register-form space-y-4">
                <div className="register-form-grid">
                  <label className="register-field register-field-full">
                    <span>Skills (comma separated)</span>
                    <input
                      className="input-field"
                      value={profile.skills}
                      onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                      placeholder="Telecalling, Sales, CRM"
                    />
                  </label>
                  <label className="register-field">
                    <span>Experience</span>
                    <input
                      className="input-field"
                      value={profile.experience}
                      onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                      placeholder="e.g. 2 years BPO"
                    />
                  </label>
                  <label className="register-field">
                    <span>Preferred Location</span>
                    <input
                      className="input-field"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Mumbai, Pune…"
                    />
                  </label>
                </div>
                {user.resumeOriginalName && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Icon name="description" size={18} className="text-brand-orange" />
                    Resume: <strong>{user.resumeOriginalName}</strong>
                  </p>
                )}
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Save Career Info'}
                </button>
              </form>
            </div>
          )}

          {tab === 'security' && (
            <div className="profile-tab-panel">
              <form onSubmit={changePassword} className="profile-password-form">
                <p className="profile-tab-desc">Change your login password securely.</p>
                <label className="register-field register-field-full">
                  <span>Current Password</span>
                  <input
                    type="password"
                    className="input-field"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, currentPassword: e.target.value })
                    }
                    required
                    autoComplete="current-password"
                  />
                </label>
                <label className="register-field">
                  <span>New Password</span>
                  <input
                    type="password"
                    className="input-field"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                <label className="register-field">
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    className="input-field"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                <button type="submit" disabled={changingPassword} className="btn-primary">
                  {changingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
