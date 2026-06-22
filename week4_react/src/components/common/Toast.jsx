// ============================================================================
// File: Toast.jsx
// Description: Renders a temporary auto-dismissing feedback banner.
// ============================================================================
import { useEffect } from 'react';

/**
 * Component: Toast
 * Description: Renders a self-dismissing feedback banner that informs the user
 *              of backend actions (creation success, errors, warnings).
 * Props:
 *   - message (String): Display message text inside the banner.
 *   - type (String): CSS class style variant ('success', 'error', 'warning').
 *   - onClose (Function): Parent callback function to clear the toast from App state.
 */
function Toast({ message, type, onClose }) {
    /**
     * Hook: useEffect (Auto-Dismiss Timer)
     * Description: Starts a 3-second timer on mount that invokes the parent onClose
     *              state reset callback, clearing the active timeout on component unmount.
     */
    useEffect(() => {
        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        // Cleanup: cancel timer if Toast unmounts early
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}

export default Toast;