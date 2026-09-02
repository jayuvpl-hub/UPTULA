require('dotenv').config();
const app = require('./app');
const { PORT } = require('./config/env');
const { ensureDatabase } = require('./db/init');

async function start() {
  try {
    await ensureDatabase();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
