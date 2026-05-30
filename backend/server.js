import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { BRAND_NAME, MONGODB_DB_NAME } from './config/brand.js';
import { initEmailOnStartup } from './config/email.js';
import { corsOrigin } from './config/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: `${BRAND_NAME} API` });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

let httpServer = null;

const listen = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      resolve(server);
    });

    server.on('error', (err) => {
      server.close();
      reject(err);
    });
  });

const startServer = async (attempt = 1) => {
  if (httpServer?.listening) {
    return httpServer;
  }

  try {
    httpServer = await listen();
    return httpServer;
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use (attempt ${attempt}/3).`);

      if (attempt < 3) {
        console.error(`Retrying in ${attempt * 2}s... Close other backend terminals if this keeps failing.\n`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        return startServer(attempt + 1);
      }

      console.error('Fix: Close duplicate backend, then run:');
      console.error(`  netstat -ano | findstr :${PORT}`);
      console.error('  taskkill /PID <pid> /F\n');
      process.exit(1);
    }

    console.error('Server error:', err.message);
    process.exit(1);
  }
};

const shutdown = () => {
  if (httpServer) {
    httpServer.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const boot = async () => {
  await connectDB();
  await initEmailOnStartup();
  await startServer();
};

boot().catch((err) => {
  console.error('\nStartup failed:', err.message);
  console.error('Check MongoDB is running and MONGODB_URI in backend/.env');
  console.error(`Example: mongodb://127.0.0.1:27017/${MONGODB_DB_NAME}\n`);
  process.exit(1);
});
