# Week 5 — Lesson 4: CSV Import (Frontend)

Your backend can now accept CSV file uploads. In this lesson, we'll build a **React upload component** where users can select a file, upload it to the API, and see the import results.

---

## 1. How File Uploads Work in the Browser

File uploads work differently from the JSON requests we've been sending. Here's the comparison:

| JSON Request (what we've been doing) | File Upload (what we need now) |
|---|---|
| `Content-Type: application/json` | `Content-Type: multipart/form-data` |
| Body is a JSON string | Body contains binary file data |
| `api.post('/endpoint', { key: value })` | `api.post('/endpoint', formData)` |

The browser has a built-in `FormData` API for building file upload requests:

```js
const formData = new FormData();
formData.append('file', selectedFile);  // 'file' must match the FastAPI parameter name
```

---

## 2. Creating the CSV Upload Component

Create **`src/components/CsvUpload.jsx`**:

```jsx
import { useState } from 'react';
import api from '../api';

function CsvUpload({ onImportComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && !selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file.');
            setFile(null);
            return;
        }
        setError('');
        setResult(null);
        setFile(selectedFile);
    };

    const handleUpload = () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setUploading(true);
        setError('');
        setResult(null);

        // Build a FormData object (for file uploads)
        const formData = new FormData();
        formData.append('file', file);

        api.post('/transactions/upload-csv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(response => {
                setResult(response.data);
                setFile(null);
                // Reset the file input
                document.getElementById('csv-file-input').value = '';
                // Notify parent to refresh transactions
                if (onImportComplete) {
                    onImportComplete();
                }
            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError('Upload failed. Please try again.');
                }
            })
            .finally(() => {
                setUploading(false);
            });
    };

    return (
        <div className="csv-upload">
            <h2>Import Transactions from CSV</h2>
            <p className="csv-description">
                Upload a CSV file from your bank. The file should have columns:
                <strong> Date, Description, Amount</strong>
            </p>

            <div className="csv-upload-controls">
                <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="upload-btn"
                >
                    {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {result && (
                <div className="import-results">
                    <h3>Import Results</h3>
                    <div className="result-stats">
                        <div className="result-stat success">
                            <span className="stat-number">{result.imported}</span>
                            <span className="stat-label">Imported</span>
                        </div>
                        <div className="result-stat warning">
                            <span className="stat-number">{result.skipped_duplicates}</span>
                            <span className="stat-label">Skipped (duplicates)</span>
                        </div>
                        <div className="result-stat error">
                            <span className="stat-number">{result.errors.length}</span>
                            <span className="stat-label">Errors</span>
                        </div>
                    </div>
                    {result.errors.length > 0 && (
                        <div className="error-details">
                            <h4>Error Details:</h4>
                            <ul>
                                {result.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CsvUpload;
```

Let's break down the new patterns here.

### File Input — `e.target.files[0]`

```jsx
<input type="file" accept=".csv" onChange={handleFileChange} />
```

When the user selects a file, the browser fires an `onChange` event. The selected file is at `e.target.files[0]` (it's an array because `<input>` can support multiple files, but we only want one).

```js
const selectedFile = e.target.files[0];
```

This is a `File` object — it has properties like `.name`, `.size`, and `.type`, and it contains the actual file data.

### Client-Side File Validation

```js
if (selectedFile && !selectedFile.name.endsWith('.csv')) {
    setError('Please select a CSV file.');
    setFile(null);
    return;
}
```

We check the file extension before even uploading. The `accept=".csv"` attribute on the input already filters the file picker dialog, but we double-check in code because `accept` can be bypassed.

### `FormData` — The File Upload Container

```js
const formData = new FormData();
formData.append('file', file);
```

`FormData` is a browser API that packages data for `multipart/form-data` requests. The first argument to `.append()` must match the FastAPI parameter name (`file` in our `UploadFile = File(...)` endpoint).

### `disabled` Attribute

```jsx
<button disabled={!file || uploading}>
```

This disables the button when:
- No file is selected (`!file`)
- An upload is already in progress (`uploading`)

Disabled buttons are greyed out and unclickable, preventing double-submissions.

### `.finally()` — Always Runs

```js
.then(response => { ... })
.catch(err => { ... })
.finally(() => {
    setUploading(false);
});
```

`.finally()` runs after both `.then()` and `.catch()`. We use it to set `uploading` back to `false` regardless of whether the upload succeeded or failed.

---

## 3. Adding the Route to App.jsx

Add the import route to your `App.jsx`. Add the import at the top:

```jsx
import CsvUpload from './components/CsvUpload';
```

Then add a new route inside the logged-in routes (next to the Dashboard and Transactions routes):

```jsx
<Route path="/import" element={
    <CsvUpload onImportComplete={() => {
        // Re-fetch transactions after import
        api.get('/transactions')
            .then(response => setTransactions(response.data));
    }} />
} />
```

### Refreshing After Import

The `onImportComplete` callback re-fetches all transactions from the API after a CSV import. This ensures the transaction list and dashboard reflect the newly imported data.

---

## 4. Adding an Import Link to the Navbar

Update the logged-in links in **`Navbar.jsx`**:

```jsx
{isLoggedIn ? (
    <>
        <Link to="/">Dashboard</Link>
        <Link to="/transactions">Transactions</Link>
        <Link to="/import">Import CSV</Link>
        <button onClick={onLogout} className="logout-btn">Logout</button>
    </>
) : (
    // ...login/signup links
)}
```

---

## 5. Adding Styles for the Upload Component

Add to **`src/App.css`**:

```css
/* ========== CSV Upload ========== */
.csv-upload {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.csv-description {
    color: #666;
    margin-bottom: 15px;
}

.csv-upload-controls {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-bottom: 15px;
}

.upload-btn {
    background-color: #1a1a2e;
    color: white;
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
}

.upload-btn:disabled {
    background-color: #999;
    cursor: not-allowed;
}

.upload-btn:hover:not(:disabled) {
    background-color: #16213e;
}

/* ========== Import Results ========== */
.import-results {
    margin-top: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
}

.result-stats {
    display: flex;
    gap: 20px;
    margin: 15px 0;
}

.result-stat {
    flex: 1;
    text-align: center;
    padding: 15px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.result-stat .stat-number {
    display: block;
    font-size: 28px;
    font-weight: 700;
}

.result-stat .stat-label {
    color: #666;
    font-size: 13px;
}

.result-stat.success .stat-number { color: #2ed573; }
.result-stat.warning .stat-number { color: #ffa502; }
.result-stat.error .stat-number { color: #ff4757; }

.error-details {
    margin-top: 15px;
    padding: 15px;
    background: #fff5f5;
    border-radius: 6px;
    border-left: 4px solid #ff4757;
}

.error-details ul {
    margin-left: 20px;
    color: #666;
}
```

---

## 6. Your Task

1. Create `src/components/CsvUpload.jsx` with the upload component.
2. Add the `/import` route to `App.jsx`.
3. Add the "Import CSV" link to `Navbar.jsx`.
4. Add the CSV upload styles to `App.css`.
5. Test the full flow:
   - Navigate to `/import`
   - Upload `sample_transactions.csv` → verify import results show correctly
   - Check `/transactions` → verify the imported transactions appear in the list
   - Upload the same file again → verify it shows "0 imported, 10 skipped"
   - Check the dashboard → verify the charts update with the imported data

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **`<input type="file">`** | HTML element for file selection |
| **`e.target.files[0]`** | Access the selected file from the input event |
| **`FormData`** | Browser API for packaging file upload requests |
| **`multipart/form-data`** | HTTP encoding for sending files |
| **`accept=".csv"`** | Filters file picker to only show CSV files |
| **`disabled` attribute** | Prevents button clicks when conditions aren't met |
| **`.finally()`** | Promise method that runs after both success and failure |
| **`onImportComplete` callback** | Pattern for child components to trigger parent state updates |
