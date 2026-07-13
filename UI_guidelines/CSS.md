# CSS Architecture Guidelines — Veridian Flow: Pro Edition

## 1. How CSS Works in This Project

This is a **Vite + React** project using **vanilla CSS**. There is no CSS Module scoping.
Every CSS file imported anywhere in the app is bundled into a single global stylesheet.

Key implication: class names are global. `budget-card` and `portfolio-card` can collide if named carelessly.
This makes consistent naming conventions non-negotiable.

---

## 2. File Organization: Co-located CSS

CSS files live **next to the component directory that owns them**, not in a centralized `src/styles/` folder.

```
src/
  styles/
    global.css              ← ONLY: design tokens, resets, shared utilities
  components/
    auth/
      Auth.css              ← Styles for Login and Signup pages
    common/
      layout/
        Navbar.css          ← Navbar-specific styles
    transactions-master/
      dashboard/
        Dashboard.css       ← Dashboard page styles
      transactions/
        Transactions.css    ← Transaction table, form, CSV upload styles
      budgets/
        Budgets.css         ← Budget card, budget controls, budget overview styles
    stocks-master/
      stocks/
        StockPortfolio.css  ← Portfolio page, stock form, stock transactions styles
      stocks-summary/
        StocksSummary.css   ← Summary overview page styles
      watchlist/
        Watchlist.css       ← Watchlist table, sector manager styles
      screener/
        Screener.css        ← Screener page and preview card styles
```

### Rule: One CSS file per feature area (not per component)
- `Budgets.css` covers all components under `budgets/` (BudgetCard, BudgetContent, BudgetOverview)
- Do not create a `BudgetCard.css`, `BudgetContent.css` etc. — that is over-fragmentation
- Split only when a file exceeds ~300 lines and two distinct features share it

### Rule: global.css is for truly shared rules only
Things that belong in `global.css`:
- CSS custom properties (design tokens: `--primary`, `--surface`, etc.)
- Box-sizing reset, base font
- Shared utility classes used across features: `.btn`, `.spinner`, `.form-error`, `.empty-state`, `.icon-sm`
- Typography scale rules

Things that do NOT belong in `global.css`:
- Any rule with a class name tied to a specific page or feature

---

## 3. Naming Convention: BEM-Inspired Flat Classes

Use a **BEM-inspired** approach without strict double-underscore syntax. The goal is predictability.

```
[feature]-[element]            ← base element
[feature]-[element]--[modifier] ← variant or state
```

### Examples
```css
/* Base */
.budget-card { ... }
.budget-header { ... }
.budget-footer { ... }

/* Modifiers */
.budget-card--expanded { ... }
.budget-header--clickable { ... }

/* State via utility */
.amount-cell--right { text-align: right; }
.amount-cell--left { text-align: left; }
```

### Avoid generic class names that collide
```
BAD:  .card, .header, .container, .row
GOOD: .budget-card, .dashboard-header, .watchlist-container
```

### Icon utility classes (global.css)
```css
.icon-sm  { font-size: 13px; }
.icon-md  { font-size: 18px; }
.icon-lg  { font-size: 24px; }
.icon-success-lg { font-size: 24px; color: var(--primary-container); }
.btn-icon     { font-size: 16px; }
.btn-icon-sm  { font-size: 14px; margin-right: 4px; }
```

---

## 4. Inline Styles: The Rule

**Inline `style={{...}}` in JSX is banned for static values.** All presentation belongs in CSS.

### Inline IS allowed when the value is driven by JavaScript state at runtime:

| Acceptable | Reason |
|---|---|
| `style={{ transform: \`rotate(${isExpanded ? 90 : 0}deg)\` }}` | Value changes based on component state |
| `style={{ width: \`${monthWidths[value]}px\` }}` | Value is a computed lookup, changes per render |
| Framer Motion `animate={{ height, opacity }}` | JS-driven animation — CSS cannot do this |
| Dynamic column widths spread from config: `style={{ ...colStyle }}` | Width is data-driven from a config object |

### Inline is NOT allowed for:

```jsx
// BAD — these are static values, they belong in CSS
<div style={{ marginTop: '40px' }}>
<span style={{ fontSize: '16px' }}>
<td style={{ textAlign: 'right' }}>
<div style={{ overflow: 'hidden' }}>
<button style={{ marginTop: '16px', width: '100%' }}>
```

```jsx
// GOOD
<div className="spinner-container--page">
<span className="btn-icon">
<td className="amount-cell--right">
<div className="collapsible-form-body">
<button className="btn btn-primary form-submit-full">
```

---

## 5. Design Token Usage

Always reference CSS custom properties from `global.css`. Never hardcode hex values in component CSS files.

```css
/* BAD */
color: #00D166;
background: #0F172A;

/* GOOD */
color: var(--primary-container);
background: var(--on-surface);
```

The full token reference is in `DESIGN.md`. Key tokens:

| Token | Value | Use |
|---|---|---|
| `--primary` | `#006d32` | Text on light surfaces indicating success/positive |
| `--primary-container` | `#00d166` | Neon green fills, gain states, active glow |
| `--secondary` | `#bb0017` | Loss states, error text |
| `--secondary-container` | `#e2242a` | Error fills, over-budget indicators |
| `--tertiary` | `#825500` | Warning text |
| `--tertiary-container` | `#f6a500` | Warning fills |
| `--on-surface` | `#131b2e` | Primary text |
| `--on-surface-variant` | `#3c4a3d` | Secondary/muted text |
| `--surface-container-high` | `#e2e7ff` | Card/widget backgrounds |
| `--outline-variant` | `#bbcbb9` | Subtle borders |

---

## 6. File Header

Every CSS file must start with a standard header:

```css
/* ============================================================================
   File: Budgets.css
   Description: Styles for the budget overview page, budget cards, and
                category budget controls.
   ============================================================================ */
```

---

## 7. Property Order Within a Rule

Declare properties in this order for consistency:

1. Layout / positioning (`display`, `position`, `top`, `left`, `z-index`, `flex-*`, `grid-*`)
2. Box model (`width`, `height`, `margin`, `padding`, `border`, `border-radius`)
3. Visual (`background`, `color`, `opacity`, `box-shadow`)
4. Typography (`font-family`, `font-size`, `font-weight`, `line-height`, `text-align`)
5. Animation / transition (`transition`, `transform`, `animation`)

---

## 8. What Belongs Where — Decision Tree

```
Is this used in 3+ different feature areas?
  YES → global.css (utility class)
  NO  → the CSS file co-located with the owning feature

Is this a design token (color, spacing, radius)?
  YES → global.css as a CSS custom property

Is this a page-level layout rule?
  YES → the co-located CSS file for that page's overview component

Is this an inline style?
  Is the value driven by JS state at runtime?
    YES → keep inline (document why in a comment)
    NO  → move to CSS, this is a violation
```
