import CsvImporter from '../common/CsvImporter';
import { CURRENCY } from '../../utils/config';

/**
 * Component: BrokerageCsvUpload
 * Description: Renders the brokerage trade upload card by wrapping the common CsvImporter.
 * Props:
 *   - onBrokerageImportComplete (Function): Callback trigger on success.
 */
function BrokerageCsvUpload({ onBrokerageImportComplete }) {
    const description = (
        <>
            Upload a CSV export from your brokerage (Wealthsimple or Questrade). 
            Supported columns include: <strong>Date, Type/Action, Symbol, Quantity, Price, Amount/Net Amount</strong>.
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                ⚠️ <strong>Currency Note:</strong> This portfolio runs in <strong>{CURRENCY}</strong>. Please ensure the CSV transaction records represent prices already converted to {CURRENCY} (which is standard for Wealthsimple and Questrade {CURRENCY} accounts).
            </div>
        </>
    );

    return (
        <CsvImporter 
            uploadUrl="/stocks/upload-csv"
            title="Import Brokerage Trades"
            description={description}
            onImportComplete={onBrokerageImportComplete}
        />
    );
}

export default BrokerageCsvUpload;
