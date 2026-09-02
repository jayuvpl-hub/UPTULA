const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'uptula_db'
    });

    console.log('Checking users...');
    
    // Get all users
    const [users] = await connection.execute('SELECT id, full_name, email, role FROM users');
    console.log('All users:', users);
    
    // Get the employer (user ID 3)
    const [employer] = await connection.execute('SELECT * FROM users WHERE id = 3');
    console.log('Employer (ID 3):', employer[0]);
    
    // Get applications for this employer
    const [employerApps] = await connection.execute(`
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
      WHERE j.employer_id = 3
    `);
    
    console.log('Applications for employer ID 3:', employerApps);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
