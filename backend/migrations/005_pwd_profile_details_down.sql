-- Rollback 005: Move accessibility fields from pwd_profile_details back onto user_profiles.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS has_disability TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disability_details TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accommodation_needs TEXT DEFAULT NULL;

-- Copy data back onto user_profiles.
UPDATE user_profiles up
JOIN pwd_profile_details pwd ON pwd.user_id = up.user_id
SET
  up.has_disability = pwd.has_disability,
  up.disability_details = pwd.disability_details,
  up.accommodation_needs = pwd.accommodation_needs;

DROP TABLE IF EXISTS pwd_profile_details;
