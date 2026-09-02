# User registration categories schema

## Tables

### `categories`
| Column | Type |
|--------|------|
| id | BIGINT UNSIGNED PK |
| name | VARCHAR(150) UNIQUE |
| slug | VARCHAR(150) UNIQUE |
| description | TEXT NULL |
| status | ENUM('active','inactive') |
| sort_order | INT |
| created_at, updated_at | TIMESTAMP |

### `subcategories`
| Column | Type |
|--------|------|
| id | BIGINT UNSIGNED PK |
| category_id | FK → categories.id ON DELETE CASCADE |
| name | VARCHAR(150) |
| slug | VARCHAR(180) UNIQUE |
| description | TEXT NULL |
| status | ENUM('active','inactive') |
| sort_order | INT |
| created_at, updated_at | TIMESTAMP |

Unique per category: `(category_id, name)`

### `users` (extended)
| Column | Type |
|--------|------|
| category_id | BIGINT UNSIGNED NULL FK |
| subcategory_id | BIGINT UNSIGNED NULL FK |

### `register_otp` (extended)
| Column | Type |
|--------|------|
| category_id | BIGINT UNSIGNED NULL |
| subcategory_id | BIGINT UNSIGNED NULL |

## Legacy
`registration_categories` / `registration_subcategories` / `registration_*_id` columns may still exist on older databases; startup migration copies values into the new columns when possible.

## Seed
- Data file: `src/db/seeders/categorySeedData.json` (20 categories, 200+ subcategories)
- Auto-seed when `categories` table is empty on server start
- Force reseed: `npm run seed:categories` or `SEED_CATEGORIES=force`

## API
- Public: `GET /api/categories/categories` (optional `?type=technical|non_technical`), `GET /api/categories/categories/:id/subcategories`
- Legacy alias: `/api/registration/*` (same router)
- Admin: `/api/categories/admin/*`

## Phase 1 (migration 003 / src/db/phase1Schema.js)
- `categories.type` ENUM('technical','non_technical')
- `user_categories`, `user_subcategories` junction tables (multi-select, max 5 categories)
- `users`: `preferred_language`, `profile_completion`, `resume_url`, `resume_status`
- `user_profiles`: `resume_name`, `resume_size`, `resume_uploaded_at`
- `register_otp`: `category_ids`, `subcategory_ids` (JSON)
- Legacy single `users.category_id` / `subcategory_id` kept as the "primary" selection and backfilled into junctions once.
