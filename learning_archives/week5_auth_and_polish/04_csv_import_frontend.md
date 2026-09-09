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

## 3. Integrating CsvUpload into the Transactions View

To create a seamless user experience, we will integrate `CsvUpload` directly inside our existing `/transactions` view. This keeps manual entry and bulk-import in one single location.

Add the component import at the top of **`App.jsx`**:

```jsx
import CsvUpload from './components/CsvUpload';
```

Next, add a callback function `handleImportComplete` inside the `App` component definition (below your existing handlers) to refresh the transaction state after importing:

```javascript
const handleImportComplete = () => {
    api.get('/transactions')
        .then(response => setTransactions(response.data))
        .catch(error => console.error('Error fetching transactions after import:', error));
};
```

Finally, update your `/transactions` route inside **`App.jsx`** to nest the uploader alongside the form:

```jsx
<Route path="/transactions" element={
    <div className="transactions-page">
        <div className="transactions-forms">
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
            <CsvUpload onImportComplete={handleImportComplete} />
        </div>
        <TransactionList
            transactions={transactions}
            loading={loading}
            onDelete={handleTransactionDeleted}
        />
    </div>
} />
```

---

## 4. Styling the Forms Layout

To display the manual transaction form and the CSV uploader side-by-side, we add a flexible layout grid along with the CSV upload element styles.

Add the following to the bottom of **`src/App.css`**:

```css
/* ========== Layout Grid ========== */
.transactions-page {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.transactions-forms {
    display: flex;
    gap: 20px;
    align-items: stretch;
}

.transactions-forms > * {
    flex: 1;
    margin-bottom: 0 !important; /* Overwrite standard bottom margin */
}

@media (max-width: 768px) {
    .transactions-forms {
        flex-direction: column;
    }
}

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

## 5. Your Task

1. Create `src/components/CsvUpload.jsx` with the file upload form.
2. Import `CsvUpload` and wire up the `handleImportComplete` listener inside `App.jsx`.
3. Update the `/transactions` Route container and elements in `App.jsx`.
4. Append layout styles and uploader styles to `App.css`.
5. Test the full flow:
   - Navigate to `/transactions`
   - Upload `sample_transactions.csv` → verify it imports 11 transactions and updates the list instantly.
   - Upload the same file again → verify it shows "0 imported, 11 skipped" as duplicates.
   - Navigate to the Dashboard → verify charts update with the imported transaction amounts.

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
