const { getPool } = require('./src/db');
const { ensureDatabase } = require('./src/db/init');

async function testJobsSetup() {
  try {
    console.log('Testing jobs database setup...');
    
    // Ensure database tables are created
    await ensureDatabase();
    console.log('✅ Database tables created successfully');
    
    // Test the connection
    const pool = getPool();
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Check if jobs table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'jobs'");
    if (tables.length > 0) {
      console.log('✅ jobs table exists');
    } else {
      console.log('❌ jobs table not found');
    }
    
    // Check table structure
    const [columns] = await pool.execute('DESCRIBE jobs');
    console.log('✅ jobs table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check foreign key constraints
    const [fks] = await pool.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'jobs' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fks.length > 0) {
      console.log('✅ Foreign key constraints:');
      fks.forEach(fk => {
        console.log(`  - ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }
    
    console.log('\n🎉 Jobs database setup complete!');
    console.log('\nDatabase Structure:');
    console.log('- users: Basic user information');
    console.log('- user_profiles: Candidate profile data');
    console.log('- employer_profiles: Employer/company profile data');
    console.log('- jobs: Job postings with foreign key to employers');
    
    console.log('\nAPI Endpoints Available:');
    console.log('- POST /api/employer/jobs - Create new job');
    console.log('- GET /api/employer/jobs - Get employer jobs');
    console.log('- GET /api/employer/jobs/:id - Get specific job');
    console.log('- PUT /api/employer/jobs/:id - Update job');
    console.log('- DELETE /api/employer/jobs/:id - Delete job');
    
    console.log('\nTo test the job functionality:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Register an employer account with role="provider"');
    console.log('3. Login and navigate to /employer/add-jobs');
    console.log('4. Test job posting with all fields');
    
  } catch (error) {
    console.error('❌ Error setting up jobs database:', error.message);
  } finally {
    process.exit(0);
  }
}

testJobsSetup();
