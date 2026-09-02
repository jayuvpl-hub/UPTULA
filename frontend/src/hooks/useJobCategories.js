import { useEffect, useState } from 'react';
import {
  fetchJobCategories,
  fetchSubcategoriesByCategoryId,
  findCategory,
} from '../utils/jobCategoriesApi';

/**
 * Loads categories from GET /api/categories/categories.
 * When selectedCategoryKey is set (category id or name), loads subcategories from
 * GET /api/categories/categories/:categoryId/subcategories
 */
export function useJobCategories(selectedCategoryKey = null) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchJobCategories();
        if (!cancelled) {
          setCategories(list);
          setError(null);
        }
      } catch (err) {
        console.error('[useJobCategories]', err);
        if (!cancelled) {
          setCategories([]);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategoryKey) {
      setSubcategories([]);
      setSubcategoriesLoading(false);
      return undefined;
    }

    const cat = findCategory(categories, selectedCategoryKey);
    const categoryId = cat?.id || Number(selectedCategoryKey);
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoriesLoading(false);
      return undefined;
    }

    let cancelled = false;
    if (cat?.subcategories?.length) {
      setSubcategories(cat.subcategories);
    } else {
      setSubcategories([]);
    }
    setSubcategoriesLoading(true);

    (async () => {
      try {
        let list = await fetchSubcategoriesByCategoryId(categoryId);
        if (!list.length && cat?.subcategories?.length) {
          list = cat.subcategories;
        }
        if (!cancelled) setSubcategories(list);
      } catch (err) {
        console.error('[useJobCategories] subcategories', err);
        if (!cancelled) {
          setSubcategories(cat?.subcategories?.length ? cat.subcategories : []);
        }
      } finally {
        if (!cancelled) setSubcategoriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryKey, categories]);

  return {
    categories,
    subcategories,
    loading,
    subcategoriesLoading,
    error,
    findCategory: (key) => findCategory(categories, key),
  };
}

export default useJobCategories;
