// ============================================================================
// File: animations.js
// Description: Centralized dictionary of reusable Framer Motion animation variants.
//              Promotes component modularity and prevents visual/markup bloat.
// ============================================================================

/**
 * Variant: Page Transition
 * Description: Smooth slide and fade transition when switching dashboard routes.
 */
export const pageTransition = {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
    transition: { duration: 0.22, ease: "easeInOut" }
};

/**
 * Variant: Fade In Up (Spring physics)
 * Description: Vertical slide and fade entrance for cards and header texts.
 */
export const fadeInUp = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 110, damping: 14 }
};

/**
 * Variant: Stagger Container
 * Description: Applied to parent wrappers to sequentially cascade entry delays to children.
 */
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

/**
 * Variant: Accordion Collapse
 * Description: Smooth height rollout for collapsible list containers (e.g., Budgets).
 */
export const accordionCollapse = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.24, ease: "easeInOut" }
};

/**
 * Variant: Table Row Animation
 * Description: Layout transition and slide-out removal effect for list rows (e.g. Transactions).
 */
export const tableRowAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -30, transition: { duration: 0.18 } },
    transition: { type: "spring", stiffness: 120, damping: 15 }
};

/**
 * Variant: Toast Animation
 * Description: Bouncy slide-in from the right side of the viewport.
 */
export const toastAnimation = {
    initial: { opacity: 0, x: 80, scale: 0.92 },
    animate: { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 130, damping: 14 }
    },
    exit: { 
        opacity: 0, 
        x: 80, 
        scale: 0.92,
        transition: { type: "tween", ease: "easeIn", duration: 0.2 }
    }
};
