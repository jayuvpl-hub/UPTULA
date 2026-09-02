-- Migration 006: Enforce one active OTP row per email for both registration and password reset flows.
-- This supports the atomic one-row-per-email upsert used by the OTP generator.

ALTER TABLE register_otp
  ADD UNIQUE KEY uq_register_otp_email (email);

ALTER TABLE password_resets
  ADD UNIQUE KEY uq_password_resets_email (email);
