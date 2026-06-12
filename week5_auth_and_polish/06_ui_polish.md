# Week 5 — Lesson 6: UI Polish & Error Handling

Your app works, but professional applications handle edge cases gracefully. In this lesson, we'll add **loading spinners**, **empty states**, **toast notifications**, and **error boundaries** so your app feels polished and never shows a broken white/black screen.

---

## 1. Loading Spinners

Right now, "Loading..." is just plain text. Let's replace it with an animated CSS spinner.

### CSS Spinner

Add to **`src/App.css`**:

```css
/* ========== Loading Spinner ========== */
.spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e9ecef;
    border-top: 4px solid #1a1a2e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

### How CSS Animations Work

```css
@keyframes spin {
    0% { transform: rotate(0deg); }     /* Start: no rotation */
    100% { transform: rotate(360deg); } /* End: full rotation */
}

.spinner {
    animation: spin 0.8s linear infinite;
    /*         name  duration timing repeat */
}
```

- **`@keyframes`** defines a named animation sequence
- **`animation`** applies it to an element
- **`linear`** means constant speed (no easing)
- **`infinite`** means it loops forever
- **`transform: rotate()`** rotates the element

The spinner is just a circle (`border-radius: 50%`) with one colored border segment (`border-top`) that rotates continuously.

### Using the Spinner

Replace any `Loading...` text with this reusable pattern:

```jsx
if (loading) return (
    <div className="spinner-container">
        <div className="spinner"></div>
    </div>
);
```

Update this in `Dashboard.jsx`, `TransactionList.jsx`, and `BudgetOverview.jsx`.

---

## 2. Empty States

When there's no data (no transactions, no categories), don't just show a blank page. Show a helpful message with context.

Update `TransactionList.jsx` — replace the basic empty message:

```jsx
if (transactions.length === 0) return (
    <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No transactions yet</h3>
        <p>Add your first transaction using the form above, or import a CSV file.</p>
    </div>
);
```

Add the styles to **`App.css`**:

```css
/* ========== Empty States ========== */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.empty-state h3 {
    color: #333;
    margin-bottom: 8px;
}

.empty-state p {
    color: #666;
    font-size: 14px;
}
```

---

## 3. Toast Notifications

Currently, success/error messages are shown inline in the component that triggered them. **Toast notifications** are small pop-ups that appear temporarily at the top/bottom of the screen — they're visible regardless of which page you're on.

### Creating a Toast Component

Create **`src/components/Toast.jsx`**:

```jsx
import { useState, useEffect } from 'react';

function Toast({ message, type, onClose }) {
    useEffect(() => {
        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        // Cleanup: cancel timer if Toast unmounts early
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}

export default Toast;
```

### Cleanup Functions in `useEffect`

```js
useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);  // Cleanup function
}, [onClose]);
```

The `return () => clearTimeout(timer)` is a **cleanup function**. React calls it when:
1. The component unmounts (is removed from the page)
2. The dependencies change and the effect re-runs

Without cleanup, if the toast disappears before 3 seconds (e.g., user clicks the X), the timer would still fire and try to close an already-closed toast, potentially causing errors.

### Toast Styles

Add to **`App.css`**:

```css
/* ========== Toast Notifications ========== */
.toast {
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.toast-success { background: #2ed573; }
.toast-error { background: #ff4757; }
.toast-warning { background: #ffa502; }

.toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}
```

### `position: fixed` and `z-index`

```css
position: fixed;
top: 80px;
right: 20px;
z-index: 1000;
```

- **`position: fixed`** takes the element out of normal page flow and positions it relative to the browser window. It stays in place even when the user scrolls.
- **`z-index: 1000`** ensures the toast renders on top of everything else. Higher z-index = closer to the viewer.

### Using Toast in App.jsx

Add toast state to `App.jsx`:

```jsx
import Toast from './components/Toast';

// Inside App function:
const [toast, setToast] = useState(null);

const showToast = (message, type = 'success') => {
    setToast({ message, type });
};

// In the JSX return, add before closing </div>:
{toast && (
    <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
    />
)}
```

Then pass `showToast` to components that need it:

```jsx
<TransactionForm
    onTransactionAdded={(tx) => {
        handleTransactionAdded(tx);
        showToast('Transaction added successfully!');
    }}
/>
```

---

## 4. Error Boundaries

Remember when the app went completely black because React tried to render an object? **Error boundaries** prevent that — they catch rendering errors and show a fallback UI instead of crashing the entire app.

Create **`src/components/ErrorBoundary.jsx`**:

```jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>An unexpected error occurred. Please try refreshing the page.</p>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
```

### Why a Class Component?

Error boundaries **must** be class components — this is one of the few cases where React doesn't support the equivalent functionality in function components. `getDerivedStateFromError` and `componentDidCatch` are lifecycle methods that only exist on classes.

Don't worry about memorizing class component syntax — this is essentially boilerplate that you copy once and never touch again.

### Wrapping Your App

In **`App.jsx`**, wrap your routes:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

// In the return:
<Router>
    <div className="App">
        <Navbar ... />
        <main className="main-content">
            <ErrorBoundary>
                <Routes>
                    ...
                </Routes>
            </ErrorBoundary>
        </main>
    </div>
</Router>
```

Now if any component inside `<Routes>` crashes during rendering, the error boundary catches it and shows the fallback UI instead of a black screen.

### Error Boundary Styles

```css
/* ========== Error Boundary ========== */
.error-boundary {
    text-align: center;
    padding: 60px 20px;
}

.error-boundary h2 {
    color: #ff4757;
    margin-bottom: 10px;
}

.error-boundary p {
    color: #666;
    margin-bottom: 20px;
}

.error-boundary button {
    background-color: #1a1a2e;
    color: white;
    padding: 10px 24px;
}
```

---

## 5. Your Task

1. Add the CSS spinner and replace all "Loading..." text with `<div className="spinner">`.
2. Add empty state messages to `TransactionList.jsx` and `Dashboard.jsx`.
3. Create `src/components/Toast.jsx` and wire it up in `App.jsx`.
4. Create `src/components/ErrorBoundary.jsx` and wrap your `<Routes>`.
5. Add all the new styles to `App.css`.
6. Test:
   - Add a transaction → toast appears and auto-dismisses
   - Delete a transaction → toast appears
   - Visit an empty page (no transactions) → empty state shows
   - Refresh while loading → spinner appears briefly

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **`@keyframes`** | Defines a CSS animation sequence |
| **`animation`** | Applies a keyframe animation to an element |
| **`position: fixed`** | Positions element relative to the browser window |
| **`z-index`** | Controls stacking order (higher = on top) |
| **Cleanup function** | Returned from `useEffect`, runs on unmount or re-run |
| **Error boundary** | Class component that catches rendering crashes |
| **`getDerivedStateFromError`** | Static method that updates state when a child crashes |
| **`this.props.children`** | Whatever JSX is nested inside the component |
