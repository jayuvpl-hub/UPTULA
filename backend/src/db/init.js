const { getPool } = require('./index');

async function ensureDatabase() {
  const pool = getPool();

  // Add FCM token column for push notifications (safe migration)
  const [fcmColumnRows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'fcm_token'
      LIMIT 1
    `
  );
  if (!Array.isArray(fcmColumnRows) || fcmColumnRows.length === 0) {
    await pool.query(`ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) DEFAULT NULL`);
  }
  // password_hash was CHAR(32) for md5; bcrypt reset hashes (~60 chars) were truncated in MySQL.
  // Widen so md5 (32) or future bcrypt hashes fit.
  const [pwdHashCol] = await pool.query(
    `
      SELECT CHARACTER_MAXIMUM_LENGTH AS maxlen
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'password_hash'
      LIMIT 1
    `
  );
  if (Array.isArray(pwdHashCol) && pwdHashCol.length > 0 && Number(pwdHashCol[0].maxlen) < 255) {
    await pool.query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NOT NULL`);
  }

  // Create users table (job seekers and providers)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      role ENUM('seeker','provider') NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      phone VARCHAR(20) DEFAULT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Track notification delivery channel preference per user.
  const [fcmPlatformRows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'fcm_platform'
      LIMIT 1
    `
  );
  if (!Array.isArray(fcmPlatformRows) || fcmPlatformRows.length === 0) {
    await pool.query(`ALTER TABLE users ADD COLUMN fcm_platform ENUM('web','mobile') DEFAULT 'web'`);
  }
  // Create user_profiles table (for job seekers/candidates)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,

  name VARCHAR(120) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  gender ENUM('male','female','other') DEFAULT NULL,
  languages JSON DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,

  facebook VARCHAR(255) DEFAULT NULL,
  twitter VARCHAR(255) DEFAULT NULL,
  linkedin VARCHAR(255) DEFAULT NULL,
  google VARCHAR(255) DEFAULT NULL,

  preferred_job_role TEXT DEFAULT NULL,
  bio TEXT,
  resume VARCHAR(500),

  skills JSON,
  experience JSON,
  certifications JSON,
  education JSON,

  current_salary VARCHAR(50),
  expected_salary VARCHAR(50),
  notice_period VARCHAR(50),
  preferred_location VARCHAR(255),
  employment_type VARCHAR(50),

  profile_picture VARCHAR(500) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY unique_user_profile (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_profiles_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // //Extend user_profiles table safely 
  // const newColumns = [
  //   'bio TEXT',
  //   'resume VARCHAR(500)',
  //   'skills JSON',
  //   'languages JSON',
  //   'experience JSON',
  //   'certifications JSON',
  //   'education JSON',
  //   'current_salary VARCHAR(50)',
  //   'expected_salary VARCHAR(50)',
  //   'notice_period VARCHAR(50)',
  //   'preferred_location VARCHAR(255)',
  //   'employment_type VARCHAR(50)'
  // ];

  // for (const col of newColumns) {
  //   const colName = col.split(' ')[0];

  //   const [rows] = await pool.query(
  //     `
  //   SELECT COLUMN_NAME 
  //   FROM INFORMATION_SCHEMA.COLUMNS 
  //   WHERE TABLE_SCHEMA = DATABASE()
  //   AND TABLE_NAME = 'user_profiles' 
  //   AND COLUMN_NAME = ?
  //   `,
  //     [colName]
  //   );

  //   if (rows.length === 0) {
  //     await pool.query(`ALTER TABLE user_profiles ADD COLUMN ${col}`);
  //     console.log(`Column added: ${colName}`);
  //   }
  // }

  // Create employer_profiles table (for job providers/employers)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      company_name VARCHAR(120) DEFAULT NULL,
      contact_person VARCHAR(120) DEFAULT NULL,
      company_email VARCHAR(190) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      website VARCHAR(255) DEFAULT NULL,
      industry VARCHAR(100) DEFAULT NULL,
      company_size VARCHAR(50) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      linkedin VARCHAR(255) DEFAULT NULL,
      twitter VARCHAR(255) DEFAULT NULL,
      facebook VARCHAR(255) DEFAULT NULL,
      google VARCHAR(255) DEFAULT NULL,
      logo_url VARCHAR(255) DEFAULT NULL,
      founded_year YEAR DEFAULT NULL,
      company_type ENUM('startup','small_business','medium_business','large_corporation','non_profit') DEFAULT NULL,
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_employer_profile (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_employer_profiles_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create jobs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      job_title VARCHAR(120) NOT NULL,
      company_name VARCHAR(120) NOT NULL,
      category VARCHAR(100) DEFAULT NULL,
      description TEXT NOT NULL,
      salary_range VARCHAR(50) DEFAULT NULL,
      salary_min INT NULL,
      salary_max INT NULL,
      salary_type ENUM('fixed', 'negotiable') NOT NULL DEFAULT 'fixed',
      no_of_vacancy INT UNSIGNED DEFAULT 1,
      experience ENUM('fresher','1-2 years','2-5 years','5-10 years','10+ years') DEFAULT NULL,
      company_logo VARCHAR(255) DEFAULT NULL,
      job_type ENUM('full_time','part_time','contract','internship','freelance','remote') DEFAULT 'full_time',
      qualification VARCHAR(255) DEFAULT NULL,
      skills TEXT DEFAULT NULL,
      email VARCHAR(190) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      website VARCHAR(255) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      zip_code VARCHAR(20) DEFAULT NULL,
      facebook VARCHAR(255) DEFAULT NULL,
      google VARCHAR(255) DEFAULT NULL,
      twitter VARCHAR(255) DEFAULT NULL,
      linkedin VARCHAR(255) DEFAULT NULL,
      pinterest VARCHAR(255) DEFAULT NULL,
      instagram VARCHAR(255) DEFAULT NULL,
      status ENUM('active','inactive','closed','draft') DEFAULT 'active',
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      views_count INT UNSIGNED DEFAULT 0,
      applications_count INT UNSIGNED DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_jobs_employer_id (employer_id),
      INDEX idx_jobs_status (status),
      INDEX idx_jobs_job_type (job_type),
      INDEX idx_jobs_experience (experience),
      INDEX idx_jobs_city (city),
      INDEX idx_jobs_state (state),
      INDEX idx_jobs_country (country),
      INDEX idx_jobs_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Jobs salary columns (salary_min, salary_max, salary_type) — safe migration; keep salary_range for rollback
  const [salaryMinColRows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jobs'
        AND COLUMN_NAME = 'salary_min'
      LIMIT 1
    `
  );
  if (!Array.isArray(salaryMinColRows) || salaryMinColRows.length === 0) {
    await pool.query(`
      ALTER TABLE jobs
        ADD COLUMN salary_min INT NULL AFTER salary_range,
        ADD COLUMN salary_max INT NULL AFTER salary_min,
        ADD COLUMN salary_type ENUM('fixed', 'negotiable') NOT NULL DEFAULT 'fixed' AFTER salary_max
    `);
  }

  await pool.query(`
    UPDATE jobs
    SET
      salary_min = CAST(SUBSTRING_INDEX(salary_range, '-', 1) AS UNSIGNED),
      salary_max = CAST(SUBSTRING_INDEX(salary_range, '-', -1) AS UNSIGNED),
      salary_type = 'fixed'
    WHERE salary_range REGEXP '^[0-9]+-[0-9]+$'
  `);

  await pool.query(`
    UPDATE jobs
    SET salary_min = NULL, salary_max = NULL, salary_type = 'negotiable'
    WHERE LOWER(TRIM(salary_range)) = 'negotiable'
  `);

  await pool.query(`
    UPDATE jobs
    SET salary_min = NULL, salary_max = NULL, salary_type = 'negotiable'
    WHERE salary_range IS NOT NULL
      AND salary_range NOT REGEXP '^[0-9]+-[0-9]+$'
      AND LOWER(TRIM(salary_range)) <> 'negotiable'
  `);

  // Create applications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id BIGINT UNSIGNED NOT NULL,
      seeker_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(120) DEFAULT NULL,
      email VARCHAR(190) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      resume_url VARCHAR(255) DEFAULT NULL,
      pasted_cv TEXT DEFAULT NULL,
      status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT 'applied',
      decision ENUM('accept','rejectd') DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_applications_job_id (job_id),
      INDEX idx_applications_seeker_id (seeker_id),
      INDEX idx_applications_status (status),
      INDEX idx_applications_created_at (created_at),
      UNIQUE KEY unique_application (job_id, seeker_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Safely migrate legacy application statuses into the new stage model.
  await pool.query(`
    UPDATE applications
    SET status = CASE
      WHEN status = 'pending' THEN 'applied'
      WHEN status = 'reviewed' THEN 'resume_reviewed'
      WHEN status = 'shortlisted' THEN 'accepted_rejected'
      WHEN status IN ('rejected', 'hired') THEN 'final_decision'
      ELSE status
    END
  `);

  await pool.query(`
    ALTER TABLE applications
    MODIFY COLUMN status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') NOT NULL DEFAULT 'applied'
  `);

  const [decisionColumnRows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'applications'
        AND COLUMN_NAME = 'decision'
      LIMIT 1
    `
  );
  if (!Array.isArray(decisionColumnRows) || decisionColumnRows.length === 0) {
    await pool.query(`ALTER TABLE applications ADD COLUMN decision ENUM('accept','rejectd') DEFAULT NULL AFTER status`);
  }

  // Create application status history table for audit trail
  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_status_history (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      application_id BIGINT UNSIGNED NOT NULL,
      previous_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT NULL,
      new_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') NOT NULL,
      changed_by_user_id BIGINT UNSIGNED DEFAULT NULL,
      changed_by_role ENUM('seeker','provider','admin') NOT NULL,
      changed_by_identifier VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      INDEX idx_app_status_history_application (application_id),
      INDEX idx_app_status_history_changed_by_user (changed_by_user_id),
      INDEX idx_app_status_history_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create job_categories table (optional - for better organization)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_job_categories_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create saved_jobs table (for job seekers to save jobs)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id BIGINT UNSIGNED NOT NULL,
      seeker_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_saved_job (job_id, seeker_id),
      INDEX idx_saved_jobs_seeker_id (seeker_id),
      INDEX idx_saved_jobs_job_id (job_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('application','job_update','system','message') DEFAULT 'system',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_notifications_user_id (user_id),
      INDEX idx_notifications_is_read (is_read),
      INDEX idx_notifications_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create user_downloads table (for tracking resume downloads)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_downloads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      download_type ENUM('resume','premium_resume') DEFAULT 'resume',
      template_used VARCHAR(50) DEFAULT 'basic',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_downloads_user_id (user_id),
      INDEX idx_user_downloads_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create premium_memberships table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS premium_memberships (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      membership_type ENUM('basic', 'premium', 'enterprise') NOT NULL DEFAULT 'basic',
      status ENUM('active', 'expired', 'cancelled', 'pending') NOT NULL DEFAULT 'pending',
      start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50) DEFAULT NULL,
      transaction_id VARCHAR(255) DEFAULT NULL,
      features JSON DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_premium_user_id (user_id),
      INDEX idx_premium_status (status),
      INDEX idx_premium_type (membership_type),
      INDEX idx_premium_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create download_tracking table for employer resume downloads
  await pool.query(`
    CREATE TABLE IF NOT EXISTS download_tracking (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      application_id BIGINT UNSIGNED NOT NULL,
      download_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      INDEX idx_download_employer (employer_id),
      INDEX idx_download_date (download_date),
      INDEX idx_download_application (application_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      membership_id BIGINT UNSIGNED DEFAULT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      payment_method VARCHAR(50) NOT NULL,
      transaction_id VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      payment_type ENUM('membership', 'resume_download', 'job_posting', 'other') NOT NULL,
      description TEXT DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (membership_id) REFERENCES premium_memberships(id) ON DELETE SET NULL,
      INDEX idx_payments_user (user_id),
      INDEX idx_payments_status (status),
      INDEX idx_payments_type (payment_type),
      INDEX idx_payments_date (created_at),
      INDEX idx_payments_transaction (transaction_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Track employer feature access (analytics trials, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employer_feature_access (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      feature_key VARCHAR(100) NOT NULL,
      is_unlocked TINYINT(1) NOT NULL DEFAULT 0,
      trial_views_used INT UNSIGNED NOT NULL DEFAULT 0,
      trial_limit INT UNSIGNED NOT NULL DEFAULT 3,
      unlocked_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      metadata JSON DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_employer_feature (employer_id, feature_key),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_feature_key (feature_key),
      INDEX idx_feature_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Historical job analytics snapshots for quick reporting
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_analytics_snapshots (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id BIGINT UNSIGNED NOT NULL,
      total_applications INT UNSIGNED NOT NULL DEFAULT 0,
      fresher_count INT UNSIGNED NOT NULL DEFAULT 0,
      experienced_count INT UNSIGNED NOT NULL DEFAULT 0,
      snapshot_range VARCHAR(50) DEFAULT 'all_time',
      captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metadata JSON DEFAULT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      INDEX idx_job_analytics_job (job_id),
      INDEX idx_job_analytics_captured (captured_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Chat threads between candidates and employers
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id BIGINT UNSIGNED NOT NULL,
      employer_id BIGINT UNSIGNED NOT NULL,
      candidate_id BIGINT UNSIGNED NOT NULL,
      status ENUM('pending','approved','declined','closed') NOT NULL DEFAULT 'pending',
      candidate_unread INT UNSIGNED NOT NULL DEFAULT 0,
      employer_unread INT UNSIGNED NOT NULL DEFAULT 0,
      last_message_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_thread (job_id, employer_id, candidate_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_chat_threads_employer (employer_id, status),
      INDEX idx_chat_threads_candidate (candidate_id),
      INDEX idx_chat_threads_job (job_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      thread_id BIGINT UNSIGNED NOT NULL,
      sender_id BIGINT UNSIGNED NOT NULL,
      sender_role ENUM('seeker','provider','admin') NOT NULL,
      message TEXT NOT NULL,
      is_flagged TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_chat_messages_thread (thread_id),
      INDEX idx_chat_messages_sender (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_reports (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      thread_id BIGINT UNSIGNED NOT NULL,
      reporter_id BIGINT UNSIGNED NOT NULL,
      reporter_role ENUM('seeker','provider','admin') NOT NULL,
      reason VARCHAR(255) NOT NULL,
      details TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_chat_reports_thread (thread_id),
      INDEX idx_chat_reports_reporter (reporter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create support_tickets table (for CS and Employers)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      created_by VARCHAR(64) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category ENUM('billing','login','job_posting','general') NOT NULL DEFAULT 'general',
      priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
      status ENUM('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
      description TEXT,
      resolution_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_support_tickets_employer (employer_id),
      INDEX idx_support_tickets_status (status),
      INDEX idx_support_tickets_category (category),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create premium_subscriptions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS premium_subscriptions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      subscription_type ENUM('monthly','yearly','lifetime') NOT NULL,
      status ENUM('active','expired','cancelled') DEFAULT 'active',
      start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_premium_subscriptions_user_id (user_id),
      INDEX idx_premium_subscriptions_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create sponsorships table (admin-created featured sponsorships)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsorships (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      company_name VARCHAR(120) NOT NULL,
      logo VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      link_url VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP NULL,
      click_count INT UNSIGNED DEFAULT 0,
      view_count INT UNSIGNED DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      INDEX idx_sponsorships_admin_id (admin_id),
      INDEX idx_sponsorships_job_id (job_id),
      INDEX idx_sponsorships_is_active (is_active),
      INDEX idx_sponsorships_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Promotions: featured jobs/employers with scheduling and priority
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      item_type ENUM('job','employer') NOT NULL,
      item_id BIGINT UNSIGNED NOT NULL,
      priority INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      starts_at TIMESTAMP NULL,
      ends_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_promotions_type_item (item_type, item_id),
      INDEX idx_promotions_active (is_active),
      INDEX idx_promotions_schedule (starts_at, ends_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Banners / featured companies for homepage
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      link_url VARCHAR(500) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      priority INT NOT NULL DEFAULT 0,
      starts_at TIMESTAMP NULL,
      ends_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_banners_active (is_active),
      INDEX idx_banners_priority (priority),
      INDEX idx_banners_schedule (starts_at, ends_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // CMS: static pages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      slug VARCHAR(190) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      content MEDIUMTEXT DEFAULT NULL,
      seo_title VARCHAR(255) DEFAULT NULL,
      seo_description VARCHAR(500) DEFAULT NULL,
      seo_keywords VARCHAR(500) DEFAULT NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_cms_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // CMS: blog/news
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      slug VARCHAR(190) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT DEFAULT NULL,
      content MEDIUMTEXT DEFAULT NULL,
      cover_image VARCHAR(500) DEFAULT NULL,
      seo_title VARCHAR(255) DEFAULT NULL,
      seo_description VARCHAR(500) DEFAULT NULL,
      seo_keywords VARCHAR(500) DEFAULT NULL,
      status ENUM('draft','published') NOT NULL DEFAULT 'draft',
      published_at TIMESTAMP NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_blog_status (status),
      INDEX idx_blog_published_at (published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Media assets
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) DEFAULT NULL,
      file_type VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_media_type (file_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Testimonials
  await pool.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      author_name VARCHAR(255) NOT NULL,
      author_role VARCHAR(255) DEFAULT NULL,
      content TEXT NOT NULL,
      rating TINYINT UNSIGNED DEFAULT 5,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_testimonials_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Create boolean_search_usage table (track free user's one-time pro feature trial)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS boolean_search_usage (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      has_used_pro_trial TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_employer_boolean_search (employer_id),
      INDEX idx_boolean_search_employer (employer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create resume_scoring_usage table (track daily usage for free users)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resume_scoring_usage (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED DEFAULT NULL,
      usage_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
      INDEX idx_resume_scoring_employer (employer_id),
      INDEX idx_resume_scoring_date (usage_date),
      INDEX idx_resume_scoring_employer_date (employer_id, usage_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create saved_searches table (for pro users to save boolean searches)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      search_name VARCHAR(255) NOT NULL,
      search_query TEXT NOT NULL,
      search_filters JSON DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_saved_searches_employer (employer_id),
      INDEX idx_saved_searches_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create resume_alerts table (for pro users to set up alerts)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resume_alerts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      alert_name VARCHAR(255) NOT NULL,
      search_criteria JSON NOT NULL,
      frequency ENUM('daily', 'weekly', 'instant') NOT NULL DEFAULT 'daily',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_triggered_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_resume_alerts_employer (employer_id),
      INDEX idx_resume_alerts_active (is_active),
      INDEX idx_resume_alerts_frequency (frequency)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create site_settings table (single row configuration)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
      site_name VARCHAR(255) DEFAULT 'Uptula',
      logo_url VARCHAR(500) DEFAULT NULL,
      contact_email VARCHAR(255) DEFAULT NULL,
      contact_phone VARCHAR(50) DEFAULT NULL,
      smtp_host VARCHAR(255) DEFAULT NULL,
      smtp_port INT DEFAULT NULL,
      smtp_user VARCHAR(255) DEFAULT NULL,
      smtp_secure TINYINT(1) NOT NULL DEFAULT 0,
      payment_provider VARCHAR(50) DEFAULT 'stripe',
      payment_public_key VARCHAR(255) DEFAULT NULL,
      payment_secret_key VARCHAR(255) DEFAULT NULL,
      seo_meta_title VARCHAR(255) DEFAULT NULL,
      seo_meta_description VARCHAR(500) DEFAULT NULL,
      seo_meta_image VARCHAR(500) DEFAULT NULL,
      social_twitter VARCHAR(255) DEFAULT NULL,
      social_facebook VARCHAR(255) DEFAULT NULL,
      job_alert_frequency ENUM('instant','daily','weekly') NOT NULL DEFAULT 'daily',
      upload_max_mb INT NOT NULL DEFAULT 10,
      upload_allowed_types VARCHAR(255) NOT NULL DEFAULT 'pdf,doc,docx,jpg,png',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  const [settingsCount] = await pool.query(`SELECT COUNT(*) as count FROM site_settings`);
  if (settingsCount[0].count === 0) {
    await pool.query(`INSERT INTO site_settings (id) VALUES (1)`);
  }

  // Create employer_referral_codes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employer_referral_codes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      referral_code VARCHAR(32) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_employer_referral (employer_id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_referral_employer (employer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create referrals table (captures registrations via referral)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      referral_code VARCHAR(32) NOT NULL,
      referred_user_id BIGINT UNSIGNED DEFAULT NULL,
      status ENUM('clicked','registered') NOT NULL DEFAULT 'clicked',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_referrals_employer (employer_id),
      INDEX idx_referrals_status (status),
      INDEX idx_referrals_code (referral_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create job_wishlist table (candidates can save jobs for later)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_wishlist (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      candidate_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_candidate_job (candidate_id, job_id),
      FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      INDEX idx_wishlist_candidate (candidate_id),
      INDEX idx_wishlist_job (job_id),
      INDEX idx_wishlist_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempt_count INT DEFAULT 0,
      resend_count INT DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  //register_otp
  await pool.query(`
    CREATE TABLE IF NOT EXISTS register_otp (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      role VARCHAR(20),
      phone VARCHAR(20),
      password_hash VARCHAR(255),
      expires_at DATETIME,
      attempt_count INT DEFAULT 0,
      resend_count INT DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Search / view logs and notification digest queue (smart job alerts)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_search_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      keyword VARCHAR(255) NOT NULL,
      searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_search_user (user_id),
      INDEX idx_search_at (searched_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_job_views (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED NOT NULL,
      viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      INDEX idx_view_user (user_id),
      INDEX idx_view_job (job_id),
      INDEX idx_view_at (viewed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_digest (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      INDEX idx_digest_user (user_id),
      INDEX idx_digest_sent (sent_at),
      INDEX idx_digest_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Create razorpay_orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
   
      -- Our own internal, unique order reference — generated before we ever
      -- call Razorpay, sent as the "receipt" field. Used as the public-facing
      -- ID for refund requests / invoice lookups instead of exposing
      -- Razorpay's internal order id everywhere.
      order_id VARCHAR(64) NOT NULL UNIQUE,
   
      razorpay_order_id VARCHAR(64) DEFAULT NULL,
      razorpay_payment_id VARCHAR(64) DEFAULT NULL,
      employer_id INT NOT NULL,
      plan VARCHAR(50) NOT NULL,
      amount_paise INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
   
      status ENUM('created', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'created',
      verified_at TIMESTAMP NULL DEFAULT NULL,
   
      -- Set the moment a payment is confirmed. Kept separate from created_at
      -- because refund eligibility ("within 3 days") is measured from the
      -- actual payment moment, not order-creation time.
      paid_at TIMESTAMP NULL DEFAULT NULL,
   
      -- Refund tracking
      razorpay_refund_id VARCHAR(64) DEFAULT NULL,
      refund_amount_paise INT DEFAULT NULL,
      refund_reason VARCHAR(255) DEFAULT NULL,
      refunded_at TIMESTAMP NULL DEFAULT NULL,
   
      -- Invoice/receipt tracking (generation logic to be added later —
      -- these columns just record that it happened, and with what reference)
      invoice_number VARCHAR(64) DEFAULT NULL UNIQUE,
      invoice_generated_at TIMESTAMP NULL DEFAULT NULL,
   
      -- Email tracking (sending logic to be added later)
      receipt_email_sent_at TIMESTAMP NULL DEFAULT NULL,
   
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
      INDEX idx_employer (employer_id),
      INDEX idx_razorpay_order (razorpay_order_id),
      INDEX idx_status (status),
      INDEX idx_order_id (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
   
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
  const { ensureCategorySchema } = require('./categorySchema');
  await ensureCategorySchema(pool);

  // Phase 1 transformation schema: category type + multi-category junctions +
  // user/profile/resume columns. Idempotent and backward compatible.
  const { ensurePhase1Schema } = require('./phase1Schema');
  await ensurePhase1Schema(pool);

  console.log('✅ All database tables created successfully!');
}

module.exports = { ensureDatabase };


