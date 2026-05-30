# LESSON 3: Installing & Setting Up PostgreSQL

To write and test SQL queries, we need to install PostgreSQL on your Mac and learn how to run the interactive command-line interface.

---

## 1. Installation via Homebrew

Homebrew is the standard package manager for macOS. 

Open your Mac terminal (not the Python shell) and run the following command to install PostgreSQL:

```bash
brew install postgresql@14
```
*(Note: If you already have it installed, or want to install a different version, that's fine. Version 14+ is recommended).*

### Start the PostgreSQL Service:
To start the database server running in the background as a background daemon:
```bash
brew services start postgresql@14
```

To stop the service when you aren't using it:
```bash
brew services stop postgresql@14
```

---

## 2. Connecting to your Database (`psql`)

`psql` is the interactive terminal client for PostgreSQL. 

By default, Homebrew creates a database matching your macOS username (e.g. `david`). To connect to the database server, run:

```bash
psql postgres
```
This should change your terminal prompt to: `postgres=#` (the database superuser console).

---

## 3. Essential `psql` Commands (The "Slash" Commands)

Inside the `psql` shell, normal SQL commands end with a semicolon `;`. 
However, shell control commands start with a backslash `\` and do not require a semicolon:

| Command | Action |
| :--- | :--- |
| **`\l`** | **List** all databases on this server |
| **`\c database_name`** | **Connect** to a different database |
| **`\dt`** | **Display Tables** in the current database |
| **`\d table_name`** | Describe the schema (columns, types, keys) of a specific table |
| **`\q`** | **Quit** the psql shell and return to your terminal |

---

## 4. Let's practice (Create a playground DB)

Once you enter `psql postgres`, run these commands to set up a playground:

```sql
-- 1. Create a database for your exercises:
CREATE DATABASE pg_playground;

-- 2. Connect to it:
\c pg_playground

-- 3. Create a test table:
CREATE TABLE test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 4. Verify it was created:
\dt

-- 5. Insert a record:
INSERT INTO test_users (name) VALUES ('David');

-- 6. Read it back:
SELECT * FROM test_users;

-- 7. Quit:
\q
```
