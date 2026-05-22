import 'dotenv/config';
import { createExpressApi } from './createExpressApi.js';
import { startIntegrationSyncScheduler } from './services/integrationSyncService.js';

const port = Number(process.env.PORT) || 3000;

async function main() {
  const app = await createExpressApi();

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.listen(port, () => {
    console.log(`Express API listening on http://localhost:${port}`);
  });

  startIntegrationSyncScheduler();
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
    console.error('  1) Docker: from the project root run');
    console.error('       docker compose up -d');
    console.error('     then retry: cd backend && npm run dev\n');
    console.error('  2) Install MongoDB locally and start mongod (port 27017).\n');
    console.error(
      '  3) Or set USE_MEMORY_MONGO=true in backend/.env (in-memory DB, dev only).\n'
    );
  }
  console.error(err);
  process.exit(1);
});
