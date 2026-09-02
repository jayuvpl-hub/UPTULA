-- Migration 004: Add accessibility fields to user_profiles
-- These three columns are always optional and must never affect profile completion %.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS has_disability TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disability_details TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accommodation_needs TEXT DEFAULT NULL;
