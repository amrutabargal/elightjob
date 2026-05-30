import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import JobCache from '../models/JobCache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

async function clearUploads() {
  try {
    const entries = await fs.readdir(uploadsDir);
    await Promise.all(
      entries.map(async (name) => {
        const fullPath = path.join(uploadsDir, name);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      })
    );
    console.log(`Uploads cleared (${entries.length} items)`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No uploads folder found — skipped');
      return;
    }
    throw err;
  }
}

async function main() {
  await connectDB();

  const [users, applications, jobCaches] = await Promise.all([
    User.deleteMany({}),
    Application.deleteMany({}),
    JobCache.deleteMany({}),
  ]);

  console.log(`Users deleted: ${users.deletedCount}`);
  console.log(`Applications deleted: ${applications.deletedCount}`);
  console.log(`Job cache deleted: ${jobCaches.deletedCount}`);

  await clearUploads();
  console.log('All backend data removed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to clear data:', err.message);
  process.exit(1);
});
