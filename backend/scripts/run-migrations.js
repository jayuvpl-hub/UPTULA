#!/usr/bin/env node
/**
 * Run SQL migration files in job_portal/migrations/
 * Usage: node scripts/run-migrations.js [up|down] [filename]
 * Example: node scripts/run-migrations.js up 001_registration_categories_up.sql
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('../src/config/env');

const direction = (process.argv[2] || 'up').toLowerCase();
const specificFile = process.argv[3];

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  let files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (direction === 'down') {
    files = files.filter((f) => f.includes('_down.sql')).reverse();
  } else {
    files = files.filter((f) => f.includes('_up.sql'));
  }

  if (specificFile) {
    files = files.filter((f) => f === specificFile || f.includes(specificFile));
  }

  if (!files.length) {
    console.log('No migration files matched.');
    process.exit(0);
  }

  const connection = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    multipleStatements: true,
  });

  for (const file of files) {
    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`Running ${file}...`);
    try {
      await connection.query(sql);
      console.log(`  OK: ${file}`);
    } catch (err) {
      console.error(`  FAILED: ${file}`, err.message);
      await connection.end();
      process.exit(1);
    }
  }

  await connection.end();
  console.log('Migrations complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
