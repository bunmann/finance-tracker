# Lesson Time Tracking Logs

This file contains detailed metrics and time-tracking logs for each lesson completed in the project, as defined in [.cursorrules](file:///Users/david/Documents/PG/Finance%20Project/.cursorrules).

---

## Logs Summary Table

| Date | Week / Lesson | Start Time | End Time | Duration | Prompts |
|---|---|---|---|---|---|
| Jun 15, 2026 | Week 5 — Lesson 1 | 07:49 PM | 09:18 PM | 1h 28m | 27 |
| Jun 16, 2026 | Week 5 — Lesson 2 | 11:47 AM | 01:27 PM | 1h 40m | 26 |
| Jun 16, 2026 | Week 5 — Lesson 3 | 06:19 PM | 07:29 PM | 1h 10m | 12 |
| Jun 18, 2026 | Week 5 — Lesson 4 | 12:23 AM | 01:15 AM | 52m | 10 |
| Jun 18, 2026 | Week 5 — Lesson 5 | 01:57 PM | 03:33 PM | 1h 36m | 15 |
| Jun 20, 2026 | Week 5 — Lesson 6 | 12:48 AM | 02:40 AM | 1h 52m | 23 |
| Jun 20, 2026 | Week 5 — Lesson 7 | 11:49 PM | 12:10 AM | 21m | 4 |
| Jun 21, 2026 | Week 6 — Lesson 1 | 12:11 AM | 12:57 AM | 46m | 18 |
| Jun 21, 2026 | Week 6 — Lesson 2 | 07:19 PM | 10:16 PM | 2h 57m | 44 |
| Jun 22, 2026 | Week 6 — Lesson 3 | 07:11 PM | 07:49 PM | 38m | 13 |
| Jun 22, 2026 | Week 6 — Lesson 4 | 10:27 PM | 11:28 PM | 1h 1m | 22 |
| Jun 23, 2026 | Week 6 — Lesson 5 | 06:44 PM | 07:24 PM | 40m | 21 |
| Jun 24, 2026 | Week 6 — Lesson 6 | - | - | 2h 30m | 30 |
* Note: Lesson 6 completed in 2 sessions: Jun 23 (07:52 PM – 09:39 PM) and Jun 24 (03:16 PM – 03:59 PM).
| Jun 25, 2026 | Week 6 — Lesson 7 | - | - | 2h 7m | 21 |
* Note: Lesson 7 completed in 2 sessions: Jun 24 (04:06 PM – 05:39 PM) and Jun 25 (12:01 AM – 12:35 AM).
| Jun 26, 2026 | Special Phase: Premium Redesign | - | - | 3h 16m | 24 |
* Note: Redesign completed in 2 sessions: Jun 25 (12:59 AM – 02:12 AM) and Jun 26 (12:01 AM – 02:04 AM).
| Jun 28, 2026 | Special Phase: Animation Integration | 08:30 PM | 09:12 PM | 42m | 13 |
* Note: Completed Special Phase to implement central modular animations, custom route transitions, generic table row updates, and fixed adjacent stretching.
| Jun 28, 2026 | Week 7 — Task 1: Backend Screener | 01:41 AM | 02:47 AM | 1h 6m | 12 |
* Note: Completed Task 1 backend screener, including yfinance YoY cash flow growth, sector competence filters, relative strength cross-sectional ranking, USDCAD dynamic conversions, CAD localization settings, and dynamic CSV importer warnings.
| Jun 28, 2026 | Week 7 — Task 2: Anomalous Price Action | 07:15 PM | 08:15 PM | 1h 0m | 13 |
* Note: Completed Task 2 backend scan engine, refactoring QoQ revenue and 30-day price metrics into shared helper functions, and implementing the unified multi-strategy grouped-response endpoint POST /screener/scan.
| Jun 29, 2026 | Week 7 — Task 3: Screener & Anomalies UI | 01:41 PM | 03:50 PM | 2h 9m | 17 |


---

## Detailed Session Logs

### 📅 Week 5 — Lesson 1: JWT Authentication (Backend)
- **Date Completed**: Jun 15, 2026
- **Time Window**: 07:49 PM – 09:18 PM EDT
- **Total Duration**: 1 hour, 28 minutes
- **Number of Prompts**: 27
- **Key Concepts Learned**:
  - Hashing user passwords securely using direct `bcrypt` library (managing python bytes/strings encoding).
  - Generating signed JWT access tokens containing user ID subject claims (`"sub"`) and expiration metadata (`"exp"`).
  - FastAPI dependency injection using `Depends` and `HTTPBearer` for request authentication header parsing.
  - Swapping out insecure/deprecated `passlib` context in modern Python.
  - Designing separate database entities (`models.py`) and network entities (`schemas.py`).

### 📅 Week 5 — Lesson 2: JWT Authentication (Frontend)
- **Date Completed**: Jun 16, 2026
- **Time Window**: 11:47 AM – 01:27 PM EDT
- **Total Duration**: 1 hour, 40 minutes
- **Number of Prompts**: 26
- **Key Concepts Learned**:
  - Persisting authentication tokens across sessions via browser's `localStorage` client storage mechanism.
  - Intercepting Axios outbound network calls to attach HTTP Bearer token headers.
  - Designing a conditional component routing strategy using React Router to guard access to authenticated paths.
  - Utilizing React Fragments `<>...</>` to group DOM sibling nodes without introducing wrapper container noise.
  - Creating interactive forms with client validation and programmatic router redirects.
  - Seeding database tables upon entity creation triggers on the database server.
  - Chaining outer joins to group uncategorized time-series database records.
  - Documenting consistent styling rules across multiple code ecosystems.

### 📅 Week 5 — Lesson 3: CSV Import (Backend)
- **Date Completed**: Jun 16, 2026
- **Time Window**: 06:19 PM – 07:29 PM EDT
- **Total Duration**: 1 hour, 10 minutes
- **Number of Prompts**: 12
- **Key Concepts Learned**:
  - Designing deduplication logic via occurrence-based SHA256 fingerprinting (using `defaultdict` to track sequential matches on the same day).
  - FastAPI file upload streaming using `UploadFile` and `File(...)`.
  - Parsing uploaded text streams with standard Python `io.StringIO` and `csv.DictReader`.
  - Batch database inserts via SQLAlchemy to perform bulk creation efficiently in a single transaction commit.
  - Adding defensive validation guards against incorrect file types and Unicode decoding failures.
  - Resolving python-multipart dependency missing errors for FastAPI form parsing.

### 📅 Week 5 — Lesson 4: CSV Import (Frontend)
- **Date Completed**: Jun 18, 2026
- **Time Window**: 12:23 AM – 01:15 AM EDT
- **Total Duration**: 52 minutes
- **Number of Prompts**: 10
- **Key Concepts Learned**:
  - Packaging files and key-value parameters inside a browser-native standard `FormData` container.
  - Making HTTP requests with `multipart/form-data` payload encoding over Axios.
  - Restricting browser file pickers via HTML input `accept=".csv"` validation rules.
  - Resolving HTTP parameter payload structures (e.g. how Axios post signatures map parameters).
  - Building side-by-side modular page layouts for forms and file import controls.
  - Integrating dashboard state refresh handlers to reload time-series transaction statistics automatically upon import success.

### 📅 Week 5 — Lesson 5: Budget Tracking (Backend & Refactoring)
- **Date Completed**: Jun 18, 2026
- **Time Window**: 01:57 PM – 03:33 PM EDT
- **Total Duration**: 1 hour, 36 minutes
- **Number of Prompts**: 15
- **Key Concepts Learned**:
  - Modularizing a monolithic FastAPI application into domain-specific router modules using `APIRouter`.
  - Database-backed categories for special placeholders like "Uncategorized" to enable budgeting on all items uniformly.
  - Fallback logic for database queries with `outerjoin` to ensure transactions without a category are still reported correctly.
  - Custom list sorting logic using Python tuples to order lists alphabetically while pinning specific categories at the bottom.
  - Adding deletion protection constraints to database entities via API-level request handlers.

### 📅 Week 5 — Lesson 6: UI Polish & Error Handling
- **Date Completed**: Jun 20, 2026
- **Time Window**: 12:48 AM – 02:40 AM EDT
- **Total Duration**: 1 hour, 52 minutes
- **Number of Prompts**: 23
- **Key Concepts Learned**:
  - Conditional rendering in JSX with short-circuit logical operators (`{toast && <Toast />}`).
  - Data flows in React: passing callback function references as props to child components (lifting state up) and how Javascript closures retain parent state references.
  - Optional chaining operator (`?.`) in ES6 Javascript for clean, crash-free defensive checks on function/object props.
  - Designing a global feedback loop with custom auto-dismissing toast notifications.
  - Implementation of React Error Boundaries using Class components and lifecycle methods (`componentDidCatch`, `getDerivedStateFromError`) to catch rendering errors and render fallback UIs.
  - Intercepting keyboard input via DOM `onKeyDown` hooks and managing focus using `e.target.blur()` to enhance UX forms.
  - Declaring styling variables and animations in CSS with `@keyframes`.

### 📅 Week 5 — Lesson 7: README & Demo
- **Date Completed**: Jun 20, 2026
- **Time Window**: 11:49 PM – 12:10 AM EDT
- **Total Duration**: 21 minutes
- **Number of Prompts**: 4
- **Key Concepts Learned**:
  - Writing a professional README for the project with clear setup guides.
  - Summarizing API and folder structures.

### 📅 Week 6 — Lesson 1: Smart Auto-Categorization — Tier 1 (Global Keyword Matching)
- **Date Completed**: Jun 21, 2026
- **Time Window**: 12:11 AM – 12:57 AM EDT
- **Total Duration**: 46 minutes
- **Number of Prompts**: 18
- **Key Concepts Learned**:
  - Global keyword mapping (`categorization.py` helper) for auto-categorizing imported transactions.
  - Refactoring utilities (moving `parse_date` to `utils.py`) to maintain separation of concerns.
  - Customizing default seeded categories during registration in `auth.py`.
  - Splitting large UI components (`BudgetOverview.jsx` -> `BudgetCard.jsx`) to improve code structure and encapsulate local state.
  - Displaying category-specific transactions dynamically with a collapsible accordion table and high-contrast styling.
  - Writing clean, structured JSDoc-style interface headers for React components, callbacks, and FastAPI route handlers to document contracts rather than syntax.

### 📅 Week 6 — Lesson 2: Smart Auto-Categorization — Tier 2 (User-Trained Rules)
- **Date Completed**: Jun 21, 2026
- **Time Window**: 07:19 PM – 10:16 PM EDT
- **Total Duration**: 2 hours, 57 minutes
- **Number of Prompts**: 44
- **Key Concepts Learned**:
  - Setting up self-learning auto-categorization database tables (`category_rules`) and unique constraints.
  - Designing a cascading categorization pipeline (Tier 2 user-defined rules, then Tier 1 global keywords).
  - Extracting sorting logic from React view components into a reusable custom hook (`useSortableData.js`) to support three-state sorting.
  - Enforcing color properties on dropdown menus to ensure dark-mode visibility.
  - **Development Methodology**: Shifted focus toward agent-based coding, setting up code boundaries and laying foundations for structured agentic workflows.


### 📅 Week 6 — Lesson 3: Stock Portfolio — Schema & Models
- **Date Completed**: Jun 22, 2026
- **Time Window**: 07:11 PM – 07:49 PM EDT
- **Total Duration**: 38 minutes
- **Number of Prompts**: 13
- **Key Concepts Learned**:
  - Materialized views (pre-computing holdings snapshot on writes to keep reads fast).
  - Exact decimal representation using `Numeric` (or `Decimal`) vs float representation for monetary values to prevent rounding errors.
  - Global shared price caching in the database without `user_id` to respect external API rate limits.
  - Designing composite unique constraints (`UNIQUE(user_id, ticker)` / `UNIQUE(user_id, sector)`) to avoid duplicate records.
  - Creating FastAPI router skeletons with stubbed endpoints to establish the API structure early.
  - Circle of Competence: modeling Warren Buffett's sector-based investment constraints using database schema attributes.
  - Directives configuration: consolidating system prompts, lesson workflows, and execution boundaries in `.cursorrules`.
  - **Development Methodology**: Configured `.cursorrules` to define permanent project rules, strict workflow phases (planning, gated execution, walkthroughs), and execution boundaries to govern autonomous pair-programming.

### 📅 Week 6 — Lesson 4: Stock Portfolio — Alpha Vantage API Integration
- **Date Completed**: Jun 22, 2026
- **Time Window**: 10:27 PM – 11:28 PM EDT
- **Total Duration**: 1 hour, 1 minute
- **Number of Prompts**: 22
- **Key Concepts Learned**:
  - External API integration: structuring secure outbound REST HTTPS requests, query parameters serializations.
  - Environment secret storage: using `.env` files and `python-dotenv` library to keep keys out of Git.
  - Cache-aside performance: checking existing database cache first to avoid hitting external rate limits (25 requests/day).
  - Graceful degradation: serving stale fallback data from the cache if the external network is unreachable or rate-limited.
  - API response parsing: extracting nested data safely with python's `.get()` dictionary defaults to prevent program crashes.
  - Returning metadata: passing back timestamps and staleness flags to allow the client to know data freshness.
  - Enforcing private scopes: using the leading underscore prefix `_` convention in Python to signal internal helper functions.
  - Codebase domain segregation: using visual comments to segment database models and schemas by domain as they scale.

### 📅 Week 6 — Lesson 5: Stock Portfolio — CRUD & Business Logic
- **Date Completed**: Jun 23, 2026
- **Time Window**: 06:44 PM – 07:24 PM EDT
- **Total Duration**: 40 minutes
- **Number of Prompts**: 21
- **Key Concepts Learned**:
  - Implementing weighted average cost basis dynamically on new purchases to track price changes.
  - Designing a robust sell confirmation handler that performs validations on share ownership levels.
  - Cleaning up zero-share holdings from the database entirely to maintain clean state.
  - Integrating current price metadata tuples into portfolio view queries (unpacking price, timestamp, and staleness parameters).
  - Building descriptive error and warning handlers in portfolio API responses when external price fetches fail to protect client data integrity.
  - Designing structured watchlist CRUD endpoints that pull live stock prices dynamically.
  - Implementing Circle of Competence CRUD schemas to record sector expertise silos.
  - Mapping out a quantitative algorithmic stock screener filtering structure and an NLP sentiment-driven thesis overlay.

### 📅 Week 6 — Lesson 6: Stock Portfolio Integration & Refactoring
- **Date Completed**: Jun 24, 2026
- **Time Windows**: 
  - Session 1: Jun 23, 2026 (07:52 PM – 09:39 PM EDT)
  - Session 2: Jun 24, 2026 (03:16 PM – 03:59 PM EDT)
- **Total Duration**: 2 hours, 30 minutes
- **Number of Prompts**: ~30
- **Key Concepts Learned**:
  - Building dynamic frontend React tables using a custom, reusable sorting wrapper (`GenericTable.jsx`).
  - Designing database schemas with a persistent `realized_gain` column on stock trade sale ledgers to keep permanent records of gains/losses.
  - Formulating calculations to deduct average buy price from sell price to save net realized gains rather than gross proceeds.
  - Normalizing Decimal inputs with `.normalize()` to clean up fractional quantities (avoiding trailing zeros like `1.0000` or `123.0`).
  - Overriding browser CSS styles targeting `.main-content` page headings to resolve white-on-white text issues under system dark-mode themes.
  - Migrating stock APIs from Alpha Vantage to `yfinance` to eliminate rate limits, and implementing error handling to distinguish invalid tickers from standard network drops.

### 📅 Week 6 — Lesson 7: Brokerage CSV Import
- **Date Completed**: Jun 25, 2026
- **Time Windows**: 
  - Session 1: Jun 24, 2026 (04:06 PM – 05:39 PM EDT)
  - Session 2: Jun 25, 2026 (12:01 AM – 12:35 AM EDT)
- **Total Duration**: 2 hours, 7 minutes
- **Number of Prompts**: 21
- **Key Concepts Learned**:
  - Auto-detection of CSV templates: detecting Questrade vs Wealthsimple headers.
  - Safe 3-step file reading: verifying extension, validating UTF-8 content types, and parsing.
  - Deduping files using SHA256 hashes of transaction details.
  - Clean modular React architecture using a generic `<CsvImporter>` wrapping specialized domain wrappers (`<TransactionCsvUpload>` and `<BrokerageCsvUpload>`).
  - Extracted business logic helpers (`_update_holding_buy` and `_update_holding_sell` with ValueError validations) to handle database state transitions uniformly between API endpoints and file imports.

### 📅 Special Phase: Premium Redesign
- **Date Completed**: Jun 26, 2026
- **Time Windows**: 
  - Session 1: Jun 25, 2026 (12:59 AM – 02:12 AM EDT)
  - Session 2: Jun 26, 2026 (12:01 AM – 02:04 AM EDT)
- **Total Duration**: 3 hours, 16 minutes
- **Number of Prompts**: ~24
- **Key Concepts Learned**:
  - Eliminating select dropdown chevron visual drift by utilizing `appearance: none` and custom chevrons.
  - Designing responsive, dynamic-width components (`MonthSelect.jsx`) in React.
  - Positioning and styling Toast notifications in viewport corners (`bottom-right`) outside layout flow to prevent page shifts.
  - Memoizing event handler callbacks (`showToast`) using React's `useCallback` hook to stabilize reference identities and stop parent state changes from causing re-render reflows and unmounts on child pages.
  - Designing professional, accessible full-screen nature glassmorphism login screens and responsive split-screen signup structures strictly in vanilla CSS.
  - Structuring CSS selectors using modern `:has()` pseudo-classes to perform context-aware parent card styling dynamically based on internal indicators (e.g. gains/losses).



### 📅 Special Phase: Animation Integration
- **Date Completed**: Jun 28, 2026
- **Time Window**: 08:30 PM – 09:12 PM EDT
- **Total Duration**: 42 minutes
- **Number of Prompts**: 13
- **Key Concepts Learned**:
  - Centralized, reusable animation config dictionary variants (`animations.js`) to maintain clean code separation of concerns.
  - Page transition layouts and exiting DOM animations utilizing Framer Motion's `<AnimatePresence>` by passing the path as a key.
  - Custom exit animation transition separation (tween instead of spring) to prevent element flickering and spring back-bounces on unmount.
  - Consolidating layout-aware list resizing and entry transitions natively inside `<GenericTable>` to avoid duplicating code across multiple table wrappers.
  - Fixing CSS grid item vertical stretch issues using `align-items: start` to allow cards to retain their natural height upon adjacent expansions.



### 📅 Week 7 — Task 1: Backend Screener
- **Date Completed**: Jun 28, 2026
- **Time Window**: 01:41 AM – 02:47 AM
- **Total Duration**: 1 hour, 6 minutes
- **Number of Prompts**: 12
- **Key Concepts Learned**:
  - Structuring Pydantic schemas for incoming quantitative filter request validation and outgoing list candidate serialization.
  - Designing yfinance statistics query fallbacks, computing YoY Free Cash Flow growth from operating cash flows and CapEx statements, and falling back to YoY Total Revenue growth when statement indices are missing.
  - Formulating cross-sectional 30-day percentage price change momentum calculations.
  - Querying database competence records to tag or prune candidate sectors matching Warren Buffett's Circle of Competence.

### 📅 Week 7 — Task 2: Backend Anomalous Price Action Engine
- **Date Completed**: Jun 28, 2026
- **Time Window**: 07:15 PM – 08:15 PM
- **Total Duration**: 1 hour, 0 minutes
- **Number of Prompts**: 13
- **Key Concepts Learned**:
  - Designing a unified, strategy-grouped quantitative scanner endpoint (`POST /screener/scan`) to evaluate multiple strategies across watchlists, holdings, and general universes simultaneously.
  - Parsing quarterly income statements for QoQ revenue growth with a rolling `revenueGrowth` info metadata fallback.
  - Implementing price-to-fundamental divergence logic (QoQ Revenue Growth > 10% AND 30-day price correction < -10%) representing a bullish "Value Gap" mean-reversion signal.
  - Applying Circle of Competence active sector filters to general recommendations while keeping active portfolio holdings alerts unfiltered.
  - Refactoring pricing and statement parsers into reusable, private helper functions (`_calculate_30d_return` and `_calculate_qoq_revenue_growth`).

### 📅 Week 7 — Task 3: Screener & Anomalies Dashboard (Frontend)
- **Date Completed**: Jun 29, 2026
- **Time Window**: 01:41 PM – 03:50 PM EDT
- **Total Duration**: 2 hours, 9 minutes
- **Number of Prompts**: 17
- **Key Concepts Learned**:
  - Designing a unified quantitative terminal (`StockScreener.jsx`) utilizing multi-tab navigation to transition smoothly between market-wide momentum scans and portfolio divergence alerts.
  - Organizing complex React UI hierarchies into modular presenter directories (`src/components/screener/`) and standardizing empty states (`EmptyState.jsx`) across all table views.
  - Implementing dynamic sidebar adaptation where parameter sliders appear or hide based on active strategy requirements.
  - Upgrading table sorting hooks (`useSortableData.js`) from hardcoded whitelist checks to Protocol 1 runtime Duck-Typing (`!isNaN(Number(aVal))`).
  - Refactoring monolithic components (`Dashboard.jsx`) into clean Container / Presenter architecture (`DashboardView.jsx`) for symmetrical state separation across all 5 app tabs.

