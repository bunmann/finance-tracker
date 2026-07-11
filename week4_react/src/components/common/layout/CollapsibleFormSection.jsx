// ============================================================================
// File: CollapsibleFormSection.jsx
// Description: Reusable collapsible container for sliding large entry and import
//              forms in and out of view to save vertical screen space.
// ============================================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accordionCollapse } from '../../../utils/animations';

/**
 * Component: CollapsibleFormSection
 * Description: Renders a prominent toggle bar that expands/collapses wrapped form components.
 * Props:
 *   - title (String): Label shown when collapsed (default: 'Show Add & Import Tools').
 *   - activeTitle (String): Label shown when expanded (default: 'Hide Add & Import Tools').
 *   - icon (String): Material icon shown when collapsed.
 *   - activeIcon (String): Material icon shown when expanded.
 *   - defaultOpen (Boolean): Whether the section starts opened or closed on load.
 *   - children (ReactNode): Wrapped forms or upload components.
 *   - className (String): Optional extra CSS class.
 */
function CollapsibleFormSection({
    title = 'Show Add & Import Tools',
    activeTitle = 'Hide Add & Import Tools',
    icon = 'add_circle',
    activeIcon = 'remove_circle',
    defaultOpen = false,
    children,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`collapsible-form-section ${className} ${isOpen ? 'is-open' : 'is-closed'}`}>
            <div className="collapsible-form-header-bar">
                <button
                    type="button"
                    className={`btn collapsible-toggle-btn ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="toggle-left">
                        <span className="material-symbols-outlined toggle-icon">
                            {isOpen ? activeIcon : icon}
                        </span>
                        <span className="toggle-label">{isOpen ? activeTitle : title}</span>
                    </div>
                    <div className="toggle-right">
                        <span className="toggle-hint">{isOpen ? 'Hide Tools' : 'Show Tools'}</span>
                        <span 
                            className="material-symbols-outlined toggle-chevron" 
                            style={{
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            expand_more
                        </span>
                    </div>
                </button>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="collapsible-form-content"
                        variants={accordionCollapse}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="collapsible-form-inner">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CollapsibleFormSection;
