// ============================================================================
// File: Toast.jsx
// Description: Renders a temporary auto-dismissing feedback banner.
// ============================================================================
import { useEffect } from 'react';

function Toast({ message, type, onClose }) {
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