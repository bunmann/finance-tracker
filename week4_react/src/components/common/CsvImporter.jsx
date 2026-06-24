import { useState } from 'react';
import api from '../../api';

/**
 * Component: CsvImporter
 * Description: A reusable file upload UI shell for CSV statements.
 * Props:
 *   - uploadUrl (String): The API endpoint path.
 *   - title (String): Card title.
 *   - description (JSX/String): Custom instruction paragraph.
 *   - onImportComplete (Function): Callback trigger on success.
 */
function CsvImporter({ uploadUrl, title, description, onImportComplete }) {
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

        const formData = new FormData();
        formData.append('file', file);

        api.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(response => {
                setResult(response.data);
                setFile(null);
                // Clear file input element
                const inputElement = document.getElementById(`csv-file-${uploadUrl.replace(/\//g, '-')}`);
                if (inputElement) {
                    inputElement.value = '';
                }
                onImportComplete?.();
            })
            .catch(err => {
                console.error("CSV upload error:", err);
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

    const duplicatesCount = result 
        ? (result.duplicates !== undefined ? result.duplicates : result.skipped_duplicates) 
        : 0;

    return (
        <div className="csv-upload">
            <h2>{title}</h2>
            <div className="csv-description">
                {description}
            </div>

            <div className="csv-upload-controls">
                <input
                    id={`csv-file-${uploadUrl.replace(/\//g, '-')}`}
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
                            <span className="stat-number">{duplicatesCount}</span>
                            <span className="stat-label">Skipped (duplicates)</span>
                        </div>
                        <div className="result-stat error">
                            <span className="stat-number">{result.errors?.length || 0}</span>
                            <span className="stat-label">Errors</span>
                        </div>
                    </div>
                    {result.errors && result.errors.length > 0 && (
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

export default CsvImporter;
