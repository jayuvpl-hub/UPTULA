-- Rollback 001: Remove registration category feature (preserves user rows; clears FK refs)

ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_registration_category;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_registration_subcategory;

ALTER TABLE users DROP COLUMN IF EXISTS registration_category_id;
ALTER TABLE users DROP COLUMN IF EXISTS registration_subcategory_id;

ALTER TABLE register_otp DROP COLUMN IF EXISTS registration_category_id;
ALTER TABLE register_otp DROP COLUMN IF EXISTS registration_subcategory_id;

DROP TABLE IF EXISTS registration_subcategories;
DROP TABLE IF EXISTS registration_categories;
