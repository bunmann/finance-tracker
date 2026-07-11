// ============================================================================
// File: src/utils/authSession.js
// Description: Utility functions for securely managing remembered login emails
//              with strict 30-day expiration checks.
// ============================================================================

const REMEMBER_EMAIL_KEY = 'remembered_email';
const REMEMBER_EXP_KEY = 'remembered_email_exp';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Function: saveRememberedEmail
 * Description: Stores the user's verified email address alongside an expiration timestamp
 *              set to exactly 30 days from now.
 * Parameters:
 *   - email (string): The verified email address to remember.
 */
export function saveRememberedEmail(email) {
    if (!email) return;
    localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    localStorage.setItem(REMEMBER_EXP_KEY, (Date.now() + THIRTY_DAYS_MS).toString());
}

/**
 * Function: getRememberedEmail
 * Description: Retrieves the remembered email if present and unexpired. If the 30-day
 *              window has passed, clears the storage keys and returns null.
 * Returns:
 *   - string | null: The unexpired email address, or null if expired/absent.
 */
export function getRememberedEmail() {
    const email = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const exp = localStorage.getItem(REMEMBER_EXP_KEY);

    if (!email || !exp) {
        return null;
    }

    if (Date.now() >= Number(exp)) {
        clearRememberedEmail();
        return null;
    }

    return email;
}

/**
 * Function: clearRememberedEmail
 * Description: Purges remembered email and expiration keys from localStorage.
 */
export function clearRememberedEmail() {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    localStorage.removeItem(REMEMBER_EXP_KEY);
}
