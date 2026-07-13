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

/**
 * Calculates total elapsed calendar months from the earliest recorded transaction date
 * up to the current date. Returns a minimum of 1 month.
 * @param {Array} transactions List of user transaction objects containing a .date field (YYYY-MM-DD)
 * @returns {number} Elapsed months count (minimum 1)
 */
export function calculateElapsedMonths(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return 1;
    }

    let earliestDate = null;
    for (const t of transactions) {
        if (!t.date) continue;
        const parts = t.date.split('-').map(Number);
        if (parts.length < 2 || !parts[0] || !parts[1]) continue;
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2] || 1);
        if (!earliestDate || dateObj < earliestDate) {
            earliestDate = dateObj;
        }
    }

    if (!earliestDate) {
        return 1;
    }

    const now = new Date();
    const monthsDiff = (now.getFullYear() - earliestDate.getFullYear()) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1;
    return Math.max(1, monthsDiff);
}

/**
 * Calculates the budget scaling multiplier based on active periodMode and transaction history.
 * @param {string} periodMode Current period filter ('month', 'year', 'all')
 * @param {number} month Selected month number (0-12)
 * @param {number} year Selected year number (YYYY or 0)
 * @param {Array} transactions List of user transactions for All-Time elapsed months calculation
 * @returns {number} Scaling multiplier (1 for month, YTD months for current year, 12 for past year, elapsed months for all-time)
 */
export function getPeriodMultiplier(periodMode, month, year, transactions = []) {
    if (periodMode === 'year' || (month === 0 && year > 0)) {
        const now = new Date();
        const currentYear = now.getFullYear();
        if (year === currentYear) {
            return Math.max(1, now.getMonth() + 1);
        }
        return 12;
    }
    if (periodMode === 'all' || (month === 0 && year === 0)) {
        return calculateElapsedMonths(transactions);
    }
    return 1;
}
