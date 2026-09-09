# LESSON 3: Installing & Setting Up PostgreSQL

To write and test SQL queries, you need to install PostgreSQL on both of your devices and learn how to run the interactive command-line interface.

---

## macOS Setup (Homebrew)

### 1. Installation via Homebrew

Homebrew is the standard package manager for macOS. 

Open your Mac terminal (not the Python shell) and run the following command to install PostgreSQL:

```bash
brew install postgresql
```
*(Note: If you already have it installed, version 14+ is fine, but the latest stable version is recommended).*

### Start the PostgreSQL Service:
To start the database server running in the background as a background daemon:
```bash
brew services start postgresql
```

To stop the service when you aren't using it:
```bash
brew services stop postgresql
```

---

## Windows 10 Setup

### 1. Installation
1. Download the official installer from [PostgreSQL downloads](https://www.postgresql.org/download/windows/) (version 16 or 17).
2. Run the installer and click through the default options. 
3. **Important:** It will ask you to set a password for the default database user (`postgres`). **Do not forget this password!**
4. Keep the default port (`5432`).
5. Once installed, PostgreSQL runs automatically in the background as a Windows Service. You do not need to manually start it.

### 2. Connecting to psql on Windows
The easiest way is to search your Start Menu for **"SQL Shell (psql)"**:
1. Open **SQL Shell (psql)** from your Start Menu.
2. It will ask for Server, Database, Port, and Username. Press **Enter** to accept the default values for each.
3. When it asks for **Password**, type the password you created during installation and press **Enter** (no characters will show as you type).

*(Alternatively, if you want to run `psql` in PowerShell/CMD, add `C:\Program Files\PostgreSQL\<version>\bin` to your Windows Environment Variables).*

---

## 2. Connecting to your Database (`psql`) (macOS)

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
