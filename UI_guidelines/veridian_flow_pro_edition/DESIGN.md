---
name: 'Veridian Flow: Pro Edition'
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c4a3d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c7b6c'
  outline-variant: '#bbcbb9'
  surface-tint: '#006d32'
  primary: '#006d32'
  on-primary: '#ffffff'
  primary-container: '#00d166'
  on-primary-container: '#005324'
  inverse-primary: '#30e375'
  secondary: '#bb0017'
  on-secondary: '#ffffff'
  secondary-container: '#e2242a'
  on-secondary-container: '#fffbff'
  tertiary: '#825500'
  on-tertiary: '#ffffff'
  tertiary-container: '#f6a500'
  on-tertiary-container: '#634000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#64ff92'
  primary-fixed-dim: '#30e375'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005224'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#930010'
  tertiary-fixed: '#ffddb3'
  tertiary-fixed-dim: '#ffb950'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  data-lg:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  container-max: 1440px
  density-tight: 4px
  density-comfortable: 12px
---

## Brand & Style

This design system evolves the futuristic aesthetic into a high-density, professional environment tailored for desktop-first financial monitoring. The brand personality is precise, authoritative, and energetic, designed to instill confidence in real-time decision-making. 

The style utilizes a **Modern Corporate** foundation infused with **Futuristic/Technical** accents. It prioritizes information density and data legibility while maintaining a sophisticated visual flow. The UI evokes a sense of "controlled momentum"—fast-moving market data anchored by a structured, reliable interface. While the overall mode is light, the system employs high-contrast deep surfaces for critical data zones, creating a "command center" feel that differentiates market analysis from administrative tasks.

## Colors

The palette is optimized for semantic clarity and financial signaling.

- **Primary (Neon Green - #00D166):** Used exclusively for gains, positive growth, success states, and primary actions. It represents "Go" and "Growth."
- **Secondary (Performance Red - #FF3B3B):** Used for stock losses, downward trends, and critical errors. High saturation ensures immediate visibility against light and dark backgrounds.
- **Tertiary (Cautionary Orange - #FFAB00):** Reserved for market volatility alerts, warnings, and pending states.
- **Neutral (Deep Navy/Charcoal - #0F172A):** Provides the structural backbone. Used for typography, sidebars, and "Pro" data containers to provide a sophisticated contrast to the light background.
- **Surface (Ghost Gray - #F8FAFC):** The default background color, ensuring the neon accents pop without causing eye strain during long sessions.

## Typography

The typographic system is a hybrid of **Space Grotesk** for brand-heavy elements and **Inter** for high-density data. 

- **Headlines & Labels:** Space Grotesk provides a technical, futuristic edge. Use this for page titles, section headers, and navigation items.
- **Body & Content:** Inter is used for general descriptions and settings to maximize legibility.
- **Financial Data:** Large price points use Space Grotesk Bold for impact. For tabular data, use a monospaced font (JetBrains Mono) to ensure vertical alignment of digits across shifting market values.
- **Density:** Font sizes are slightly smaller than standard consumer apps (14px base) to accommodate more information on a single 1440px screen.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** with a maximum container width of 1440px. 

- **High-Density Rhythm:** A 4px baseline grid governs all spacing. In data-heavy sections (like stock watchlists), use "tight" spacing units (4px/8px) to maximize the number of visible rows.
- **Zonal Layout:** The layout is divided into functional zones:
    - **Global Sidebar:** Fixed 240px width, deep navy (#0F172A).
    - **Contextual Panels:** Right-side "Detail" drawers for specific stock metrics.
    - **Main Feed:** Fluid center column for charts and tables.
- **Breakpoints:** Optimized for 1440px (Desktop L), scaling down to 1024px (Tablet Landscape). Below 1024px, the sidebar collapses into a rail and data columns are prioritized by significance.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Subtle Outlines** rather than heavy shadows, maintaining the sleek, technical aesthetic.

- **Primary Surface:** White (#FFFFFF) or Ghost Gray (#F8FAFC).
- **Secondary Surface:** Deep Navy (#0F172A) containers used for "Power Data" cards or dark-mode chart sections within the light UI.
- **Depth Markers:** 1px borders using #E2E8F0 are the primary method of separation. 
- **Active States:** Elements being interacted with or currently "trending" use a subtle 4px blur glow in the primary Neon Green (#00D166) at 20% opacity.
- **Elevated Modals:** Only system-level dialogues use a soft, large-radius ambient shadow (0px 20px 50px rgba(0, 0, 0, 0.08)) to float above the dense grid.

## Shapes

The shape language follows the **ROUND_EIGHT** principle (8px / 0.5rem base) to balance technical precision with modern approachability.

- **Standard Components:** Buttons, input fields, and cards utilize a base 8px radius.
- **Large Containers:** Dashboard widgets and main content areas use 16px (rounded-lg).
- **Interactive Elements:** Tags and pills use 24px (rounded-xl) to contrast against the rigid grid of data.
- **Icons:** Use a 1.5px stroke weight with slightly rounded terminals to match the font weight of Space Grotesk.

## Components

- **Buttons:** Primary buttons are solid Neon Green with Navy text. Secondary buttons use a Navy outline. Ghost buttons are reserved for utility actions (Export, Print).
- **Data Tables:** High-density rows with a 40px height. Hover states should highlight the entire row in a soft 5% green tint. Column headers use `label-caps`.
- **Stock Chips:** Compact pills showing ticker symbols (e.g., $AAPL). Use background colors to indicate trend: Light Green background for +%, Light Red for -%.
- **Price Charts:** Use a clean 2px line weight. The area under the line should have a subtle gradient fade.
- **Input Fields:** Minimalist design with a 1px border. On focus, the border transitions to Neon Green with a subtle outer glow.
- **Cards/Widgets:** Every widget must have a standardized header with a title and a "More" (three-dot) action menu.
- **Alerts:** Inline banners using the Cautionary Orange for "Market Volatility" or "Price Gap" notifications.