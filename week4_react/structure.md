# Frontend Module Structure & Coding Rules

This document outlines the architecture, state management, design tokens, and modular animation rules for the React Vite frontend application.

---

## 📂 Architecture Map

* **`src/main.jsx`**: Bootstraps the React application.
* **`src/App.jsx`**: High-level app controller. Handles global React states (authentication status, transaction database synchronization) and global interceptor callbacks.
* **`src/AppContent.jsx`**: Manages the main route configurations, sidebars layout frame, and notification toast containers.
* **`src/components/`**: Domain-specific UI directories:
  * `auth/`: Login and Signup pages.
  * `common/`: Reusable components (e.g. `Navbar.jsx`, `GenericTable.jsx`, `MetricCard.jsx`, `Toast.jsx`).
  * `dashboard/`: Financial summary overview cards, monthly alert banners.
  * `stocks/`: Portfolio holdings grids, trade ledger tables, CSV importer triggers.
  * `transactions/`: Transaction logs page, inline edit lists, transaction forms.
* **`src/styles/`**: Custom vanilla CSS sheets (no Tailwind CSS).

---

## 🎨 Vanilla CSS & Style Tokens

1. **Vanilla Styling**: All styling must be written in the custom CSS files. Avoid inline React styling maps unless rendering dynamic dimensions (like scroll bounds or progress widths).
2. **Color Hierarchy**:
   * **Primary**: Neon Green (`#00D166` / `#006D32`) for growth and gains.
   * **Secondary**: Performance Red (`#FF3B3B` / `#BB0017`) for error states and P&L losses.
   * **Tertiary**: Cautionary Orange (`#FFAB00` / `#825500`) for warnings.
   * **Neutral**: Deep Navy (`#0F172A` / `#131B2E`) for sidebars and body text.
   * **Surface**: Ghost Gray (`#F8FAFC` / `#FAF8FF`) for default backdrops.
3. **Card Alignment**: Always apply `align-items: start;` to card grid containers to prevent adjacent components in the same row from stretching vertically when one expands.

---

## 🎭 Modular Animations (Framer Motion)

1. **Zero Markup Clutter**:
   * Never define complex animation coordinate objects inline in the React JSX code.
   * All Framer Motion animation configs (variants) must be stored inside [animations.js](file:///Users/david/Documents/PG/Finance%20Project/week4_react/src/utils/animations.js).
   * Apply animations cleanly in JSX using the spread operator: `<motion.div {...fadeInUp}>`.
2. **Page Transitions**: Wrap the parent `<Routes>` with `<AnimatePresence mode="wait">` and feed the current URL location `key={location.pathname}` to trigger transitions on path shifts.
3. **Exit Animation Transitions**: Always separate the entrance (`animate`) and exit (`exit`) transition types for Toast notifications or collapsible lists. Use bouncy springs on entrance, and smooth, linear/tween easings on exit to prevent elements from bouncing back into view during unmount transitions.
