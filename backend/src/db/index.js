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

/**
 * Run `fn` inside a single transaction, handing it a connection whose `query`
 * has the same "rows only" shape as the module-level query() above.
 *
 * Needed by payment fulfilment: the browser callback and the Razorpay webhook
 * can both try to activate the same membership concurrently, so the guard has
 * to be a SELECT ... FOR UPDATE inside a transaction rather than a read
 * followed by a separate write.
 */
async function withTransaction(fn) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const tx = {
      async query(sql, params) {
        const [rows] = await connection.execute(sql, params);
        return rows;
      },
    };
    const result = await fn(tx);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('[db] rollback failed:', rollbackErr.message);
    }
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { getPool, query, withTransaction };


