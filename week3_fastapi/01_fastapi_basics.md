# LESSON 1: Introduction to FastAPI & REST APIs

Welcome to **Week 3**! We are transitioning from simple scripts and databases to building a **REST API**. This backend service will act as the bridge between your PostgreSQL database and your future React frontend.

---

## 1. What is a REST API?

A **REST API** (Representational State Transfer Application Programming Interface) allows two systems to communicate over the web using HTTP. 

Think of it like ordering food at a restaurant:
* **The Client (Frontend):** You (the customer) looking at the menu and placing an order.
* **The Server (Backend API):** The waiter who takes your order to the kitchen, retrieves your food, and serves it back to you.

### HTTP Methods (The CRUD of the Web)
Just like SQL has CRUD commands, HTTP has **Methods** (or Verbs) that define the action:

| HTTP Method | SQL Equivalent | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **`GET`** | `SELECT` | Read data | Get all transactions |
| **`POST`** | `INSERT` | Create new data | Add a new transaction |
| **`PUT` / `PATCH`** | `UPDATE` | Update existing data | Edit a transaction |
| **`DELETE`** | `DELETE` | Delete data | Remove a transaction |

---

## 2. Setting Up Your Week 3 Environment

We will install the required packages inside your virtual environment (`venv`).

### 1. Activate your virtual environment:
Open your terminal and run:
```bash
source venv/bin/activate
```

### 2. Install FastAPI and Uvicorn:
* **FastAPI:** The web framework we will use.
* **Uvicorn:** A lightning-fast ASGI server that runs your FastAPI code.
```bash
pip install fastapi uvicorn
```

---

## 3. Your First FastAPI App ("Hello World")

Let's see how simple it is to write an API endpoint.

### 1. Create `week3_fastapi/main.py`:
```python
from fastapi import FastAPI

# Initialize the app
app = FastAPI()

# Define a GET endpoint at the root URL ("/")
@app.get("/")
def read_root():
    return {"message": "Hello World! Welcome to your Finance API."}
```

### 2. Run the server:
In your terminal, navigate to the `week3_fastapi` directory and run:
```bash
uvicorn main:app --reload
```
* **`main:app`** tells Uvicorn to look in `main.py` for the object named `app`.
* **`--reload`** restarts the server automatically whenever you change your code.

### 3. Open your browser:
Navigate to: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)  
You should see: `{"message": "Hello World! Welcome to your Finance API."}`

---

## 4. 🚀 The FastAPI Superpower: Auto-Documentation

FastAPI automatically generates interactive API documentation for you using Swagger UI.

While your server is running, go to:  
👉 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Here, you can see all your endpoints, inspect what parameters they expect, and click **"Try it out"** to execute API requests directly from your browser!
