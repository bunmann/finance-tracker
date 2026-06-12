import { useState, useEffect } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

// Colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

function Dashboard({ transactions }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-indexed
    const [year, setYear] = useState(today.getFullYear());
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data whenever month or year changes
    useEffect(() => {
        setLoading(true);
        api.get(`/dashboard?month=${month}&year=${year}`)
            .then(response => {
                setDashboardData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dashboard:', error);
                setLoading(false);
            });
    }, [month, year, transactions]);  // Re-fetch when month, year, or transactions list changes!

    if (loading) return <p>Loading dashboard...</p>;
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
            <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Income</h3>
                    <p style={{ fontSize: '24px', color: 'green' }}>
                        ${dashboardData.total_income.toFixed(2)}
                    </p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Expenses</h3>
                    <p style={{ fontSize: '24px', color: 'red' }}>
                        ${dashboardData.total_expense.toFixed(2)}
                    </p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Net Savings</h3>
                    <p style={{ fontSize: '24px', color: dashboardData.net_savings >= 0 ? 'green' : 'red' }}>
                        ${dashboardData.net_savings.toFixed(2)}
                    </p>
                </div>
            </div>

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