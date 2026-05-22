import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';

/**
 * CSP aligned with the previous Nest bootstrap (Scalar / Razorpay / CDNs for API docs).
 * Adjust directives when you add new script or frame origins.
 */
const helmetContentSecurityPolicy = {
  directives: {
    defaultSrc: [`'self'`],
    styleSrc: [
      `'self'`,
      `'unsafe-inline'`,
      'unpkg.com',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
    ],
    connectSrc: [`'self'`, 'unpkg.com'],
    frameSrc: [
      `'self'`,
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
    ],
    fontSrc: [`'self'`, 'fonts.gstatic.com'],
    imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
    scriptSrc: [
      `'self'`,
      `'unsafe-eval'`,
      `'unsafe-inline'`,
      'cdn.jsdelivr.net',
      'unpkg.com',
      'checkout.razorpay.com',
    ],
  },
};

function buildLogger() {
  const level = process.env.LOG_LEVEL || 'info';
  if (process.env.NODE_ENV === 'production') {
    return pino({ level });
  }
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    },
  });
}

/**
 * Express stack used for all JSON APIs + sessions. Intended to mount inside the Next.js
 * custom server without a catch‑all 404 so unresolved requests can fall through to Next.
 */
export async function createExpressApi() {
  await connectDB();
  const dbName = mongoose.connection.db.databaseName;
  const logger = buildLogger();

  const app = express();
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: helmetContentSecurityPolicy,
      crossOriginEmbedderPolicy: false,
    })
  );

  const corsMaxAge = Number(process.env.CORS_MAX_AGE ?? 86400);
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
      maxAge: corsMaxAge,
    })
  );

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
    })
  );

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'personal-dashboard-api' });
  });

  app.use(
    session({
      name: 'sid',
      secret:
        process.env.SESSION_SECRET ||
        'dev-only-set-SESSION_SECRET-in-production',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName,
        collectionName: 'sessions',
      }),
      cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    })
  );

  app.use('/api/v1', apiRoutes);
  app.use('/api', apiRoutes);

  app.use((err, req, res, next) => {
    const log = req.log || logger;
    log.error(err);
    if (res.headersSent) {
      next(err);
      return;
    }
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
