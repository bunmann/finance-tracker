import CsvImporter from '../common/CsvImporter';

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
