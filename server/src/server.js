import 'dotenv/config';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';

const port = Number(process.env.PORT) || 3000;

const sessionName = 'sid';

async function main() {
  await connectDB();

  const dbName = mongoose.connection.db.databaseName;

  app.use(
    session({
      name: sessionName,
      secret: process.env.SESSION_SECRET || 'dev-only-set-SESSION_SECRET-in-production',
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

  app.use('/api', apiRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.message || 'Internal server error',
    });
  });

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  const msg = String(err?.message || err);
  if (
    err?.name === 'MongooseServerSelectionError' ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('getaddrinfo')
  ) {
    console.error('\nCould not reach MongoDB. Nothing is listening on your MONGODB_URI.');
    console.error('Fix one of these:\n');
    console.error('  1) Docker (easiest): from the project root run');
    console.error('       docker compose up -d');
    console.error('     then retry: cd server && npm run dev\n');
    console.error('  2) Install MongoDB locally and start mongod (port 27017).\n');
    console.error('  3) Or set USE_MEMORY_MONGO=true in server/.env (in-memory DB, no install).\n');
  }
  console.error(err);
  process.exit(1);
});
