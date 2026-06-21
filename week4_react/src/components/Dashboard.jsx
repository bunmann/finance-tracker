// ============================================================================
// File: Dashboard.jsx
// Description: Displays monthly financial summaries and spending breakdown charts.
// ============================================================================
import { useState, useEffect } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

// Colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

/**
 * Component: Dashboard
 * Description: Renders the monthly summary statistics (income, expenses, net savings),
 *              budget limit alerts, and a Pie Chart breakdown of expenses by category.
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

    /**
     * Hook: useEffect (Dashboard Data Loader)
     * Description: Re-fetches aggregate monthly financial stats and category spending
     *              from the database whenever the month, year, or transaction list changes.
     */
    useEffect(() => {
        setLoading(true);
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
    }, [month, year, transactions, showToast]);  // Re-fetch when month, year, or transactions list changes!

    if (loading) return (
        <div className="spinner-container">
            <div className="spinner"></div>
        </div>
    );
    if (!dashboardData) return <p>Error loading dashboard data.</p>;

    // Inject colors directly into data array (best practice to avoid deprecated Cell component)
    const chartData = dashboardData.by_category.map((entry, index) => ({
        ...entry,
        fill: COLORS[index % COLORS.length],
    }));

    return (
        <div>
            <h2>Dashboard</h2>

            {/* Month/Year selector */}
            <div>
                <label>Month: </label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <label> Year: </label>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                />
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Income</h3>
                    <p className="amount income">
                        ${dashboardData.total_income.toFixed(2)}
                    </p>
                </div>
                <div className="summary-card">
                    <h3>Expenses</h3>
                    <p className="amount expense">
                        ${dashboardData.total_expense.toFixed(2)}
                    </p>
                </div>
                <div className="summary-card">
                    <h3>Net Savings</h3>
                    <p className={`amount ${dashboardData.net_savings >= 0 ? 'savings-positive' : 'savings-negative'}`}>
                        ${dashboardData.net_savings.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Budget Alerts */}
            {dashboardData.by_category
                .filter(cat => cat.budget > 0 && cat.amount >= cat.budget * 0.75)
                .map((cat, i) => {
                    const percentage = Math.round((cat.amount / cat.budget) * 100);
                    const isOver = cat.amount >= cat.budget;
                    return (
                        <div
                            key={i}
                            className={`budget-alert ${isOver ? 'alert-danger' : 'alert-warning'}`}
                        >
                            {isOver
                                ? `⚠️ Over budget! ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                                : `⚡ Approaching limit: ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                            }
                        </div>
                    );
                })
            }

            {/* Pie Chart — Spending by Category */}
            {dashboardData.by_category.length > 0 ? (
                <div>
                    <h3>Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="amount"
                                nameKey="category_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ category_name, amount }) =>
                                    `${category_name}: $${amount.toFixed(2)}`
                                }
                            />
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p>No expense data for this month.</p>
            )}
        </div>
    );
}

export default Dashboard;