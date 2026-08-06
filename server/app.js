import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables immediately
dotenv.config();
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import discoverRoutes from './routes/discoverRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import projectInvitationRoutes from './routes/projectInvitationRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import workshopRoutes from './routes/workshopRoutes.js';
import impactRoutes from './routes/impactRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import discussionRoutes from './routes/discussionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { getCommunityLeaderboard } from './controllers/impactController.js';
import { protect } from './middleware/authMiddleware.js';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many authentication attempts. Please try again later.' },
});

const sanitizeObject = (value) => {
  if (!value || typeof value !== 'object') return;

  Object.keys(value).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      return;
    }

    sanitizeObject(value[key]);
  });
};

const sanitizeRequest = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      return callback(null, origin);
    }
    return callback(null, origin);
  },
  credentials: true,
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use('/api', apiLimiter);

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-invitations', projectInvitationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.get('/api/communities/:communityId/leaderboard', protect, getCommunityLeaderboard);
app.use('/api', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ConnectCraft API is running smoothly',
    timestamp: new Date()
  });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    status: err.status || 'error',
    message: statusCode >= 500 && isProduction
      ? 'An unexpected server error occurred.'
      : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
