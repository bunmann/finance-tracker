import CsvImporter from '../common/inputs/CsvImporter';
import { CURRENCY } from '../../utils/config';

/**
 * Component: TransactionCsvUpload
 * Description: Renders the transaction upload card by wrapping the common CsvImporter.
 * Props:
 *   - onImportComplete (Function): Callback trigger on success.
 */
function TransactionCsvUpload({ onTransactionImportComplete }) {
    const isCad = CURRENCY === 'CAD';
    const regionName = isCad ? 'Canadian' : 'US';

    const description = (
        <>
            Upload a CSV file from your bank. The file should have columns:
            <strong> Date, Description, Amount</strong>
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                ⚠️ <strong>Currency Note:</strong> This account runs in <strong>{CURRENCY}</strong>. Please ensure your bank CSV transactions represent values in {CURRENCY} (standard for {regionName} financial institution statements).
            </div>
        </>
    );

    return (
        <CsvImporter
            uploadUrl="/transactions/upload-csv"
            title="Import Transactions from CSV"
            description={description}
            onImportComplete={onTransactionImportComplete}
        />
    );
}

export default TransactionCsvUpload;
