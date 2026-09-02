#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getPool } = require('../src/db');
const { ensureCategorySchema } = require('../src/db/categorySchema');
const { seedCategories } = require('../src/db/seeders/categorySeeder');

async function main() {
  const pool = getPool();
  await ensureCategorySchema(pool);
  process.env.SEED_CATEGORIES = process.env.SEED_CATEGORIES || 'force';
  const result = await seedCategories(pool);
  console.log(result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
