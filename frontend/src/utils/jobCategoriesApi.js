import { API_BASE_URL } from '../config/api';

/** GET /api/categories/categories */
export const CATEGORIES_ENDPOINT = '/api/categories/categories';

/** GET /api/categories/categories/:categoryId/subcategories */
export const subcategoriesEndpoint = (categoryId) =>
  `/api/categories/categories/${categoryId}/subcategories`;

function getApiBases() {
  const bases = [];
  const remote = process.env.REACT_APP_REMOTE_API_TARGET
    ? String(process.env.REACT_APP_REMOTE_API_TARGET).replace(/\/$/, '')
    : null;

  // Use the same resolved API base as the rest of the app (api.js).
  // Do not hardcode localhost here — that caused live deployments to call :5000.
  const base = String(API_BASE_URL ?? '').replace(/\/$/, '');
  if (base) bases.push(base);
  else bases.push('');

  if (remote && !bases.includes(remote)) {
    bases.push(remote);
  }

  return [...new Set(bases)];
}

async function fetchFromBases(path, parseResponse) {
  const bases = getApiBases();
  let lastError = null;

  for (const base of bases) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;

      const data = await res.json();
      const result = parseResponse(data);
      if (result != null) return result;
    } catch (err) {
      lastError = err;
      console.warn('[categories API]', url, err?.message || err);
    }
  }

  throw lastError || new Error(`Failed to fetch ${path}`);
}

export function normalizeCategoryRow(row) {
  if (!row) return null;
  const id = row.id ?? row.category_id ?? row.categoryId ?? row.subcategory_id ?? row.subcategoryId;
  const categoryId = row.category_id ?? row.categoryId;
  return {
    id,
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    status: row.status,
    sortOrder: row.sort_order ?? row.sortOrder,
    categoryId: categoryId != null ? Number(categoryId) : undefined,
  };
}

export function normalizeCategoriesList(list) {
  return (Array.isArray(list) ? list : [])
    .map((cat) => {
      const normalized = normalizeCategoryRow(cat);
      if (!normalized) return null;
      const nested = cat.subcategories || cat.subCategories || [];
      normalized.subcategories = nested
        .map((sub) => normalizeCategoryRow(sub))
        .filter(Boolean);
      return normalized;
    })
    .filter(Boolean);
}
function pickSubcategoryList(data, categoryId) {
  const id = Number(categoryId);
  if (Array.isArray(data)) return data;

  // Direct array or object with subcategories field
  if (Array.isArray(data?.subcategories)) return data.subcategories;
  if (Array.isArray(data?.subCategories)) return data.subCategories;
  if (Array.isArray(data?.sub_categories)) return data.sub_categories;

  // Wrapped in data field
  if (Array.isArray(data?.data)) {
    if (data.data.length > 0 && data.data[0]?.id) return data.data; // Array of subcategories
  }
  if (Array.isArray(data?.data?.subcategories)) return data.data.subcategories;
  if (Array.isArray(data?.data?.subCategories)) return data.data.subCategories;
  if (Array.isArray(data?.data?.sub_categories)) return data.data.sub_categories;

  // Category wrapper with matching ID
  const category = data?.category && Number(data.category.id) === id ? data.category : null;
  if (Array.isArray(category?.subcategories)) return category.subcategories;
  if (Array.isArray(category?.subCategories)) return category.subCategories;
  if (Array.isArray(category?.sub_categories)) return category.sub_categories;

  // Categories array with matching category
  const selectedCategory = Array.isArray(data?.categories)
    ? data.categories.find((cat) => Number(cat.id) === id)
    : null;
  if (Array.isArray(selectedCategory?.subcategories)) return selectedCategory.subcategories;
  if (Array.isArray(selectedCategory?.subCategories)) return selectedCategory.subCategories;
  if (Array.isArray(selectedCategory?.sub_categories)) return selectedCategory.sub_categories;

  return null;
}
// In-memory + sessionStorage caches so the navbar Jobs mega-menu loads instantly
// after the first fetch (no repeated network round-trips on every page/Header mount).
let _categoriesCache = null;
let _categoriesPromise = null;
const _subsCache = {};

function readSessionCategories() {
  try {
    const raw = sessionStorage.getItem('jobCategoriesCache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (_) {
    return null;
  }
}

/** GET /api/categories/categories — active categories with nested subcategories (cached) */
export async function fetchJobCategories() {
  if (_categoriesCache) return _categoriesCache;
  const session = readSessionCategories();
  if (session) {
    _categoriesCache = session;
    return session;
  }
  // De-dupe concurrent callers (e.g. multiple Header mounts) onto one request.
  if (_categoriesPromise) return _categoriesPromise;

  _categoriesPromise = (async () => {
    const list = await fetchFromBases(CATEGORIES_ENDPOINT, (data) => {
      const normalized = normalizeCategoriesList(data.categories || []);
      return normalized.length > 0 ? normalized : null;
    });
    _categoriesCache = list;
    try { sessionStorage.setItem('jobCategoriesCache', JSON.stringify(list)); } catch (_) {}
    _categoriesPromise = null;
    return list;
  })().catch((err) => {
    _categoriesPromise = null;
    throw err;
  });

  return _categoriesPromise;
}

/** GET /api/categories/categories/:categoryId/subcategories (cached per category) */
export async function fetchSubcategoriesByCategoryId(categoryId) {
  const id = Number(categoryId);
  if (!id) return [];
  if (_subsCache[id]) return _subsCache[id];

  try {
    // Try the specific endpoint first
    const subs = await fetchFromBases(subcategoriesEndpoint(id), (data) => {
      const subcategories = pickSubcategoryList(data, id);
      if (!Array.isArray(subcategories)) return null;
      return subcategories
        .map((sub) => normalizeCategoryRow(sub))
        .filter(Boolean);
    });
    _subsCache[id] = subs;
    return subs;
  } catch (err) {
    console.warn('[subcategories API] Specific endpoint failed, trying fallback', subcategoriesEndpoint(id), err?.message || err);
    
    // FALLBACK: Try fetching from the full categories list
    try {
      const allCategories = await fetchJobCategories();
      const category = findCategory(allCategories, id);
      if (category?.subcategories?.length) {
        console.log('[subcategories API] Successfully fetched from categories list', id);
        _subsCache[id] = category.subcategories;
        return category.subcategories;
      }
    } catch (fallbackErr) {
      console.error('[subcategories API] Fallback also failed', fallbackErr?.message || fallbackErr);
    }
    
    return [];
  }
}

export function findCategory(categories, key) {
  if (!key || !Array.isArray(categories)) return null;
  const k = String(key).trim();
  const asNum = Number(k);
  return (
    categories.find(
      (c) =>
        String(c.id) === k ||
        (!Number.isNaN(asNum) && Number(c.id) === asNum) ||
        c.name === k ||
        c.slug === k
    ) || null
  );
}

export function getSubcategoriesForCategory(categories, categoryKey) {
  const cat = findCategory(categories, categoryKey);
  return cat?.subcategories || [];
}

export async function getSubcategoriesForCategoryAsync(categories, categoryKey) {
  const cat = findCategory(categories, categoryKey);
  if (cat?.subcategories?.length) return cat.subcategories;
  if (!cat?.id) return [];
  return fetchSubcategoriesByCategoryId(cat.id);
}

/**
 * Alternative: Fetch subcategories from admin tree endpoint
 * Can be used when the standard endpoint fails
 */
export async function fetchSubcategoriesFromAdminTree(categoryId, token) {
  const id = Number(categoryId);
  if (!id) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/admin/tree?includeInactive=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Admin tree endpoint returned ${response.status}`);
    }

    const data = await response.json();
    const allCategories = normalizeCategoriesList(data.categories || []);
    const category = findCategory(allCategories, id);
    
    if (category?.subcategories?.length) {
      console.log('[admin tree API] Successfully fetched subcategories for category', id);
      return category.subcategories;
    }
    
    return [];
  } catch (err) {
    console.warn('[admin tree API] Failed to fetch subcategories', err?.message || err);
    return [];
  }
}
