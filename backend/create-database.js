const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    console.log('🚀 Creating database and tables...');
    
    // First connect without specifying database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS uptula CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Database "uptula" created/verified');
    
    await connection.end();

    // Now connect to the specific database and create tables
    const { ensureDatabase } = require('./src/db/init');
    await ensureDatabase();
    
    console.log('✅ All database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    process.exit(1);
  }
}

createDatabase();
