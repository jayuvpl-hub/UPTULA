const { query } = require('./src/db');

async function verifyTables() {
  try {
    console.log('🔍 Verifying database tables...');
    
    // Get list of all tables
    const tables = await query('SHOW TABLES');
    console.log('\n📋 Database tables:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });

    // Get table structures
    console.log('\n📊 Table structures:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n--- ${tableName} ---`);
      const structure = await query(`DESCRIBE ${tableName}`);
      structure.forEach(column => {
        console.log(`  ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `[${column.Key}]` : ''}`);
      });
    }

    console.log('\n✅ Database verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    process.exit(1);
  }
}

verifyTables();
