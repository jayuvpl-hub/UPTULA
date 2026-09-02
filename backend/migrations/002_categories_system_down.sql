-- Rollback 002 (manual review recommended if users have category_id set)

ALTER TABLE users DROP FOREIGN KEY fk_users_category;
ALTER TABLE users DROP FOREIGN KEY fk_users_subcategory;
ALTER TABLE users DROP COLUMN category_id;
ALTER TABLE users DROP COLUMN subcategory_id;

ALTER TABLE register_otp DROP COLUMN category_id;
ALTER TABLE register_otp DROP COLUMN subcategory_id;

DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
