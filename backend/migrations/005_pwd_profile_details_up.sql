-- Migration 005: Move accessibility fields from user_profiles into pwd_profile_details.
-- Preserves existing data before dropping the columns from user_profiles.
-- FK convention matches user_profiles: user_id → users(id), one row per user.
--
-- Prerequisite: migration 004 columns exist on user_profiles (has_disability,
-- disability_details, accommodation_needs). On fresh DBs that never ran 004,
-- skip the INSERT/DROP steps — the boot path in phase1Schema.js creates the
-- table idempotently without needing those columns.

CREATE TABLE IF NOT EXISTS pwd_profile_details (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  has_disability TINYINT(1) NOT NULL DEFAULT 0,
  disability_details TEXT DEFAULT NULL,
  accommodation_needs TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pwd_profile_user (user_id),
  INDEX idx_pwd_profile_user (user_id),
  CONSTRAINT fk_pwd_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy non-default accessibility data from user_profiles (requires 004 columns).
INSERT IGNORE INTO pwd_profile_details (user_id, has_disability, disability_details, accommodation_needs)
SELECT user_id, has_disability, disability_details, accommodation_needs
FROM user_profiles
WHERE has_disability = 1
   OR (disability_details IS NOT NULL AND TRIM(disability_details) <> '')
   OR (accommodation_needs IS NOT NULL AND TRIM(accommodation_needs) <> '');

ALTER TABLE user_profiles DROP COLUMN IF EXISTS has_disability;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS disability_details;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS accommodation_needs;
