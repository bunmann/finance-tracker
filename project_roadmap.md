# Personal Finance Tracker — Your Roadmap

**Start:** This week (late May 2026)  
**MVP Done:** Early July  
**Expansion Done:** Late August  
**Polish & Deploy:** September  
**PEY Applications:** October  

You have ~18 weeks before PEY apps open. That's plenty of time for a polished, impressive project — even two if you move quickly.

---

## The Plan at a Glance

```
May 26 ─── Jun 1     Week 1: Python Fundamentals
Jun 2 ──── Jun 8     Week 2: SQL + PostgreSQL
Jun 9 ──── Jun 15    Week 3: FastAPI Backend (transactions + categories)
Jun 16 ─── Jun 22    Week 4: React Frontend (forms + dashboard)
Jun 23 ─── Jun 29    Week 5: Auth, Budgets, Polish → MVP DONE ✅
                     
                     ── DECISION POINT: Expand or pivot? ──

Jun 30 ─── Jul 6     Week 6: Stock Portfolio Backend (API integration)
Jul 7 ──── Jul 13    Week 7: Stock Portfolio Frontend (charts, P&L)
Jul 14 ─── Jul 20    Week 8: Financial Statements (balance sheet, income stmt)
Jul 21 ─── Jul 27    Week 9: PDF Export + Net Worth Tracking
Jul 28 ─── Aug 3     Week 10: Docker + Deployment

Aug 4 ──── Aug 31    Buffer / Job Tracker / Extra Polish
Sep 1 ──── Sep 28    Final polish, README, deploy, record demo
Oct 1 ─────────────  PEY APPLICATIONS OPEN 🚀
```

## Multi-Device Git Workflow & Data Plan

Since you are coding on both your Macbook and PC, keep this workflow in mind to stay synced:

### Git Checklist (When switching devices)
* **On the device you are leaving:**
  ```bash
  git add .
  git commit -m "brief description of work"
  git push
  ```
* **On the device you are starting on:**
  ```bash
  git pull
  ```

### Local Environment & Data Policy
* **`venv/` (Virtual Environment):** Excluded from Git. You will run `python3 -m venv venv` once on your PC to set up local dependencies there.
* **`data/` (Transaction logs):** Excluded from Git to keep your financial logs private. You will generate separate local test data on each machine.
* **Cloud Sync Plan:** When we transition to databases (Week 3+), we'll connect both devices to a **free cloud database** (like Neon or Supabase). This will sync your transactions automatically across devices over the internet without needing Git to track data files.

---

## Phase 1: Learn the Tools (Weeks 1–2)

### Week 1 — Python Fundamentals
**Goal:** Be comfortable writing Python at the level you write C++.

You don't need a full course. You already know OOP, loops, conditionals, data structures from C++. Python is just different syntax for concepts you already have.

**What to learn (in order):**

| Topic | C++ Equivalent | Time |
|---|---|---|
| Variables, types, f-strings | `int x = 5;` → `x = 5` | 1 hour |
| Lists, dicts, sets, tuples | `vector`, `map`, `set` | 2 hours |
| Functions, *args, **kwargs | Functions + parameter packs | 1 hour |
| List comprehensions | No equivalent (Python superpower) | 1 hour |
| Classes, `__init__`, inheritance | Same concepts, simpler syntax | 2 hours |
| File I/O, JSON, CSV | `fstream`, but way easier | 1 hour |
| Error handling (try/except) | `try/catch` | 30 min |
| pip, virtual environments | No equivalent (dependency management) | 1 hour |
| Type hints | Already have in C++, optional in Python | 30 min |

**Recommended resource:** [Python for Programmers](https://docs.python.org/3/tutorial/) — the official tutorial. Skip the basics, focus on what's different from C++. You should be able to get through this in 2–3 days.

**Practice:** Solve 10–15 easy/medium LeetCode problems in Python. This forces you to learn syntax through doing, and doubles as interview prep.

**Milestone:** By end of Week 1, you can write a Python script that:
- Reads a CSV file of transactions
- Calculates total spending by category
- Prints a formatted summary

---

### Week 2 — SQL + PostgreSQL
**Goal:** Understand relational databases and write queries confidently.

**What to learn:**

| Topic | Time | Priority |
|---|---|---|
| What is a relational database (tables, rows, columns, primary keys) | 1 hour | 🔴 |
| CREATE TABLE, INSERT, SELECT, UPDATE, DELETE | 2 hours | 🔴 |
| WHERE, AND, OR, LIKE, IN, BETWEEN | 1 hour | 🔴 |
| JOIN (INNER, LEFT, RIGHT) | 2 hours | 🔴 |
| GROUP BY, HAVING, aggregate functions (SUM, COUNT, AVG) | 2 hours | 🔴 |
| ORDER BY, LIMIT, OFFSET (pagination) | 30 min | 🔴 |
| Foreign keys, relationships (one-to-many, many-to-many) | 1 hour | 🔴 |
| Subqueries | 1 hour | 🟡 |
| Indexes (what they are, when to use) | 30 min | 🟡 |
| Installing PostgreSQL locally, using psql or pgAdmin | 1 hour | 🔴 |

**Recommended resources:**
- [SQLBolt](https://sqlbolt.com/) — interactive, takes ~3 hours, covers everything you need
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) — reference when building

**Practice:** After SQLBolt, create a `finance` database locally and:
1. Create `categories` and `transactions` tables
2. Insert 20–30 dummy transactions
3. Write queries for: total by category, monthly spending, top 5 expenses

**Milestone:** By end of Week 2, you can:
- [x] Design a normalized schema (no redundant data)
- [x] Write JOIN queries across multiple tables
- [x] Use GROUP BY with aggregate functions
- [x] Explain what a foreign key is and why it matters

---

## Phase 2: Build the MVP (Weeks 3–5)

### Week 3 — FastAPI Backend
**Goal:** Build a working REST API for transactions and categories.

**What to learn & build:**

| Day | Task |
|---|---|
| **Mon** | Learn FastAPI basics — routes, request/response models, Pydantic schemas. Follow the [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) (first 5 sections). |
| **Tue** | Set up project structure. Install FastAPI, uvicorn, SQLAlchemy, psycopg2. Connect to your PostgreSQL database. |
| **Wed** | Build SQLAlchemy models for `users`, `categories`, `transactions`. Learn what an ORM is (it maps Python classes to database tables). |
| **Thu** | Build CRUD endpoints: `POST /transactions`, `GET /transactions`, `DELETE /transactions/{id}` |
| **Fri** | Build filter/search endpoints: filter by category, date range, type. Add pagination. |
| **Sat-Sun** | Build summary endpoint: `GET /dashboard` returns monthly totals by category. Write tests with pytest. |

**Key concepts you'll learn:**
- What a REST API is (GET = read, POST = create, PUT = update, DELETE = delete)
- What an ORM is (SQLAlchemy — write Python classes instead of raw SQL, but SQL runs under the hood)
- Request validation with Pydantic (like type checking, but for API inputs)
- Project structure (routers, models, schemas, database config)

**Milestone:** You can use Postman or curl to hit your API and get real data back from PostgreSQL.

---

### Week 4 — React Frontend
**Goal:** Build a working UI connected to your API.

| Day | Task |
|---|---|
| **Mon** | Learn React basics — components, JSX, props, useState, useEffect. Follow [React's official tutorial](https://react.dev/learn). |
| **Tue** | Set up project with Vite (`npm create vite@latest`). Install axios for API calls. |
| **Wed** | Build transaction list page — fetch from your API, display in a table. |
| **Thu** | Build "add transaction" form — POST to your API, refresh list. |
| **Fri** | Build dashboard page — charts showing spending by category (use [Recharts](https://recharts.org/) or [Chart.js](https://www.chartjs.org/)). |
| **Sat-Sun** | Styling and layout. Navigation bar, responsive design. Make it look good. |

**Milestone:** A working web app where you can add transactions and see charts. It won't be pretty yet — that's fine.

---

### Week 5 — Auth, Budgets, Polish → MVP DONE ✅
**Goal:** Add user accounts, budget tracking, and polish the UI.

| Day | Task |
|---|---|
| **Mon-Tue** | Add user authentication (JWT tokens). Signup/login pages. Protect API routes. |
| **Wed** | Build budget feature — set monthly limits per category, show progress bars. |
| **Thu** | Budget alerts — warning when approaching/exceeding limits. |
| **Fri** | UI polish — consistent styling, loading states, error handling, empty states. |
| **Sat-Sun** | Write a proper README. Record a demo GIF/video. Push to GitHub. |

### 🏁 MVP Checkpoint

At this point you have a **fully functional personal finance tracker** with:
- ✅ Transaction logging (CRUD)
- ✅ Categories (default + custom)
- ✅ Dashboard with charts
- ✅ Budget setting + alerts
- ✅ User accounts (signup/login)
- ✅ Search, filter, pagination
- ✅ Clean UI

**This alone is already resume-worthy.** If you stopped here and spent the rest of the summer on the job tracker, you'd have two solid projects.

> [!IMPORTANT]
> ### Decision Point (End of Week 5)
> Ask yourself:
> - Am I still excited about this? → **Continue to Phase 3 (stocks + balance sheets)**
> - Am I feeling burned out? → **Polish what you have, then start the Job Tracker**
> - Am I behind schedule? → **Cut scope, polish MVP, move on**
>
> There is no wrong answer. A polished MVP + a second project beats an unfinished ambitious project every time.

---

## Phase 3: Stocks & Financial Statements (Weeks 6–10)

### Week 6 — Stock Portfolio Backend
| Task | What You Learn |
|---|---|
| Design `holdings`, `stock_transactions`, `price_cache` tables | Schema design for a different domain |
| Integrate a stock price API (Alpha Vantage — free tier, 5 calls/min) | **External API consumption** (huge resume skill) |
| Build endpoints: add/remove holdings, log buy/sell/dividend | More CRUD, but with business logic |
| Calculate unrealized gain/loss per holding | Financial math in code |
| Cache price data to avoid rate limits | Caching strategy, `price_cache` table |

### Week 7 — Stock Portfolio Frontend
| Task | What You Learn |
|---|---|
| Portfolio overview page — table of holdings with live prices, P&L | Real-time-ish data display |
| Portfolio value chart (line chart over time) | Time-series visualization |
| Stock transaction history | Reusing patterns from finance transactions |
| Buy/sell forms | Form patterns you already know |

### Week 8 — Financial Statements
This is the **differentiator** — most student projects don't have this.

| Statement | What It Shows | SQL Involved |
|---|---|---|
| **Balance Sheet** | Assets (cash + investments) vs. Liabilities vs. Net Worth at a point in time | Multi-table aggregation, snapshot queries |
| **Income Statement** | Revenue vs. expenses over a period (month/quarter/year) | Date-range GROUP BY, category rollups |
| **Cash Flow Statement** | Where money came from, where it went | Transaction categorization, period comparison |

### Week 9 — PDF Export + Net Worth
| Task | What You Learn |
|---|---|
| Generate PDF reports of financial statements (ReportLab or WeasyPrint) | PDF generation, templating |
| Net worth tracking over time (periodic snapshots) | Scheduled tasks, trend data |
| Historical charts (net worth, portfolio value, spending trends) | More data visualization |

### Week 10 — Docker + Deployment
| Task | What You Learn |
|---|---|
| Write a `Dockerfile` for the backend | Containerization basics |
| Write a `docker-compose.yml` (backend + database + frontend) | Multi-service orchestration |
| Deploy to Railway or Render (free tier) | Cloud deployment |
| Set up GitHub Actions (run tests on every push) | CI/CD pipeline |

---

## Phase 4: Polish & Prep (September)

| Week | Task |
|---|---|
| **Sep 1–7** | Final bug fixes, edge cases, error handling |
| **Sep 8–14** | Write a **stellar README** (screenshots, architecture diagram, setup instructions) |
| **Sep 15–21** | Record a **demo video** (2–3 min walkthrough). Deploy live version. |
| **Sep 22–28** | Update your resume with the project. Practice explaining it out loud. |

> [!TIP]
> **The README matters more than you think.** Recruiters and hiring managers will click your GitHub link. If they see a professional README with screenshots, architecture diagrams, and clear setup instructions, it signals "this person ships real software." A repo with no README signals "this was a homework assignment."

---

## Time Commitment

| Phase | Duration | Hours/Week | Total Hours |
|---|---|---|---|
| Phase 1 (Learn) | 2 weeks | ~15 hrs | ~30 hrs |
| Phase 2 (MVP) | 3 weeks | ~20 hrs | ~60 hrs |
| Phase 3 (Expand) | 5 weeks | ~15 hrs | ~75 hrs |
| Phase 4 (Polish) | 4 weeks | ~8 hrs | ~32 hrs |
| **Total** | **14 weeks** | | **~200 hrs** |

That's roughly **2–3 hours/day** on average. Very doable over the summer, especially if you have some days where you do bigger chunks.

---

## What Your Resume Will Look Like (Full Version)

```
Personal Finance & Investment Tracker | Python, FastAPI, PostgreSQL, React, Docker
- Built a full-stack personal finance application using FastAPI and PostgreSQL, 
  implementing RESTful APIs for transaction management, budget tracking, and 
  spending analytics with JWT authentication
- Designed a normalized database schema with 10+ tables; wrote SQL aggregation 
  queries for monthly spending breakdowns, budget vs. actual comparisons, and 
  financial statement generation (balance sheet, income statement, cash flow)
- Integrated Alpha Vantage stock API to track real-time portfolio performance, 
  calculating unrealized gain/loss and net worth with price caching for rate 
  limit optimization
- Developed an interactive React dashboard with Recharts visualizations and 
  auto-generated PDF financial reports using WeasyPrint
- Containerized with Docker Compose and deployed via CI/CD pipeline with 
  GitHub Actions and automated pytest testing
```

That's a **5-bullet powerhouse** that covers Python, SQL, REST APIs, external API integration, React, Docker, CI/CD, and testing — every single gap from our analysis.

---

## Next Steps

When you're ready to start, I can help you with:
1. **Setting up your Python development environment** (pyenv, venv, VS Code extensions)
2. **Installing PostgreSQL** on your Mac
3. **Scaffolding the project structure** (FastAPI boilerplate with proper folder layout)
4. **Designing the database schema** in detail

Want to get started this week?
