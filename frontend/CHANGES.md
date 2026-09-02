# CHANGES.md — Job Portal Fixes & Audit

## Latest round — navbar color + search dropdown fix
- **Navbar background** set to **`#0b4621`** (dark green) across all states in `src/Components/Header.js`; desktop nav links/hamburger switched to white (`#fff`) with a light-green hover (`#86efac`) for contrast. The mobile slide-in drawer keeps its white background + green links (ID-scoped CSS overrides), so it stays readable.
- **Search autosuggest dropdown was clipped/hidden under the hero** on the **Jobs** and **Companies** pages — the hero band had `overflow: hidden`. Changed `.njk-hero` / `.cmp-hero` to `overflow: visible` (glow contained via `border-radius: inherit` on the `::after`) and raised the hero stacking context (`z-index: 30`) so the AI suggestions now overlay the content below instead of being cut off. (`src/Pages/AllJobs.js`, `src/Pages/Companies.js`)
- Rebuilt `frontend-build.zip` + `backend.zip`.
- Note: if the logo (`/assets/img/Uptula.png`) has low contrast on the new dark-green bar, consider a white/light logo variant.

---

> Theme preserved throughout: primary green `#16a34a` (components) / `#26ae61` (bootsnav nav links).
> ⚠️ **Deployment note:** the frontend (dev **and** prod) proxies all `/api` calls to the **live `https://uptula.com` backend** (`.env.local` + `src/setupProxy.js`). **Frontend** changes appear after deploying the build; **backend** changes (in `/backend`) only take effect after the backend is **redeployed** to the live server.

---

## STEP 2 — Build / live error check
- `npm run build` (CRA) → **Compiled successfully**, "build folder is ready to be deployed".
- ESLint across all changed files → **0 errors** (only pre-existing `jsx-a11y/anchor-is-valid` and `react-hooks/exhaustive-deps` **warnings**, which were already present).
- Backend route files pass `node --check` (syntax valid).
- Note: a dev server was already running on port 3000 during this session.

---

## STEP 3 — Fixes

### FIX 1 — Home page search ✅
- Desktop hero (`src/Pages/Home.js`) and mobile/guest hero (`src/Components/GuestMobileHero.js`) both submit `keyword + category + location` and navigate to `/jobs?q=…&category=…&city=…`.
- `src/Pages/AllJobs.js` reads those params, calls `GET /api/jobs?…`, shows a **loading** state and a **"No results found"** empty state.
- Responsive: hero stacks on mobile; guest mobile hero is full-width.

### FIX 2 — Navbar "Jobs" mega-menu on hover ✅  (`src/Components/Header.js`)
- Hover-triggered **two-pane mega menu** (categories left, sub-categories right), fetched from `GET /api/categories/categories` and `…/:id/subcategories` (lazy-loaded + cached).
- Category → `/jobs?category=<name>`; sub-category → `/jobs?category=<name>&subcategory=<name>`. `AllJobs` already filters on these.
- Mobile: collapsible **accordion** inside the hamburger menu.
- Styled to match the existing nav (`#6b797c` text, `#26ae61` hover, `24px 15px` padding).

### FIX 3 — Employer Boolean search ✅  (`backend/src/routes/search.routes.js`)
- **Root cause:** SQL selected `up.first_name` / `up.last_name`, which don't exist (`user_profiles` has `name`); error *"Unknown column 'up.first_name'"*. Also `users` has no `experience` column.
- Rewrote the query: uses `up.name`; AND/OR/NOT logic works via the **Must-Have / Must-Not tag inputs** *and* **inline operators** typed in the keyword box (`react AND node NOT php`). `COALESCE(col,'')` prevents NULLs from wrongly dropping rows in NOT clauses. The broken `experience` filter is now a safe no-op.
- Frontend Boolean UI (`src/Employer/BooleanSearch.js`) already had AND/OR/NOT tag inputs + hints and is responsive — no change needed.

### FIX 4 — Job listing redesign (Naukri-style) ✅  (`src/Pages/AllJobs.js`)
- Left filter sidebar (Experience, Salary, Job Type, Location, Industry/Category + Sub-category, Date Posted, active-count + Clear-all).
- Job cards: title (clickable), company name, experience, salary, location, skill chips (+N more), posted-ago, **Save/bookmark** (existing `WishlistButton`), **Apply** button, description snippet.
- Pagination, loading skeletons, "No results found" empty state.
- Mobile: filters collapse into the existing bottom **drawer**. All original fetch/filter logic and the Apply modal preserved.

### FIX 5 — Company details redesign (Naukri-style) ✅  (`src/Pages/CompanyDetails.js`)
- Header: logo, name, verified badge, industry, size, founded, location, website.
- **Tabs:** Overview / Jobs / Reviews. Jobs tab lists **all** of the company's open roles (the old 2-job cap was removed). Reviews shows a friendly empty state (no reviews data exists).
- **Follow Company** toggle (client-side `localStorage` key `followedCompanies`).
- Fully responsive (header stacks, jobs grid 3→2→1).

### FIX 6 — Show Company Name (not employer/person name) + Company Profile Gate ✅
**Problem evidenced:** the "Your Dream Company Is Hiring" row showed person names (Abhigini Rout, Deepu Sahoo…) for employers without a company profile.

**Part A — display company name**
- `backend/src/routes/jobs.routes.js`
  - `GET /api/companies` now **INNER JOINs** `employer_profiles` and requires a non-empty `company_name`; `companyName` no longer falls back to `full_name`. (Person-only accounts disappear from listings.)
  - `GET /api/company/:id` returns the real `company_name` (neutral `"Company"` fallback, never a person name) + a `hasCompanyProfile` flag.
- `backend/src/routes/employer.routes.js` `POST /jobs` now writes the job's `company_name` from the **employer's company profile** (authoritative — never a typo/person name).
- `src/Pages/Home.js` `fetchCompanies` uses `companyName` only and filters out entries with no profile signal (industry/logo/website/size/founded/address) and no jobs — guards the section even before the backend redeploy.
- Job cards / job detail already use `jobs.company_name`, which is now always the company profile name.

**Part B — company profile gate**
- `backend/src/routes/employer.routes.js` `POST /jobs`: returns `403 { code: 'COMPANY_PROFILE_REQUIRED' }` if the employer has no company profile (with a company name). `GET /profile` now returns `hasCompanyProfile`.
- `src/context/AuthContext.js`: employer `profileData` now carries `companyProfileComplete` (uses the backend flag; lenient fallback so existing employers aren't wrongly blocked before redeploy).
- `src/Employer/AddJobs.js`: redirects to `/employer/profile?completeProfile=1` when the profile is incomplete (admins exempt; waits for profile load).
- `src/Employer/Profile.js`: shows a banner *"You must complete your Company Profile before posting jobs…"* when arriving via that redirect.
- The company profile (`/employer/profile`) already captures Company Name, Logo, Industry, Size, Description, Website, Location.

---

## STEP 4 — Home page sections audit
| Section | Status |
|---|---|
| A. Hero search bar | ✅ exists (popular-search tags = **TODO** enhancement) |
| B. Job Categories grid | ✅ "All Job Categories" |
| C. Top Companies hiring | ✅ "Your Dream Company Is Hiring" (now company-name only — FIX 6) |
| D. Recently posted jobs | ✅ "Jobs" / "Trending Jobs" |
| E. Jobs by location | ✅ "Find Jobs in Your City" |
| F. Career advice / blog | ❌ **TODO** (not present) |
| G. App download banner | ✅ "App Download Poster" |
| H. Stats counter + `/api/stats` | ❌ **TODO** (no stats endpoint/section) |
| I. Testimonials | ✅ "Success Stories" |

---

## STEP 5 — Feature audit (high level)
**Frontend**
- API calls centralized via `src/config/api.js` (`API_BASE_URL`) + dev proxy. Auth guarding present on protected pages (role checks + redirects).
- Loading/error states present on the pages touched; recommend a consistent pattern review across all dashboards.
- Employer dashboard: profile, add/manage jobs, applications, analytics, boolean search, resume scoring, referral, chat, premium, support — present.
- Candidate dashboard: profile, applied jobs, create resume, wishlist, chat — present.
- Admin + Customer Service apps mounted under `/admin/*`, `/cs/*`.

**Backend** (`backend/src/routes/*`)
- CRUD present for Jobs, Companies (employer profiles), Users/Auth, Applications, Categories, Wishlist, Chat, Premium, Referral, Resume.
- File upload (company logo, resumes/applications) working via multer + `/uploads`.
- Auth middleware (`authenticate`, `authenticateAdmin`) applied where needed.
- Input validation via `express-validator` on key POST/PUT routes.

---

## TODO (documented, not yet implemented)
1. **`GET /api/stats`** endpoint (jobs/companies/candidates/placements counts) + **animated Stats Counter** section (STEP 4-H).
2. **Career Advice / Blog** section (STEP 4-F) — can start static.
3. **Popular search tags** under the hero (STEP 4-A enhancement).
4. **Production build & deployment files** (e.g. verify `.htaccess`/SPA rewrite, env templates, deploy script) — `DEPLOYMENT_GUIDE.md`/`.htaccess` already exist; review against the new build.
5. Backend **email notification on job application** — confirm/standardize (status emails exist; new-application-to-employer notification is in-app).
6. Broaden consistent loading/empty/error states across **all** remaining pages (admin/CS panels not re-audited in depth).

---

## FIX 7 — Jobs not visible (category navigation) ✅
- **Root cause:** the navbar mega-menu and home search pass the category **name** (e.g. "Information Technology"), but jobs store a slug (`information_technology`). `AllJobs` (a) sent `category` to the backend, which does an exact `category = ?` match → 0 rows, and (b) its client-side matcher didn't normalize separators.
- Fix in `src/Pages/AllJobs.js`:
  - `category`/`subcategory` are no longer sent to the backend (matched client-side only).
  - `normalizeFilterText` now collapses spaces/underscores/hyphens, so "Information Technology" matches "information_technology".
- Result: clicking any category in the navbar mega-menu / home search now shows the matching jobs.

## Nav + Home additions ✅
- **Companies** link added to the navbar (`src/Components/Header.js`) → `/Companies` page.
- New **"How It Works" / "Land Your Dream Job in 4 Simple Steps"** section on the home page (`src/Pages/Home.js`), theme-green, fully responsive (4→2→1 columns).

## Build artifacts ✅
- `frontend-build.zip` — the production `build/` folder (run output of `npm run build`).
- `backend.zip` — updated backend source (excludes `node_modules`, `uploads`, logs, `tmp`).
- Both regenerate via `npm run build` + the project zip step.

## Round 3 — nav polish, animations, companies logic ✅
- **Navbar "Jobs"** (`src/Components/Header.js`): now a normal `.dropdown-toggle` nav link, so it renders in the **same white/bold style** as Home/Services (no more green/gray mismatch) and uses the theme's own caret. A mobile-only caret button toggles the accordion.
- **Companies page** (`src/Pages/Companies.js`): now uses the **"Your Dream Company Is Hiring"** logic — fetches jobs to compute a per-company **open-jobs count** (shown as a green pill), and hides profile-less accounts (real-company guard).
- **Interactive animations** (`src/Pages/Home.js`, via `framer-motion`):
  - "How It Works" cards now **reveal on scroll** (staggered) with a smooth hover lift.
  - New **animated Stats section** ("Powering Careers Across India") with **count-up** numbers that animate when scrolled into view, on a green gradient with glass cards.
- Rebuilt `frontend-build.zip` + `backend.zip`.

## Files changed
**Backend**
- `backend/src/routes/search.routes.js` (FIX 3)
- `backend/src/routes/jobs.routes.js` (FIX 6 A)
- `backend/src/routes/employer.routes.js` (FIX 6 A+B)

**Frontend**
- `src/Components/Header.js` (FIX 2)
- `src/Pages/AllJobs.js` (FIX 4)
- `src/Pages/CompanyDetails.js` (FIX 5)
- `src/Pages/Home.js` (FIX 6 A)
- `src/context/AuthContext.js` (FIX 6 B)
- `src/Employer/AddJobs.js` (FIX 6 B)
- `src/Employer/Profile.js` (FIX 6 B)
