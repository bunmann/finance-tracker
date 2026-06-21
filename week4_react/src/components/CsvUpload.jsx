// ============================================================================
// File: CsvUpload.jsx
// Description: Component for selecting and uploading CSV bank statement files,
//              handling upload progress, and showing transaction import results.
// ============================================================================
import { useState } from 'react';
import api from '../api';

/**
 * Component: CsvUpload
 * Description: Renders the CSV file picker and upload triggers, managing loading indicators
 *              and rendering statistical summaries of import outcomes.
 * Props:
 *   - onImportComplete (Function): Parent callback handler triggered after a file import completes.
 */
function CsvUpload({ onImportComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    /**
     * Function: handleFileChange
     * Description: Validates and sets the chosen file in React state. Rejects non-CSV files.
     * Parameters:
     *   - e (Event): Standard onChange file selection event.
     */
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

    /**
     * Function: handleUpload
     * Description: Packages the selected CSV file into a FormData payload, submits a 
     *              POST request to the backend import endpoint, handles UI state resets,
     *              and triggers parent database refreshes on completion.
     */
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
                onImportComplete?.();
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