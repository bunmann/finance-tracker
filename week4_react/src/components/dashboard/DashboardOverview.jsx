// ============================================================================
// File: DashboardOverview.jsx
// Description: Displays monthly financial summaries and spending breakdown charts.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import DashboardContent from './DashboardContent';
import '../../styles/Dashboard.css';

/**
 * Component: DashboardOverview (Container)
 * Description: Smart container component coordinating monthly financial statistics fetching,
 *              loading states, and period filters before delegating UI design to DashboardContent.
 * Props:
 *   - transactions (Array): User transactions list (forces re-renders/sync on dashboard when transactions change).
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function DashboardOverview({ transactions, showToast }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-indexed
    const [year, setYear] = useState(today.getFullYear());
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const prevPeriodRef = useRef({ month, year });

    /**
     * Hook: useEffect (Dashboard Data Loader)
     * Description: Re-fetches aggregate monthly financial stats and category spending
     *              from the database whenever the month, year, or transaction list changes.
     */
    useEffect(() => {
        const prev = prevPeriodRef.current;
        const periodChanged = prev.month !== month || prev.year !== year;
        if (periodChanged || !dashboardData) {
            setLoading(true);
            prevPeriodRef.current = { month, year };
        }

        api.get(`/dashboard?month=${month}&year=${year}`)
            .then(response => {
                setDashboardData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dashboard:', error);
                showToast?.('Failed to load dashboard data.', 'error');
                setLoading(false);
            });
    }, [month, year, transactions, showToast]);

    return (
        <DashboardContent
            dashboardData={dashboardData}
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
            loading={loading}
        />
    );
}

export default DashboardOverview;
