// ============================================================================
// File: Dashboard.jsx
// Description: Displays monthly financial summaries and spending breakdown charts.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import DashboardView from './DashboardView';
import '../../styles/Dashboard.css';

/**
 * Component: Dashboard (Container)
 * Description: Smart container component coordinating monthly financial statistics fetching,
 *              loading states, and period filters before delegating UI design to DashboardView.
 * Props:
 *   - transactions (Array): User transactions list (forces re-renders/sync on dashboard when transactions change).
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function Dashboard({ transactions, showToast }) {
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

    if (loading) return (
        <div className="spinner-container">
            <div className="spinner"></div>
        </div>
    );
    if (!dashboardData) return <p className="no-data-message">Error loading dashboard data.</p>;

    return (
        <DashboardView
            dashboardData={dashboardData}
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
        />
    );
}

export default Dashboard;