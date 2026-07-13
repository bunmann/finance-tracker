// ============================================================================
// File: DashboardOverview.jsx
// Description: Displays monthly financial summaries and spending breakdown charts.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import api from '../../../api';
import DashboardContent from './DashboardContent';
import './Dashboard.css';

/**
 * Component: DashboardOverview (Container)
 * Description: Smart container component coordinating monthly financial statistics fetching,
 *              loading states, and period filters before delegating UI design to DashboardContent.
 * Props:
 *   - transactions (Array): User transactions list (forces re-renders/sync on dashboard when transactions change).
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function DashboardOverview({
    periodMode = 'month',
    onModeChange,
    month = new Date().getMonth() + 1,
    onMonthChange,
    year = new Date().getFullYear(),
    onYearChange,
    transactions,
    showToast
}) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const prevPeriodRef = useRef({ periodMode, month, year });

    useEffect(() => {
        const prev = prevPeriodRef.current;
        const periodChanged = prev.periodMode !== periodMode || prev.month !== month || prev.year !== year;
        if (periodChanged || !dashboardData) {
            setLoading(true);
            prevPeriodRef.current = { periodMode, month, year };
        }

        const reqMonth = periodMode === 'all' ? 0 : (periodMode === 'year' ? 0 : month);
        const reqYear = periodMode === 'all' ? 0 : year;

        api.get(`/dashboard?month=${reqMonth}&year=${reqYear}`)
            .then(response => {
                setDashboardData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dashboard:', error);
                showToast?.('Failed to load dashboard data.', 'error');
                setLoading(false);
            });
    }, [periodMode, month, year, transactions, showToast]);

    return (
        <DashboardContent
            dashboardData={dashboardData}
            periodMode={periodMode}
            onModeChange={onModeChange}
            month={month}
            onMonthChange={onMonthChange}
            year={year}
            onYearChange={onYearChange}
            transactions={transactions}
            loading={loading}
        />
    );
}

export default DashboardOverview;
