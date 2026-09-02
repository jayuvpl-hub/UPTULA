const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('../config/env');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

module.exports = { getPool, query };


