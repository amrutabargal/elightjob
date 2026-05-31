/** Build public URL for files served from backend /uploads */
export function getUploadUrl(storedPath) {
  if (!storedPath) return null;
  const filename = String(storedPath).replace(/\\/g, '/').split('/').pop();
  if (!filename) return null;

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}/uploads/${filename}`;
}

export function getUserInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
