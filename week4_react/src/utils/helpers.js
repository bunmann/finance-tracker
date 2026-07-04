// ============================================================================
// File: helpers.js
// Description: Shared utility helper functions for the frontend.
// ============================================================================

/**
 * Sorts a list of categories alphabetically by name (case-insensitive),
 * placing "Uncategorized" at the very end of the list.
 * @param {Array} categoriesList 
 * @returns {Array} Sorted list of categories
 */
export function sortCategories(categoriesList) {
    if (!Array.isArray(categoriesList)) return [];
    return [...categoriesList].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase().trim();
        const nameB = (b.name || '').toLowerCase().trim();
        
        if (nameA === 'uncategorized') return 1;
        if (nameB === 'uncategorized') return -1;
        
        return nameA.localeCompare(nameB);
    });
}

/**
 * Formats lastRefreshed date to a human relative string like 'just now' or 'Xm ago'.
 * @param {Date|string|null} lastRefreshed 
 * @returns {string|null} Relative refresh string or null
 */
export function getRefreshLabel(lastRefreshed) {
    if (!lastRefreshed) return null;
    const diffMs = Date.now() - new Date(lastRefreshed).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    return diffMin < 1 ? 'just now' : `${diffMin}m ago`;
}

/**
 * Returns color class 'gain-text' or 'loss-text' based on numeric value.
 * @param {number|string|null} value 
 * @returns {string} styling class name
 */
export function getPnlClass(value) {
    if (value === null || value === undefined) return '';
    return parseFloat(value) >= 0 ? 'gain-text' : 'loss-text';
}
