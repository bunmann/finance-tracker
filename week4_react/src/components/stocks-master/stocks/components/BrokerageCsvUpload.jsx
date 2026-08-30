import CsvImporter from '../../../common/inputs/CsvImporter';
import { CURRENCY } from '../../../../utils/config';

/**
 * Component: BrokerageCsvUpload
 * Description: Renders the brokerage trade upload card by wrapping the common CsvImporter.
 * Props:
 *   - onBrokerageImportComplete (Function): Callback trigger on success.
 */
function BrokerageCsvUpload({ onBrokerageImportComplete }) {
    const description = (
        <>
            Upload a CSV export from your Wealthsimple brokerage account. 
            Supported columns include: <strong>Date, Type/Action, Symbol, Quantity, Price, Amount/Net Amount</strong>.
            <div className="csv-upload-hint">
                ⚠️ <strong>Currency Note:</strong> This portfolio runs in <strong>{CURRENCY}</strong>. Please ensure the CSV transaction records represent prices already converted to {CURRENCY} (which is standard for Wealthsimple {CURRENCY} accounts).
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
