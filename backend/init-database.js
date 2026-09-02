const { ensureDatabase } = require('./src/db/init');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    await ensureDatabase();
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
