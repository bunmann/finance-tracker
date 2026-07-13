// ============================================================================
// File: StockAnalysisModal.jsx
// Description: Smart Container for the Interactive Stock Research Modal.
//              Owns network lifecycle, state, and window event listeners,
//              delegating visual presentation to StockAnalysisModalContent.
// ============================================================================
import React, { useState, useEffect } from 'react';
import api from '../../../../../api';
import StockAnalysisModalContent from './StockAnalysisModalContent';

/**
 * Component: StockAnalysisModal (Smart Container)
 * Description: Coordinates API fetching (`GET /stocks/{symbol}/chart`) and modal
 *              keyboard lifecycle (`Escape`), rendering the dumb presenter (`StockAnalysisModalContent`).
 * Props:
 *   - isOpen (boolean): Whether modal overlay should be rendered
 *   - symbol (string): Stock ticker to analyze (e.g. 'XEQT.TO', 'AAPL')
 *   - onClose (function): Callback invoked when closing modal
 */
function StockAnalysisModal({ isOpen, symbol, onClose }) {
    const [chartData, setChartData] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [period, setPeriod] = useState('1M');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch chart data whenever modal opens, symbol changes, or period changes
    useEffect(() => {
        if (!isOpen || !symbol) return;

        let isMounted = true;
        setLoading(true);
        setError(null);
        setChartData([]);

        api.get(`/stocks/${encodeURIComponent(symbol)}/chart`, {
            params: { period }
        })
            .then((res) => {
                if (!isMounted) return;
                setChartData(res.data.chart || []);
                setMetadata(res.data.metadata || {});
                setLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('[StockAnalysisModal] Chart fetch failed:', err);
                setError(err.response?.data?.detail || 'Failed to load historical chart data.');
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, symbol, period]);

    if (!isOpen || !symbol) return null;

    return (
        <StockAnalysisModalContent
            symbol={symbol}
            chartData={chartData}
            metadata={metadata}
            period={period}
            setPeriod={setPeriod}
            loading={loading}
            error={error}
            onClose={onClose}
        />
    );
}

export default StockAnalysisModal;
