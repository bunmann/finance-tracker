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
    useEffect(() => {
        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        // Cleanup: cancel timer if Toast unmounts early
        return () => clearTimeout(timer);
    }, [message, onClose]);

    // Map toast type to corresponding material icon name
    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            default:
                return 'info';
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="material-symbols-outlined toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose} aria-label="Close notification">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
    );
}

export default Toast;