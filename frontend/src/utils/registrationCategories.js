import {
  fetchJobCategories,
  fetchSubcategoriesByCategoryId,
  fetchSubcategoriesFromAdminTree,
} from './jobCategoriesApi';

export async function fetchRegistrationCategories() {
  return fetchJobCategories();
}

export async function fetchRegistrationSubcategories(categoryId, token) {
  if (!categoryId) return [];
  
  // Primary method: Try the standard subcategories endpoint (includes fallback to full categories list)
  let subcategories = await fetchSubcategoriesByCategoryId(categoryId);
  if (subcategories.length > 0) {
    return subcategories;
  }
  
  // Alternative method: Try the admin tree endpoint if available
  if (token) {
    console.log('[fetchRegistrationSubcategories] Trying admin tree endpoint');
    subcategories = await fetchSubcategoriesFromAdminTree(categoryId, token);
    if (subcategories.length > 0) {
      return subcategories;
    }
  }
  
  return [];
}

export async function fetchAdminRegistrationTree(token) {
  const { API_BASE_URL } = await import('../config/api');
  const res = await fetch(`${API_BASE_URL}/api/categories/admin/tree?includeInactive=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load registration categories');
  }
  const data = await res.json();
  return data.categories || [];
}
