import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initSocketServer } from './socket/socketManager.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Use the system DNS configuration when custom DNS is unavailable.
}

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connectcraft';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the server.');
}

const httpServer = createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

initSocketServer(io);

mongoose.connect(MONGO_URI)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.info(`ConnectCraft API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[SERVER] MongoDB connection failed:', err.message);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  console.info(`[SERVER] Received ${signal}. Starting graceful shutdown...`);
  httpServer.close(async () => {
    console.info('[SERVER] HTTP server closed.');
    try {
      await mongoose.connection.close();
      console.info('[SERVER] MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('[SERVER] Error during Mongoose disconnection:', err.message);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

