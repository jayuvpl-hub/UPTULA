const { getPool } = require('./src/db/index');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    const pool = getPool();
    
    // Drop all tables in correct order (respecting foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS saved_jobs', 
      'DROP TABLE IF EXISTS applications',
      'DROP TABLE IF EXISTS jobs',
      'DROP TABLE IF EXISTS job_categories',
      'DROP TABLE IF EXISTS employer_profiles',
      'DROP TABLE IF EXISTS user_profiles',
      'DROP TABLE IF EXISTS users'
    ];

    for (const query of dropQueries) {
      try {
        await pool.query(query);
        console.log(`✅ Dropped table: ${query.split(' ')[2]}`);
      } catch (error) {
        console.log(`⚠️  Table may not exist: ${query.split(' ')[2]}`);
      }
    }

    console.log('✅ Database reset completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase();
