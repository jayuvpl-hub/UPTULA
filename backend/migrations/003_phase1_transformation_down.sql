-- Rollback for Migration 003 (Phase 1 platform transformation)
-- Drops only the columns/tables this migration added. Legacy single-FK columns
-- (users.category_id / users.subcategory_id) are left intact.

DROP TABLE IF EXISTS user_subcategories;
DROP TABLE IF EXISTS user_categories;

ALTER TABLE register_otp
  DROP COLUMN IF EXISTS category_ids,
  DROP COLUMN IF EXISTS subcategory_ids;

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS resume_name,
  DROP COLUMN IF EXISTS resume_size,
  DROP COLUMN IF EXISTS resume_uploaded_at;

ALTER TABLE users
  DROP COLUMN IF EXISTS preferred_language,
  DROP COLUMN IF EXISTS profile_completion,
  DROP COLUMN IF EXISTS resume_url,
  DROP COLUMN IF EXISTS resume_status;

ALTER TABLE categories
  DROP INDEX IF EXISTS idx_categories_type;
ALTER TABLE categories
  DROP COLUMN IF EXISTS type;
