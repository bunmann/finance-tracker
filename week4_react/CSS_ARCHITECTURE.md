# Finance Tracker — CSS Architecture & Styling Guidelines

## 1. Core Philosophy: Separation of Structure and Logic
All visual styling across the Finance Tracker application must reside in **designated CSS files**. Inline JSX `style={{ ... }}` objects are strictly disallowed for static and structural styling (such as layout grids, margins, padding, typography, border radius, and colors).

### Why avoid inline JSX styles?
- **Readability:** Keeping JSX focused on layout hierarchy, props, and state logic makes components easier to review.
- **Cache & Bundle Efficiency:** Extracted CSS classes allow browser style caching and clean stylesheet minification via Vite.
- **Consistent Design Tokens:** Using CSS classes ensures all colors, typography, and spacing strictly follow our global CSS variables (`--primary`, `--on-surface`, `--gutter`, `--radius-xl`, etc.).

---

## 2. CSS File Co-location Strategy
Rather than maintaining a single monolithic CSS file for the entire application, styles are modularized by feature domain and co-located alongside their component folders:

```
src/
├── styles/
│   ├── global.css          # Design system primitives, resets, variables, buttons, headers, inputs
│   └── StockPortfolio.css  # Shared stock portfolio definitions & ledger layout rules
│
└── components/
    ├── common/             # Common shared UI components
    │   └── data-display/
    │       └── GenericTable.css
    │
    ├── transactions-master/
    │   ├── transactions/
    │   │   └── Transactions.css   # Scoped to transaction history, CSV upload, & transaction table
    │   └── budgets/
    │       └── Budgets.css        # Scoped to budget cards, progress meters, & variance tags
    │
    └── stocks-master/
        ├── watchlist/
        │   └── Watchlist.css      # Watchlist tables, input bars, & competence sector chips
        ├── screener/
        │   └── Screener.css       # Quantitative screener sliders, tabs, & anomaly cards
        └── stocks-summary/
            └── StocksSummary.css  # Executive summary grid & KPI card placements
```

### Guideline for Adding New Styles:
1. **Domain-Specific Style:** If adding or modifying a component within a feature folder (e.g., `budgets/components/BudgetCard.jsx`), place its CSS classes in that folder's designated stylesheet (`budgets/Budgets.css`).
2. **Global/Shared Utility:** If adding a style used across multiple top-level domains (e.g., standard form buttons, global headers, or modal wrappers), place it in `src/styles/global.css`.

---

## 3. Handling Animations (`Framer Motion` vs. CSS Transitions)
We use a clean boundary between CSS transitions and Framer Motion:

### Use CSS (`.css` files) for:
- Static geometry and responsive layouts (`display: grid`, `flex-direction`, `gap: 24px`, `@media (max-width: ...)`).
- Simple hover and focus micro-interactions (`transition: background-color 0.15s ease`, `:hover`, `:focus`).
- Container overflow and clipping (`overflow: hidden`).

### Use `Framer Motion` (`JSX` props) ONLY for:
- Dynamic entrance and exit animations (`initial="initial"`, `animate="animate"`, `exit="exit"`).
- Orchestrated container staging (`variants={staggerContainer}`).
- Runtime layout transitions controlled by React state (`AnimatePresence`, `layoutId`).

**Rule:** Never move Framer Motion lifecycle properties (`initial`, `animate`, `variants`) into CSS classes. Keep those strictly as JSX props on `<motion.div>` elements while moving static appearance rules (`className="..."`) to the co-located `.css` file.
