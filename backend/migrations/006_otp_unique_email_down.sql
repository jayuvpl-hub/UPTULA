-- Rollback 006: Drop unique-email constraints for OTP tables.

ALTER TABLE register_otp
  DROP INDEX uq_register_otp_email;

ALTER TABLE password_resets
  DROP INDEX uq_password_resets_email;
