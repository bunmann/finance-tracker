# Week 4 — Lesson 2: React Basics

## 1. What is React?

Now that you understand HTML (structure), CSS (style), and JavaScript (logic), we can talk about React.

React is a **JavaScript library** for building user interfaces. It was created by Facebook and is the most popular frontend framework in the industry.

**The core idea:** Instead of writing one giant HTML file, you break your UI into small, reusable **components** (like Lego bricks). Each component manages its own piece of the screen.

Think of it like this:
- In C++, you organize code into **classes and functions**.
- In Python/FastAPI, you organize code into **routes and models**.
- In React, you organize your UI into **components**.

**Your analogy was spot-on:** Just like SQLAlchemy lets you write SQL inside Python, React (using JSX) lets you write HTML inside JavaScript. Same idea — embed one language inside another so your logic and structure live in the same place.

---

## 2. JSX — HTML Inside JavaScript

React uses a syntax called **JSX** (JavaScript XML). It looks like HTML, but it lives inside JavaScript files:

```jsx
function Welcome() {
    return <h1>Hello, World!</h1>;
}
```

This is a **React component** — it's just a JavaScript function that returns JSX (which looks like HTML).

### Key JSX rules:
| Rule | Example |
|------|---------|
| Must return **one** parent element | Wrap everything in a `<div>` or `<>...</>` (fragment) |
| Use `className` instead of `class` | `<div className="box">` (because `class` is reserved in JS) |
| Use `{}` to embed JavaScript expressions | `<p>Total: {2 + 2}</p>` renders as "Total: 4" |
| Self-closing tags need `/` | `<img src="..." />` not `<img src="...">` |

---

## 3. Components — Building Blocks of React

Every piece of your UI is a component. Components can be nested inside other components:

```jsx
// A small, reusable component
function TransactionRow({ description, amount }) {
    return (
        <tr>
            <td>{description}</td>
            <td>${amount}</td>
        </tr>
    );
}

// A parent component that USES TransactionRow
function TransactionTable() {
    return (
        <table>
            <tbody>
                <TransactionRow description="Pizza" amount={20} />
                <TransactionRow description="Rent" amount={1200} />
            </tbody>
        </table>
    );
}
```

### Props — Passing Data to Components

**Props** (short for "properties") are how you pass data from a parent component to a child component. They work like **function parameters** in C++/Python.

In the example above:
- `description` and `amount` are **props**.
- `TransactionTable` passes `"Pizza"` and `20` **down** to `TransactionRow`.
- Props are **read-only** — the child cannot modify them (just like `const` parameters in C++).

---

## 4. State — Making Components Interactive

**State** is data that can **change over time** inside a component. When state changes, React **automatically re-renders** the component to reflect the new data on screen.

You create state using the `useState` hook:

```jsx
import { useState } from 'react';

function Counter() {
    // Declare a state variable called "count", starting at 0
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>You clicked {count} times</p>
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    );
}
```

### Breaking down `useState`:
```
const [count, setCount] = useState(0);
        ^        ^                 ^
        |        |                 |
   current    setter          initial
    value    function           value
```

- **`count`** — the current value of the state (starts at `0`).
- **`setCount`** — a function to update the state. When you call `setCount(5)`, React updates `count` to `5` and re-renders the component.
- **`useState(0)`** — `0` is the initial value.

> **Why not just use a regular variable?** Because React wouldn't know the variable changed. `useState` tells React: "Hey, this value changed — please re-render the screen!"

---

## 5. useEffect — Running Code When the Component Loads

`useEffect` is how you run **side effects** — things like fetching data from your API, setting up timers, or updating the document title.

```jsx
import { useState, useEffect } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);

    // This runs ONCE when the component first appears on screen
    useEffect(() => {
        fetch("http://127.0.0.1:8000/users")
            .then(response => response.json())
            .then(data => setUsers(data));
    }, []);  // <-- empty array means "run only once on mount"

    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.email}</li>
            ))}
        </ul>
    );
}
```

### The dependency array `[]`:
| What you pass | When useEffect runs |
|---|---|
| `[]` (empty array) | Only **once**, when the component first loads (like `componentDidMount`) |
| `[count]` | Every time `count` changes |
| Nothing (no array) | After **every** re-render (usually not what you want) |

---

## 6. How React Compares to What You Know

| Concept | C++ Equivalent | Python/FastAPI Equivalent | React |
|---|---|---|---|
| Code organization | Classes | Modules/Routes | **Components** |
| Passing data | Constructor params | Function params | **Props** |
| Mutable data | Member variables | Instance variables | **State (`useState`)** |
| Initialization | Constructor | `__init__` | **`useEffect(() => {}, [])`** |
| Rendering | `cout <<` / `print()` | `return {...}` in endpoint | **`return <JSX />`** |

---

## 7. Summary — What You Need to Remember

Before moving to Lesson 3, make sure you understand these 4 core concepts:

1. **Components** — Functions that return JSX (HTML-like syntax). The building blocks of your UI.
2. **Props** — How data flows **down** from parent to child. Read-only.
3. **State (`useState`)** — Data that changes over time. When it changes, the component re-renders.
4. **Effects (`useEffect`)** — Code that runs when the component loads or when specific values change (like fetching data from your API).

> **Don't worry about memorizing syntax.** You'll internalize it by building real features in the next lessons. The important thing is understanding *what* each concept is for, not the exact code.
