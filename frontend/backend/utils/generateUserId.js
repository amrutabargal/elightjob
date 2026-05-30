import crypto from 'crypto';
import User from '../models/User.js';

/** ELITE + 5 random digits — e.g. ELITE048291 */
export function formatEliteUserId(digits) {
  return `ELITE${String(digits).padStart(5, '0')}`;
}

export async function generateUniqueUserId() {
  const maxAttempts = 25;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const digits = crypto.randomInt(0, 100000);
    const userId = formatEliteUserId(digits);
    const exists = await User.exists({ userId });
    if (!exists) return userId;
  }

  throw new Error('Could not generate a unique user ID. Please try again.');
}
