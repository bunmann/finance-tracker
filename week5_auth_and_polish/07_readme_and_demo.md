# Week 5 — Lesson 7: README & Demo

You've built a fully functional personal finance tracker. Now it's time to **present it professionally**. A well-written README is the first thing recruiters and hiring managers see when they click your GitHub link — it's your project's first impression.

---

## 1. Why the README Matters

Imagine two GitHub repos:
- **Repo A**: No README. Just code files. You have no idea what the project does without reading the source.
- **Repo B**: Clear description, screenshots, architecture diagram, setup instructions, API docs.

Hiring managers spend **30 seconds** deciding if a project is worth looking at. Repo B gets the interview. Repo A gets closed.

---

## 2. README Structure

Create or replace **`README.md`** in your project root (`/Users/david/Documents/PG/Finance Project/README.md`):

```markdown
# 💰 Personal Finance Tracker

A full-stack personal finance application for tracking income, expenses, budgets, and spending analytics — with CSV import from bank statements.

Built with **FastAPI** (Python) + **React** (JavaScript) + **PostgreSQL**.

![Dashboard Screenshot](docs/screenshots/dashboard.png)

---

## Features

- 📊 **Dashboard** — Monthly income, expenses, and net savings with pie chart breakdown
- 💳 **Transaction Management** — Add, view, and delete income/expense transactions
- 📁 **CSV Import** — Upload bank transaction exports with automatic duplicate detection
- 💰 **Budget Tracking** — Set monthly budget limits per category with progress bars and alerts
- 🔐 **Authentication** — Secure JWT-based signup/login with password hashing (bcrypt)
- 📱 **Responsive Design** — Works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router, Recharts, Axios |
| **Backend** | Python, FastAPI, SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Dev Tools** | Vite, ESLint |

---

## Architecture

```
┌─────────────────┐     HTTP/JSON     ┌─────────────────┐     SQL      ┌──────────────┐
│   React App     │ ◄──────────────── │   FastAPI        │ ◄────────── │  PostgreSQL   │
│   (Port 5173)   │      Axios        │   (Port 8000)    │  SQLAlchemy │  Database     │
│                 │ ─────────────────►│                  │ ──────────► │              │
│  • Dashboard    │   Bearer Token    │  • /transactions │             │  • users     │
│  • Transactions │                   │  • /categories   │             │  • categories│
│  • CSV Import   │                   │  • /dashboard    │             │  • transactions│
│  • Budgets      │                   │  • /login        │             │              │
│  • Login/Signup │                   │  • /upload-csv   │             │              │
└─────────────────┘                   └─────────────────┘             └──────────────┘
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd week3_fastapi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt]

# Start the server
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger documentation.

### Frontend Setup

```bash
cd week4_react

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Database Setup

```bash
# Create the database
createdb finance_tracker

# Tables are auto-created on first server start via SQLAlchemy
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/users` | Create a new user account | No |
| POST | `/login` | Login and receive JWT token | No |
| GET | `/transactions` | List transactions (with filtering) | Yes |
| POST | `/transactions` | Create a transaction | Yes |
| DELETE | `/transactions/{id}` | Delete a transaction | Yes |
| POST | `/transactions/upload-csv` | Import transactions from CSV | Yes |
| GET | `/categories` | List categories | Yes |
| POST | `/categories` | Create a category | Yes |
| PUT | `/categories/{id}` | Update a category | Yes |
| DELETE | `/categories/{id}` | Delete a category | Yes |
| GET | `/dashboard` | Monthly summary with budget data | Yes |

---

## Screenshots

> Add screenshots of your dashboard, transaction list, CSV import, and budget pages here.

---

## What I Learned

- Full-stack web development with a decoupled frontend and backend
- RESTful API design with FastAPI and Pydantic validation
- Relational database design with PostgreSQL and SQLAlchemy ORM
- React component architecture, state management, and React Router
- JWT authentication and password hashing with bcrypt
- File upload handling (CSV import with duplicate detection)
- CSS responsive design and modern UI patterns
```

---

## 3. Taking Screenshots

You'll want screenshots of:
1. **Dashboard** — the summary cards, pie chart, and budget alerts
2. **Transactions page** — the form and table with data
3. **CSV Import** — the upload UI with results
4. **Budget page** — progress bars with color coding
5. **Login page** — the auth form

### How to Take Good Screenshots

- Use the app with **real-looking data** (not "test" or "asdf")
- Make the browser window a consistent width (~1200px)
- Create a `docs/screenshots/` folder and save images there
- On Mac: `Cmd + Shift + 4` lets you select a region to capture

---

## 4. Recording a Demo Video

A 2–3 minute walkthrough video is extremely impressive. It shows the app in action and proves you can explain technical work clearly.

### What to Show

1. Open the app → login page appears
2. Sign up for an account → get redirected to dashboard
3. Navigate to Transactions → add a couple of transactions manually
4. Navigate to Import CSV → upload a bank CSV file → show results
5. Navigate back to Dashboard → show the updated charts and budget alerts
6. Navigate to Budgets → show progress bars, set a budget limit
7. Logout → show redirect to login

### Recording Tools (Free)

- **Mac**: QuickTime Player → File → New Screen Recording
- **For GIFs**: Use [Kap](https://getkap.co/) (Mac) — great for embedding in README
- **OBS Studio**: Free, cross-platform, more features

### Embedding in README

```markdown
![Demo](docs/demo.gif)
```

---

## 5. Final Git Commit

After creating the README and adding screenshots:

```bash
git add .
git commit -m "Add README with screenshots and project documentation"
git push
```

---

## 6. Your Task

1. Create `README.md` in the project root (use the template from Section 2).
2. Customize it with your own descriptions and any additional features you added.
3. Create the `docs/screenshots/` folder.
4. Take screenshots of each page and add them to the README.
5. (Optional but recommended) Record a demo GIF/video.
6. Commit and push everything.
7. Visit your GitHub repo page — your README should render beautifully!

---

## 🏁 MVP Checkpoint — Congratulations!

You now have a **fully functional, professionally presented personal finance tracker** with:

- ✅ User authentication (signup/login with JWT)
- ✅ Transaction CRUD (create, read, delete)
- ✅ CSV import from bank statements (with duplicate detection)
- ✅ Dashboard with charts and budget alerts
- ✅ Budget tracking with progress bars
- ✅ Loading spinners, empty states, and error handling
- ✅ Responsive, styled UI with navigation
- ✅ Professional README with screenshots

**This is a real, portfolio-worthy project.** It demonstrates full-stack development, database design, API development, authentication, file processing, and modern UI development — covering nearly every skill gap we identified for your PEY applications.
