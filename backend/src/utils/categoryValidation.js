const { query } = require('../db');

/**
 * Validates categoryId + subcategoryId pair against `categories` / `subcategories`.
 */
async function validateCategoryPair(categoryId, subcategoryId, { requirePair = true } = {}) {
  const catId = categoryId ? Number(categoryId) : null;
  const subId = subcategoryId ? Number(subcategoryId) : null;

  if (!requirePair) {
    if (!catId && !subId) return { ok: true, categoryId: null, subcategoryId: null };
    if (catId && !subId) return { ok: false, message: 'Subcategory is required when category is selected' };
    if (!catId && subId) return { ok: false, message: 'Category is required when subcategory is selected' };
  } else if (!catId || !subId) {
    return { ok: false, message: 'Category and subcategory are required' };
  }

  const categories = await query(
    `SELECT id FROM categories WHERE id = ? AND status = 'active'`,
    [catId]
  );
  if (!categories.length) {
    return { ok: false, message: 'Invalid category selected' };
  }

  const subcategories = await query(
    `SELECT id, category_id FROM subcategories WHERE id = ? AND status = 'active'`,
    [subId]
  );
  if (!subcategories.length) {
    return { ok: false, message: 'Invalid subcategory selected' };
  }

  if (Number(subcategories[0].category_id) !== catId) {
    return { ok: false, message: 'Subcategory does not belong to the selected category' };
  }

  return { ok: true, categoryId: catId, subcategoryId: subId };
}

/**
 * Validates a multi-select of categories (max N) + subcategories.
 * - de-duplicates and coerces ids to numbers
 * - every category must exist and be active
 * - every subcategory must be active AND belong to one of the selected categories
 * Returns { ok, categoryIds: number[], subcategoryIds: number[] } or { ok:false, message }.
 */
async function validateCategoryList(categoryIds, subcategoryIds, { max = 5, requireAtLeastOne = true } = {}) {
  const toIdArray = (val) =>
    [...new Set(
      (Array.isArray(val) ? val : [])
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
    )];

  const catIds = toIdArray(categoryIds);
  const subIds = toIdArray(subcategoryIds);

  if (requireAtLeastOne && catIds.length === 0) {
    return { ok: false, message: 'Please select at least one category' };
  }
  if (catIds.length > max) {
    return { ok: false, message: `You can select at most ${max} categories` };
  }
  if (catIds.length === 0) {
    return { ok: true, categoryIds: [], subcategoryIds: [] };
  }

  const catPlaceholders = catIds.map(() => '?').join(',');
  const cats = await query(
    `SELECT id FROM categories WHERE id IN (${catPlaceholders}) AND status = 'active'`,
    catIds
  );
  if (cats.length !== catIds.length) {
    return { ok: false, message: 'One or more selected categories are invalid' };
  }

  let validSubIds = [];
  if (subIds.length) {
    const subPlaceholders = subIds.map(() => '?').join(',');
    const subs = await query(
      `SELECT id, category_id FROM subcategories
       WHERE id IN (${subPlaceholders}) AND status = 'active'`,
      subIds
    );
    if (subs.length !== subIds.length) {
      return { ok: false, message: 'One or more selected subcategories are invalid' };
    }
    const catSet = new Set(catIds);
    for (const s of subs) {
      if (!catSet.has(Number(s.category_id))) {
        return { ok: false, message: 'A subcategory does not belong to any selected category' };
      }
    }
    validSubIds = subs.map((s) => Number(s.id));
  }

  return { ok: true, categoryIds: catIds, subcategoryIds: validSubIds };
}

module.exports = { validateCategoryPair, validateCategoryList };
