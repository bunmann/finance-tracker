# Lesson Time Tracking Logs

This file contains detailed metrics and time-tracking logs for each lesson completed in the project, as defined in [lesson_protocols.md](file:///Users/david/Documents/PG/Finance%20Project/lesson_protocols.md).

---

## Logs Summary Table

| Date | Week / Lesson | Start Time | End Time | Duration | Prompts |
|---|---|---|---|---|---|
| Jun 15, 2026 | Week 5 — Lesson 1 | 07:49 PM | 09:18 PM | 1h 28m | 27 |

---

## Detailed Session Logs

### 📅 Week 5 — Lesson 1: JWT Authentication (Backend)
- **Date Completed**: Jun 15, 2026
- **Time Window**: 07:49 PM – 09:18 PM EDT
- **Total Duration**: 1 hour, 28 minutes
- **Number of Prompts**: 27
- **Files Modified**:
  - [auth.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/auth.py) (Created)
  - [main.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/main.py)
  - [schemas.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/schemas.py)
  - [01_auth_backend.md](file:///Users/david/Documents/PG/Finance%20Project/week5_auth_and_polish/01_auth_backend.md)
  - [00_week5_reference.txt](file:///Users/david/Documents/PG/Finance%20Project/week5_auth_and_polish/00_week5_reference.txt)
- **Key Concepts Learned**:
  - Hashing user passwords securely using direct `bcrypt` library (managing python bytes/strings encoding).
  - Generating signed JWT access tokens containing user ID subject claims (`"sub"`) and expiration metadata (`"exp"`).
  - FastAPI dependency injection using `Depends` and `HTTPBearer` for request authentication header parsing.
  - Swapping out insecure/deprecated `passlib` context in modern Python.
  - Designing separate database entities (`models.py`) and network entities (`schemas.py`).
