require('dotenv').config();
const app = require('./app');
const { PORT, PUBLIC_API_URL, NODE_ENV } = require('./config/env');
const { ensureDatabase } = require('./db/init');
const { startDigestCron } = require('./utils/digestCron');

async function start() {
  try {
    await ensureDatabase();
    startDigestCron();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on ${PUBLIC_API_URL} (port ${PORT}, NODE_ENV=${NODE_ENV})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
