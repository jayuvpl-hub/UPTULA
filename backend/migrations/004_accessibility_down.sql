-- Rollback 004: Remove accessibility fields from user_profiles

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS has_disability,
  DROP COLUMN IF EXISTS disability_details,
  DROP COLUMN IF EXISTS accommodation_needs;
