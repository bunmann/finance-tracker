// ============================================================================
// File: FilterSidebar.jsx
// Description: Reusable sidebar form component for quantitative parameters,
//              range sliders, checkboxes, and scan action triggers.
// ============================================================================
import React from 'react';

/**
 * Component: FilterSidebar
 * Description: Generates a modular sidebar filter panel from parameter configurations.
 * Props:
 *   - title (string): Header text for the sidebar form.
 *   - sliders (Array): List of slider config objects:
 *       { id, label, value, min, max, step, unit, onChange }
 *   - checkboxes (Array): List of checkbox config objects:
 *       { id, label, checked, onChange }
 *   - onSubmit (Function): Form submit handler.
 *   - loading (boolean): Whether action is currently running.
 *   - buttonText (string): Text displayed on action button.
 *   - loadingText (string): Text displayed when loading is true.
 *   - buttonIcon (string): Material symbol icon name for the button.
 */
function FilterSidebar({
    title = 'Parameters',
    sliders = [],
    checkboxes = [],
    onSubmit,
    loading = false,
    buttonText = 'Apply Filters',
    loadingText = 'Processing...',
    buttonIcon = 'tune',
    infoMessage = null
}) {
    return (
        <form className="screener-sidebar" onSubmit={onSubmit}>
            <h2>{title}</h2>

            {infoMessage && (
                <div style={{ padding: '12px', backgroundColor: 'var(--surface-container-high)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }}>info</span>
                        <span>{infoMessage}</span>
                    </div>
                </div>
            )}

            {sliders.map((s) => (
                <div key={s.id} className="slider-group">
                    <div className="slider-header">
                        <span className="slider-label">{s.label}</span>
                        <span className="slider-value">
                            {s.value}{s.unit || ''}
                        </span>
                    </div>
                    <input
                        type="range"
                        className="range-slider"
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        value={s.value}
                        onChange={(e) => s.onChange(e.target.value)}
                        disabled={loading}
                    />
                </div>
            ))}

            {checkboxes.map((c) => (
                <label key={c.id} className="competence-toggle">
                    <input
                        type="checkbox"
                        checked={c.checked}
                        onChange={(e) => c.onChange(e.target.checked)}
                        disabled={loading}
                    />
                    <span>{c.label}</span>
                </label>
            ))}

            <button type="submit" className="btn-scan" disabled={loading}>
                <span className="material-symbols-outlined">{buttonIcon}</span>
                <span>{loading ? loadingText : buttonText}</span>
            </button>
        </form>
    );
}

export default FilterSidebar;
