import CsvImporter from '../common/CsvImporter';

/**
 * Component: CsvUpload
 * Description: Renders the transaction upload card by wrapping the common CsvImporter.
 * Props:
 *   - onImportComplete (Function): Callback trigger on success.
 */
function CsvUpload({ onImportComplete }) {
    const description = (
        <>
            Upload a CSV file from your bank. The file should have columns:
            <strong> Date, Description, Amount</strong>
        </>
    );

    return (
        <CsvImporter
            uploadUrl="/transactions/upload-csv"
            title="Import Transactions from CSV"
            description={description}
            onImportComplete={onImportComplete}
        />
    );
}

export default CsvUpload;