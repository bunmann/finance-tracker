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
