const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkApplications() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'uptula_db'
    });

    console.log('Checking applications...');
    
    // Check if applications table exists and has data
    const [applications] = await connection.execute('SELECT COUNT(*) as count FROM applications');
    console.log('Total applications:', applications[0].count);
    
    // Check if jobs table has data
    const [jobs] = await connection.execute('SELECT COUNT(*) as count FROM jobs');
    console.log('Total jobs:', jobs[0].count);
    
    // Check if users table has data
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', users[0].count);
    
    // Get sample applications with job details
    const [sampleApps] = await connection.execute(`
      SELECT 
        a.id,
        a.job_id,
        a.seeker_id,
        a.name,
        a.email,
        a.resume_url,
        a.created_at,
        j.job_title,
        j.company_name,
        j.employer_id
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      LIMIT 5
    `);
    
    console.log('Sample applications:', sampleApps);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkApplications();
