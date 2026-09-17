/**
 * Idempotent schema for the Razorpay payment flow.
 *
 * Why this file exists: init.js creates `payments` from a pre-Razorpay
 * definition that has none of the order/refund/invoice columns, and
 * `transaction_id` there is NOT NULL UNIQUE even though an order is inserted
 * before any transaction id exists. A second `CREATE TABLE IF NOT EXISTS
 * payments` further down init.js described the right shape but never ran,
 * because the table already existed by then. The result was that a fresh
 * database (a new RDS instance, for example) produced a `payments` table that
 * every payment INSERT would fail against, while long-lived developer
 * databases happened to work because they'd been ALTERed by hand.
 *
 * Everything here is safe to re-run on every boot.
 */

async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function indexExists(pool, table, indexName) {
  const [rows] = await pool.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [table, indexName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(pool, table, column, ddl) {
  if (await columnExists(pool, table, column)) return false;
  await pool.query(`ALTER TABLE ${table} ${ddl}`);
  return true;
}

async function describeColumn(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/**
 * Run a MODIFY COLUMN only when the column isn't already in the desired shape.
 * MODIFY rewrites the table, so doing it unconditionally on every boot would
 * lock `payments` and slow startup more and more as rows accumulate.
 */
async function modifyColumnIfNeeded(pool, table, column, { needsChange, ddl }) {
  const current = await describeColumn(pool, table, column);
  if (!current || !needsChange(current)) return false;
  await pool.query(`ALTER TABLE ${table} ${ddl}`);
  return true;
}

async function addIndexIfMissing(pool, table, indexName, ddl) {
  if (await indexExists(pool, table, indexName)) return false;
  try {
    await pool.query(`ALTER TABLE ${table} ${ddl}`);
    return true;
  } catch (err) {
    // A UNIQUE index can legitimately fail on legacy rows holding duplicates.
    // Log loudly rather than aborting the whole boot sequence.
    console.warn(`[paymentSchema] could not add index ${indexName} on ${table}: ${err.message}`);
    return false;
  }
}

async function ensurePaymentSchema(pool) {
  // --- payments: Razorpay order/refund/invoice columns ---
  await addColumnIfMissing(pool, 'payments', 'order_id', 'ADD COLUMN order_id VARCHAR(64) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'razorpay_order_id', 'ADD COLUMN razorpay_order_id VARCHAR(64) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'paid_at', 'ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'razorpay_refund_id', 'ADD COLUMN razorpay_refund_id VARCHAR(64) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'refund_amount', 'ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'refund_reason', 'ADD COLUMN refund_reason VARCHAR(255) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'refund_status', 'ADD COLUMN refund_status VARCHAR(30) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'refund_requested_at', 'ADD COLUMN refund_requested_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'refunded_at', 'ADD COLUMN refunded_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'invoice_number', 'ADD COLUMN invoice_number VARCHAR(64) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'invoice_generation_started_at', 'ADD COLUMN invoice_generation_started_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'invoice_generated_at', 'ADD COLUMN invoice_generated_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'receipt_email_started_at', 'ADD COLUMN receipt_email_started_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payments', 'receipt_email_sent_at', 'ADD COLUMN receipt_email_sent_at TIMESTAMP NULL DEFAULT NULL');
  // Invoices live in S3 in production; instance disks are ephemeral.
  await addColumnIfMissing(pool, 'payments', 'invoice_s3_key', 'ADD COLUMN invoice_s3_key VARCHAR(500) DEFAULT NULL');

  // An order row is created before Razorpay ever returns a payment id, so
  // transaction_id has to accept NULL. The original definition made it
  // NOT NULL, which broke the very first INSERT on a fresh database.
  await modifyColumnIfNeeded(pool, 'payments', 'transaction_id', {
    needsChange: (col) => col.IS_NULLABLE !== 'YES',
    ddl: 'MODIFY COLUMN transaction_id VARCHAR(255) DEFAULT NULL',
  });

  // INR amounts: the legacy default was 'USD'.
  await modifyColumnIfNeeded(pool, 'payments', 'currency', {
    needsChange: (col) => col.COLUMN_DEFAULT !== 'INR',
    ddl: "MODIFY COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'INR'",
  });

  await addIndexIfMissing(pool, 'payments', 'uniq_payments_order_id', 'ADD UNIQUE INDEX uniq_payments_order_id (order_id)');
  await addIndexIfMissing(pool, 'payments', 'uniq_payments_invoice_number', 'ADD UNIQUE INDEX uniq_payments_invoice_number (invoice_number)');
  await addIndexIfMissing(pool, 'payments', 'idx_payments_razorpay_order', 'ADD INDEX idx_payments_razorpay_order (razorpay_order_id)');

  // --- payment_webhook_events: idempotency ---
  // Razorpay retries an event up to 24 times, so fulfilment must be keyed on
  // the event id. The UNIQUE index is what makes "insert-if-not-exists" a
  // single atomic claim with no check-then-write race between instances.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      razorpay_payment_id VARCHAR(64) DEFAULT NULL,
      razorpay_order_id VARCHAR(64) DEFAULT NULL,
      raw_payload JSON NOT NULL,
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payment_id (razorpay_payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await addColumnIfMissing(pool, 'payment_webhook_events', 'event_id', 'ADD COLUMN event_id VARCHAR(80) DEFAULT NULL');
  await addColumnIfMissing(pool, 'payment_webhook_events', 'processed_at', 'ADD COLUMN processed_at TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing(pool, 'payment_webhook_events', 'process_error', 'ADD COLUMN process_error VARCHAR(500) DEFAULT NULL');
  await addIndexIfMissing(pool, 'payment_webhook_events', 'uniq_webhook_event_id', 'ADD UNIQUE INDEX uniq_webhook_event_id (event_id)');
}

module.exports = { ensurePaymentSchema };
