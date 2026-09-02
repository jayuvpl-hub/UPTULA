/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slugified text
 */
export function createSlug(text) {
    if (!text) return '';
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w\-]+/g, '')        // Remove all non-word chars
        .replace(/\-\-+/g, '-')          // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')              // Trim hyphens from start
        .replace(/-+$/, '');             // Trim hyphens from end
}

/**
 * Extract job ID from slug or return slug as-is if it's numeric
 * @param {string} slug - The slug or ID
 * @returns {string} - The ID (if numeric) or slug
 */
export function extractJobId(slug) {
    if (!slug) return '';
    // If it's a numeric ID, return as-is
    if (/^\d+$/.test(slug)) {
        return slug;
    }
    // Otherwise, it's a slug - we'll need to query by slug
    return slug;
}
