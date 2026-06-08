# Week 4 — Lesson 1: Web Foundations (HTML, CSS, JS)

Welcome to the frontend! This week you'll build the visual interface that users actually see and interact with. Your FastAPI backend is the engine — React is the dashboard, steering wheel, and everything the driver touches.

Before we get into React, you need to understand the three technologies that **every** web page is built with: HTML, CSS, and JavaScript.

---

## 1. The Three Building Blocks of Every Web Page

Every page you see in a browser — Google, YouTube, your bank's website — is built from three things working together:

| Technology | What it does | Analogy |
|---|---|---|
| **HTML** | Defines the **structure and content** — what elements exist on the page | The **skeleton** of a body. It defines "there's a head, two arms, two legs." |
| **CSS** | Defines the **appearance and style** — colors, sizes, spacing, layout | The **skin, clothes, and hair**. It says "the shirt is blue, the hair is short." |
| **JavaScript** | Defines the **behavior and logic** — what happens when you click, type, or scroll | The **brain and muscles**. It says "when you wave your hand, say hello." |

You already know some JavaScript basics from Apps Script, and many concepts carry over from Python and C++. Section 4 below covers the key JS syntax differences you'll need for React.

---

## 2. HTML — The Structure of a Web Page

HTML stands for **HyperText Markup Language**. It uses **tags** to define elements on a page. Every tag has an opening tag and a closing tag:

```html
<h1>This is a heading</h1>
<p>This is a paragraph of text.</p>
<button>Click Me</button>
```

- `<h1>` is the opening tag, `</h1>` is the closing tag.
- The text between them is the **content** of that element.
- The slash `/` in the closing tag tells the browser "this element ends here."

### Common HTML Tags You'll Use

| Tag | What it creates | Example |
|---|---|---|
| `<h1>` to `<h6>` | Headings (h1 is biggest, h6 is smallest) | `<h1>Finance Tracker</h1>` |
| `<p>` | A paragraph of text | `<p>Welcome to my app.</p>` |
| `<div>` | A generic container/box (used to group elements) | `<div> ... stuff inside ... </div>` |
| `<button>` | A clickable button | `<button>Submit</button>` |
| `<input>` | A text input field (like a form box) | `<input type="text" />` |
| `<img>` | An image | `<img src="photo.jpg" />` |
| `<table>`, `<tr>`, `<td>` | A table, table row, table cell | See below |
| `<ul>`, `<li>` | An unordered (bullet) list and list items | `<ul><li>Item 1</li></ul>` |
| `<a>` | A hyperlink | `<a href="https://google.com">Google</a>` |

### Parent and Child Elements (Nesting)

HTML elements can be **nested inside each other**, like folders inside folders:

```html
<div>
    <h1>My App</h1>
    <p>Welcome!</p>
    <button>Click Me</button>
</div>
```

In this example:
- `<div>` is the **parent element** — it's the outer container.
- `<h1>`, `<p>`, and `<button>` are **child elements** — they live inside the parent.

You can nest deeper too:
```html
<div>                          <!-- Parent (level 1) -->
    <div>                      <!-- Child of outer div, Parent of h1 (level 2) -->
        <h1>Hello</h1>        <!-- Child (level 3) -->
    </div>
</div>
```

**This is exactly like Python dictionaries or C++ structs nested inside each other.** The outer one is the parent, the inner ones are children.

### HTML Attributes — Extra Info on Tags

Tags can have **attributes** that give them extra information (like function parameters):

```html
<img src="photo.jpg" width="200" />
<a href="https://google.com">Click here</a>
<input type="text" placeholder="Enter your name" />
```

- `src`, `width`, `href`, `type`, `placeholder` are all **attributes**.
- They provide configuration for the element, just like passing arguments to a function.

### Self-Closing Tags

Some HTML tags don't wrap any content. They are **self-closing** — they don't have a separate closing tag:

```html
<img src="photo.jpg" />     <!-- image — no text content inside -->
<input type="text" />        <!-- input field — no text content inside -->
<br />                        <!-- line break -->
```

The `/` at the end says "this tag opens and closes itself." (Standard HTML is more lenient about this, but React/JSX requires the `/`.)

---

## 3. CSS — Making Things Look Good

CSS stands for **Cascading Style Sheets**. It controls how HTML elements **look** — colors, sizes, fonts, spacing, layout, etc.

### How CSS Works

You write **rules** that target HTML elements and change their appearance:

```css
/* Make all h1 headings blue and large */
h1 {
    color: blue;
    font-size: 32px;
}

/* Make all buttons have a green background with white text */
button {
    background-color: green;
    color: white;
    padding: 10px 20px;      /* 10px top/bottom, 20px left/right */
    border: none;
    border-radius: 5px;       /* rounded corners */
}
```

### CSS Selectors — Targeting Specific Elements

| Selector | What it targets | Example |
|---|---|---|
| `h1` | All `<h1>` elements | `h1 { color: red; }` |
| `.card` | All elements with `class="card"` | `.card { background: white; }` |
| `#header` | The single element with `id="header"` | `#header { height: 60px; }` |

The **class** selector (`.`) is by far the most common. You assign a class to an HTML element, then style it in CSS:

```html
<!-- HTML -->
<div class="card">
    <h1 class="title">Hello</h1>
</div>
```

```css
/* CSS */
.card {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
}

.title {
    color: darkblue;
}
```

### Common CSS Properties You'll Use

| Property | What it does | Example |
|---|---|---|
| `color` | Text color | `color: white;` |
| `background-color` | Background color | `background-color: #1a1a2e;` |
| `font-size` | Text size | `font-size: 18px;` |
| `padding` | Space **inside** the element (between content and border) | `padding: 10px;` |
| `margin` | Space **outside** the element (between it and neighbors) | `margin: 20px;` |
| `border` | Border around the element | `border: 1px solid gray;` |
| `border-radius` | Rounded corners | `border-radius: 8px;` |
| `width` / `height` | Size of the element | `width: 300px;` |
| `display: flex` | Arrange children in a row or column | `display: flex;` |
| `text-align` | Align text left/center/right | `text-align: center;` |

> **Think of CSS like this:** HTML says "put a box here." CSS says "make that box blue, 300px wide, with rounded corners and white text."

### Where Does CSS Go?

In React, you'll write CSS in separate `.css` files and import them. We'll set this up in Lesson 3. For now, just understand that CSS = appearance rules.

---

## 4. JavaScript Basics — Key Differences from Python

You know Python. JavaScript is surprisingly similar in many ways, but has some different syntax. Here's a quick translation guide for the JS you'll see in React:

### Variables

```javascript
// Python:  name = "David"
// JavaScript:
const name = "David";    // const = can't be reassigned (like a constant)
let count = 0;           // let = can be reassigned later
count = 5;               // this is fine with let
```

> Use `const` by default. Only use `let` when you know the value will change.

### Functions

```javascript
// Python:
// def greet(name):
//     return f"Hello {name}"

// JavaScript (regular function):
function greet(name) {
    return `Hello ${name}`;     // backticks `` for string interpolation (like f-strings)
}

// JavaScript (arrow function — you'll see this EVERYWHERE in React):
const greet = (name) => {
    return `Hello ${name}`;
};

// Arrow function shorthand (if it's a one-liner):
const greet = (name) => `Hello ${name}`;
```

**Arrow functions** (`=>`) are just a shorter way to write functions. They're used constantly in React. Think of `=>` as Python's `lambda`, but more powerful.

### String Interpolation (f-strings)

```javascript
// Python:  f"Hello {name}, you are {age} years old"
// JavaScript uses backticks:
`Hello ${name}, you are ${age} years old`
```

Note: backticks `` ` `` not regular quotes. And `${}` instead of just `{}`.

### Arrays (Python Lists)

```javascript
// Python:  numbers = [1, 2, 3]
const numbers = [1, 2, 3];

// Python:  numbers.append(4)
numbers.push(4);

// Python:  [x * 2 for x in numbers]   (list comprehension)
numbers.map(x => x * 2);               // [2, 4, 6]  — .map() is the JS equivalent

// Python:  [x for x in numbers if x > 2]   (filtered list comprehension)
numbers.filter(x => x > 2);             // [3]
```

> **`.map()` is critical in React.** It's how you turn a list of data into a list of HTML elements. You'll use it in almost every component.

### Objects (Python Dictionaries)

```javascript
// Python:  person = {"name": "David", "age": 20}
const person = { name: "David", age: 20 };  // no quotes needed on keys

// Python:  person["name"]
person.name;    // dot notation (more common in JS)

// Destructuring — pull values out of an object into variables:
const { name, age } = person;
// Now name = "David" and age = 20
// This is like Python's: name, age = person["name"], person["age"]
```

### Console Logging (Python's print)

```javascript
// Python:  print("hello")
console.log("hello");

// Python:  print(f"Count is {count}")
console.log(`Count is ${count}`);
```

### Semicolons

JavaScript uses semicolons `;` at the end of statements (like C++). They're technically optional in modern JS, but you'll see them everywhere.

### Ternary Operator `? :` (Inline If/Else)

```javascript
// Python:  status = "adult" if age >= 18 else "minor"
// JavaScript:
const status = age >= 18 ? "adult" : "minor";
//             condition  ^ if true  ^ if false
```

You'll use this **constantly** in React to conditionally show or hide things on screen:
```jsx
// Show "Loading..." while data is being fetched, otherwise show the data
<p>{isLoading ? "Loading..." : `You have ${count} transactions`}</p>
```

### Spread Operator `...` (Unpacking)

The `...` operator "unpacks" an array or object — like spilling a bag of Legos onto a table so you can add more pieces:

```javascript
// Python:  new_list = [*old_list, new_item]
// JavaScript:
const oldList = [1, 2, 3];
const newList = [...oldList, 4];    // [1, 2, 3, 4]

// Python:  new_dict = {**old_dict, "key": "new_value"}
// JavaScript:
const oldObj = { name: "David", age: 20 };
const newObj = { ...oldObj, age: 21 };   // { name: "David", age: 21 }
```

> **Why this matters in React:** When you update state, you must create a **new** array/object instead of modifying the old one. The spread operator is how you do that.

### Async/Await (Same Concept as Python)

When you fetch data from an API, the response doesn't come back instantly. `async/await` lets you write code that **waits** for the response:

```javascript
// The function must be marked "async"
const fetchData = async () => {
    const response = await api.get('/transactions');  // waits for response
    console.log(response.data);                       // runs after response arrives
};
```

This works exactly like Python's `async/await`. The `await` keyword pauses execution until the result is ready.

### `===` vs `==` (Strict Equality)

```javascript
// == converts types before comparing (can cause bugs):
"5" == 5      // true   (string "5" gets converted to number 5)

// === compares value AND type (safe, always use this):
"5" === 5     // false  (string vs number = not equal)
5 === 5       // true   (same type, same value)
```

> **Rule of thumb:** Always use `===` in JavaScript. Pretend `==` doesn't exist.

### Import/Export (Python's Import System)

JavaScript splits code across files using `import` and `export`:

```javascript
// ---- api.js ----
// "export default" = this is the main thing this file provides
const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });
export default api;

// ---- App.jsx ----
// Import the default export from api.js
import api from './api';

// ---- Another example with named exports (like Python's "from X import Y") ----
// math.js exports multiple things:
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// Other file imports specific ones:
import { add, subtract } from './math';
```
