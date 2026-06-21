# 💰 Personal Finance Tracker

A full-stack personal finance application for tracking transactions, managing budgets, importing bank statements, and visualizing spending — built with **FastAPI**, **PostgreSQL**, **React**, and **Recharts**.

> 🚧 **Active Development** — Stock portfolio tracking, AI-powered categorization, financial statements, and Docker deployment are coming next.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Transaction Management** | Create, view, search, filter, and delete income/expense transactions with pagination |
| **Category System** | Default + custom categories with emoji icons for organizing transactions |
| **Budget Tracking** | Set monthly budgets per category with real-time progress bars and overspend alerts |
| **CSV Import** | Upload bank statement CSVs with SHA256 fingerprint-based duplicate detection |
| **Interactive Dashboard** | Monthly spending breakdown (pie chart), income vs. expense trends (bar chart), and summary cards |
| **User Authentication** | Secure signup/login with bcrypt password hashing and JWT access tokens |
| **Polished UI** | Loading spinners, empty states, toast notifications, error boundaries, and responsive layout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router, Axios, Recharts |
| **Backend** | Python 3, FastAPI, Pydantic, SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (PyJWT) + bcrypt |
| **Dev Tools** | Vite, Uvicorn, Git |

---

## 📁 Project Structure

```
Finance Project/
├── week3_fastapi/              # Backend API
│   ├── main.py                 # FastAPI app entry point, CORS, router registration
│   ├── database.py             # SQLAlchemy engine & session config
│   ├── models.py               # Database tables (User, Category, Transaction)
│   ├── schemas.py              # Pydantic request/response models
│   ├── auth.py                 # JWT token creation & verification, password hashing
│   └── routers/
│       ├── auth.py             # POST /signup, POST /login
│       ├── transactions.py     # CRUD + search/filter/pagination + CSV import
│       ├── categories.py       # CRUD + budget updates + deletion protection
│       └── dashboard.py        # GET /dashboard (aggregated spending analytics)
│
├── week4_react/                # Frontend SPA
│   └── src/
│       ├── App.jsx             # Root component, routing, global state
│       ├── api.js              # Axios instance with JWT interceptor
│       ├── App.css             # Global styles
│       └── components/
│           ├── Dashboard.jsx       # Charts + summary cards
│           ├── TransactionList.jsx  # Paginated transaction table
│           ├── TransactionForm.jsx  # Add transaction form
│           ├── CsvUpload.jsx       # Bank statement CSV importer
│           ├── BudgetOverview.jsx  # Budget cards with progress bars
│           ├── LoginPage.jsx       # Login form
│           ├── SignupPage.jsx      # Registration form
│           ├── Navbar.jsx          # Navigation bar
│           ├── Toast.jsx           # Auto-dismissing notifications
│           └── ErrorBoundary.jsx   # React error boundary fallback
│
└── sample_transactions.csv     # Example CSV for testing imports
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** and `pip`
- **Node.js 18+** and `npm`
- **PostgreSQL** (running locally)

### 1. Database Setup

```bash
# Create the PostgreSQL database
createdb finance_tracker
```

### 2. Backend Setup

```bash
cd week3_fastapi

# Create and activate a virtual environment
python3 -m venv ../venv
source ../venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pyjwt bcrypt python-multipart

# Start the API server (auto-reloads on file changes)
uvicorn main:app --reload
```

The API will be running at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

### 3. Frontend Setup

```bash
cd week4_react

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at **http://localhost:5173**.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Create a new user account |
| `POST` | `/login` | Authenticate and receive a JWT token |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/transactions` | List all transactions (supports `?search=`, `?type=`, `?category=`, `?skip=`, `?limit=`) |
| `POST` | `/transactions` | Create a new transaction |
| `DELETE` | `/transactions/{id}` | Delete a transaction |
| `POST` | `/transactions/import-csv` | Import transactions from a CSV file |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all categories for the current user |
| `POST` | `/categories` | Create a new category |
| `PUT` | `/categories/{id}` | Update category name, icon, or monthly budget |
| `DELETE` | `/categories/{id}` | Delete a category (blocked if transactions are linked) |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Aggregated analytics: totals, category breakdown, monthly trends |

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   transactions   │       │  categories  │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)          │    ┌──│ id (PK)      │
│ email (UQ)   │  │    │ amount           │    │  │ name         │
│ password_hash│  ├───>│ description      │    │  │ icon         │
│              │  │    │ date             │    │  │ monthly_budget│
│              │  │    │ type             │    │  │ user_id (FK) │──┐
│              │  │    │ user_id (FK)  ───┘    │  └──────────────┘  │
│              │  │    │ category_id (FK)──────┘                    │
│              │  │    │ fingerprint      │                         │
└──────────────┘  │    └──────────────────┘                         │
                  └────────────────────────────────────────────────┘
```

---

## 🗺️ Roadmap

- [x] Python fundamentals & data structures
- [x] SQL + PostgreSQL (schema design, queries, joins)
- [x] FastAPI REST API (CRUD, validation, filtering, pagination)
- [x] React frontend (dashboard, forms, charts)
- [x] JWT authentication (signup, login, protected routes)
- [x] CSV import with duplicate detection
- [x] Budget tracking with progress visualization
- [x] UI polish (spinners, toasts, error boundaries)
- [ ] Stock portfolio backend (Alpha Vantage API integration)
- [ ] Stock portfolio frontend (charts, P&L tracking)
- [ ] AI-powered transaction categorization (Google Gemini API)
- [ ] Financial statements (balance sheet, income statement, cash flow)
- [ ] Docker containerization & deployment

---

## 📄 License

This project is for educational purposes as part of a summer learning program.
