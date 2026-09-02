-- Migration 003: Phase 1 platform transformation
-- Canonical idempotent path runs on server boot: src/db/phase1Schema.js
-- This file mirrors it for manual/CI runs and documentation (MariaDB syntax).

-- categories.type (Technical / Non-Technical)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS type ENUM('technical','non_technical') NOT NULL DEFAULT 'technical' AFTER name;
ALTER TABLE categories
  ADD INDEX IF NOT EXISTS idx_categories_type (type);

-- One-time best-effort classification of the seeded skilled-work categories.
UPDATE categories SET type = 'non_technical'
WHERE type = 'technical' AND (
  name LIKE '%Domestic%' OR name LIKE '%Household%' OR name LIKE '%Security%' OR
  name LIKE '%Hospitality%' OR name LIKE '%Restaurant%' OR name LIKE '%Cleaning%' OR
  name LIKE '%Sanitation%' OR name LIKE '%Delivery%' OR name LIKE '%E-Commerce%' OR
  name LIKE '%Beauty%' OR name LIKE '%Personal Care%' OR name LIKE '%Warehouse%' OR
  name LIKE '%Logistics%' OR name LIKE '%Driver%' OR name LIKE '%Transportation%' OR
  name LIKE '%Event%' OR name LIKE '%Decoration%'
);

-- Multi-category selection (max 5 enforced in app layer)
CREATE TABLE IF NOT EXISTS user_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_category (user_id, category_id),
  INDEX idx_user_categories_user (user_id),
  INDEX idx_user_categories_category (category_id),
  CONSTRAINT fk_user_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_subcategories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subcategory_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_subcategory (user_id, subcategory_id),
  INDEX idx_user_subcategories_user (user_id),
  INDEX idx_user_subcategories_subcategory (subcategory_id),
  CONSTRAINT fk_user_subcategories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_subcategories_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill from legacy single-FK columns (safe: INSERT IGNORE)
INSERT IGNORE INTO user_categories (user_id, category_id)
  SELECT id, category_id FROM users WHERE category_id IS NOT NULL;
INSERT IGNORE INTO user_subcategories (user_id, subcategory_id)
  SELECT id, subcategory_id FROM users WHERE subcategory_id IS NOT NULL;

-- users: language / completion / resume status
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resume_status ENUM('none','uploaded','parsed','verified') NOT NULL DEFAULT 'none';

-- user_profiles: resume metadata
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS resume_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resume_size INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMP NULL DEFAULT NULL;

-- register_otp: carry multi-select arrays through the OTP step
ALTER TABLE register_otp
  ADD COLUMN IF NOT EXISTS category_ids JSON DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subcategory_ids JSON DEFAULT NULL;
