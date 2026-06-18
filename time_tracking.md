# Lesson Time Tracking Logs

This file contains detailed metrics and time-tracking logs for each lesson completed in the project, as defined in [lesson_protocols.md](file:///Users/david/Documents/PG/Finance%20Project/lesson_protocols.md).

---

## Logs Summary Table

| Date | Week / Lesson | Start Time | End Time | Duration | Prompts |
|---|---|---|---|---|---|
| Jun 15, 2026 | Week 5 — Lesson 1 | 07:49 PM | 09:18 PM | 1h 28m | 27 |
| Jun 16, 2026 | Week 5 — Lesson 2 | 11:47 AM | 01:27 PM | 1h 40m | 26 |
| Jun 16, 2026 | Week 5 — Lesson 3 | 06:19 PM | 07:29 PM | 1h 10m | 12 |
| Jun 18, 2026 | Week 5 — Lesson 4 | 12:23 AM | 01:15 AM | 52m | 10 |
| Jun 18, 2026 | Week 5 — Lesson 5 | 01:57 PM | 03:33 PM | 1h 36m | 15 |


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
