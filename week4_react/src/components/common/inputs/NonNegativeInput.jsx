// ============================================================================
// File: NonNegativeInput.jsx
// Description: Centralized numeric input component that blocks negative signs
//              and converts negative entries via Math.abs on blur.
// ============================================================================
import React from 'react';

/**
 * Component: NonNegativeInput
 * Description: Reusable numeric input wrapper enforcing non-negative values.
 *              Intercepts onKeyDown to block '-' and 'e', and auto-corrects
 *              negative inputs via Math.abs on blur.
 * Props:
 *   - value / defaultValue: Input numeric value.
 *   - onChange: Change event handler.
 *   - onBlur: Blur event handler receiving sanitized value.
 *   - min: Minimum allowed numeric value (default 0).
 *   - step: Stepping increment (default "0.01").
 */
export default function NonNegativeInput({ min = 0, step = "0.01", onBlur, onKeyDown, ...props }) {
    const handleBlur = (e) => {
        const parsed = parseFloat(e.target.value);
        let sanitized = min;
        if (!isNaN(parsed)) {
            sanitized = parsed < 0 ? Math.abs(parsed) : parsed;
        }
        e.target.value = sanitized;
        props.onChange?.(e);
        onBlur?.(e, sanitized);
    };

    const handleKeyDown = (e) => {
        if (e.key === '-' || e.key === 'e') {
            e.preventDefault();
        }
        onKeyDown?.(e);
    };

    return (
        <input
            type="number"
            step={step}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...props}
        />
    );
}
