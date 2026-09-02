const { getPool } = require('./src/db/index');

async function forceResetDatabase() {
  try {
    console.log('🔄 Force resetting database...');
    const pool = getPool();
    
    // First, try to drop all tables with CASCADE to handle foreign key constraints
    const dropQueries = [
      'SET FOREIGN_KEY_CHECKS = 0',
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS saved_jobs', 
      'DROP TABLE IF EXISTS applications',
      'DROP TABLE IF EXISTS jobs',
      'DROP TABLE IF EXISTS job_categories',
      'DROP TABLE IF EXISTS employer_profiles',
      'DROP TABLE IF EXISTS user_profiles',
      'DROP TABLE IF EXISTS users',
      'SET FOREIGN_KEY_CHECKS = 1'
    ];

    for (const query of dropQueries) {
      try {
        await pool.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message}`);
      }
    }

    console.log('✅ Database force reset completed!');
    console.log('🚀 Now creating fresh tables...');
    
    // Now create all tables fresh
    const { ensureDatabase } = require('./src/db/init');
    await ensureDatabase();
    
    console.log('✅ All database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database force reset failed:', error.message);
    process.exit(1);
  }
}

forceResetDatabase();
