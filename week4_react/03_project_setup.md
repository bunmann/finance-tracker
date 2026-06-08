# Week 4 — Lesson 3: Project Setup & API Connection

Now that you understand what React components, props, state, and effects are, let's set up the actual project and connect it to your FastAPI backend.

---

## 1. Creating the React Project with Vite

**Vite** (pronounced "veet" — it's French for "fast") is a modern build tool that creates React projects instantly and provides a blazing fast development server with hot-reload (just like uvicorn's `--reload`).

### Step 1: Create the project

Run this from your **Finance Project root directory** (not inside `week3_fastapi`):

```bash
npm create vite@latest week4_react -- --template react
```

- `week4_react` — the folder name for your frontend project
- `--template react` — tells Vite to set up a React project (not Vue, Svelte, etc.)

### Step 2: Install dependencies

```bash
cd week4_react
npm install
```

This reads the `package.json` file (like Python's `requirements.txt`) and downloads all the packages React needs.

### Step 3: Start the dev server

```bash
npm run dev
```

You should see something like:
```
  VITE v6.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser — you'll see the default Vite + React welcome page!

> **Two servers running simultaneously:** From now on, you'll have **two terminals open**:
> 1. Terminal 1: `uvicorn main:app --reload` (backend on port `8000`)
> 2. Terminal 2: `npm run dev` (frontend on port `5173`)

---

## 2. Project Structure

After Vite creates your project, you'll see this structure:

```
week4_react/
├── public/            # Static files (favicon, images)
├── src/               # YOUR CODE GOES HERE
│   ├── App.jsx        # The root component (entry point of your UI)
│   ├── App.css        # Styles for App component
│   ├── main.jsx       # Mounts React to the HTML page (don't touch this)
│   └── index.css      # Global styles
├── index.html         # The single HTML page React renders into
├── package.json       # Dependencies list (like requirements.txt)
└── vite.config.js     # Vite configuration
```

**Key rule:** Almost all of your work will be inside the `src/` folder.

---

## 3. Installing Axios — Your API Client

**Axios** is a popular JavaScript library for making HTTP requests to your backend API. It's like Python's `requests` library, but for JavaScript.

Install it:
```bash
npm install axios
```

### Why Axios over `fetch`?

JavaScript has a built-in `fetch()` function, but Axios is nicer to work with:

| Feature | `fetch()` | Axios |
|---|---|---|
| Auto JSON parsing | No (need `.json()` step) | Yes (automatic) |
| Error handling | Only throws on network errors | Throws on 4xx/5xx too |
| Request config | Verbose | Clean and simple |

---

## 4. Setting Up the API Connection

Create a new file to centralize your API connection. This way, you don't have to repeat the base URL in every component:

Create the file **`src/api.js`**:

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',  // Your FastAPI backend URL
});

export default api;
```

Now, in any component, you can import `api` and make requests like:
```javascript
import api from './api';

// GET request
const response = await api.get('/transactions');

// POST request
const response = await api.post('/users', { email: "test@example.com", password: "123" });
```

---

## 5. Fixing CORS — Letting the Frontend Talk to the Backend

Right now, if your React app (running on `localhost:5173`) tries to call your FastAPI backend (running on `localhost:8000`), the browser will **block the request** with a CORS error.

**CORS** (Cross-Origin Resource Sharing) is a browser security feature that prevents websites from making requests to a different domain/port than the one they're served from. Since your frontend and backend are on different ports, the browser sees them as different "origins."

### The fix: Add CORS middleware to FastAPI

Open your backend's [main.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/main.py) and add this near the top (after creating the `app`):

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow the React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],       # Allow all headers
)
```

> **What this does:** It tells your FastAPI backend: "If a request comes from `localhost:5173`, that's okay — let it through."

---

## 6. Cleaning Up the Default Vite Files

Before we start building, let's clean out the default Vite boilerplate code.

### Replace `src/App.jsx` with a clean starting point:

```jsx
import { useState, useEffect } from 'react';
import api from './api';
import './App.css';

function App() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        api.get('/')
            .then(response => setMessage(response.data.message))
            .catch(error => setMessage('Error connecting to API'));
    }, []);

    return (
        <div className="App">
            <h1>Finance Tracker</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;
```

### Replace `src/App.css` with an empty file (we'll style later):

```css
/* We'll add styles in Lesson 7 */
```

---

## 7. Your Task

1. **Create the Vite project** using the commands in Step 1.
2. **Install axios** (`npm install axios`).
3. **Create `src/api.js`** with the Axios base URL config.
4. **Add CORS middleware** to your FastAPI backend's `main.py`.
5. **Clean up `App.jsx`** with the starter code above.
6. **Run both servers:**
   - Terminal 1: `cd week3_fastapi && uvicorn main:app --reload`
   - Terminal 2: `cd week4_react && npm run dev`
7. **Open `http://localhost:5173`** in your browser.

If everything is connected correctly, you should see:
```
Finance Tracker
Hello World! Welcome to your Finance API.
```

The message is being **fetched live from your FastAPI backend** and displayed by React. Your frontend and backend are officially connected! 🎉

---

## 8. How the Full Data Flow Works Now

```
User's Browser (React on :5173)
        │
        │  HTTP request (via Axios)
        ▼
FastAPI Backend (:8000)
        │
        │  SQLAlchemy ORM query
        ▼
PostgreSQL Database
        │
        │  Returns rows
        ▼
FastAPI formats JSON response
        │
        │  HTTP response
        ▼
React receives data → updates state → re-renders UI
```

This is the **full-stack architecture** you'll use for the entire project.
