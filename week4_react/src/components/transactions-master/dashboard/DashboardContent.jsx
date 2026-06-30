// ============================================================================
// File: DashboardContent.jsx
// Description: Presenter component rendering monthly financial summaries,
//              budget alert banners, period selectors, and category charts.
// ============================================================================
import React from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import MetricCard from '../../common/data-display/MetricCard';
import AlertBanner from '../../common/feedback/AlertBanner';
import PeriodSelector from '../../common/inputs/PeriodSelector';
import EmptyState from '../../common/data-display/EmptyState';
import { CURRENCY } from '../../../utils/config';
import { staggerContainer } from '../../../utils/animations';

// Colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

/**
 * Component: DashboardContent
 * Description: Pure presenter rendering dashboard UI elements from container state.
 * Props:
 *   - dashboardData (Object): Aggregated financial statistics and category breakdown.
 *   - periodMode (String): Current filtering mode ('all', 'year', 'month').
 *   - month (Number): Selected month (1-12).
 *   - year (Number): Selected year (YYYY).
 *   - onModeChange (Function): Callback to update period mode state.
 *   - onMonthChange (Function): Callback to update month state.
 *   - onYearChange (Function): Callback to update year state.
 *   - loading (Boolean): Loading state from parent.
 */
function DashboardContent({
    dashboardData,
    periodMode,
    month,
    year,
    onModeChange,
    onMonthChange,
    onYearChange,
    loading
}) {
    // Inject colors directly into data array
    const chartData = (dashboardData?.by_category || []).map((entry, index) => ({
        ...entry,
        fill: COLORS[index % COLORS.length],
    }));

    // Filter and sort budget alerts by severity (highest % of budget consumed first)
    const activeAlerts = (dashboardData?.by_category || [])
        .filter(cat => cat.budget > 0 && cat.amount >= cat.budget * 0.75)
        .sort((a, b) => (b.amount / b.budget) - (a.amount / a.budget));

    return (
        <div className="page-container">
            {/* Header controls bar - always loads immediately */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">Dashboard Overview ({CURRENCY})</h2>
                <div className="dashboard-controls">
                    <PeriodSelector
                        mode={periodMode}
                        month={month}
                        year={year}
                        onModeChange={onModeChange}
                        onPeriodChange={(m, y) => {
                            if (m !== undefined) onMonthChange?.(m);
                            if (y !== undefined) onYearChange?.(y);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ marginTop: '40px' }}>
                    <div className="spinner"></div>
                </div>
            ) : !dashboardData ? (
                <EmptyState
                    icon="error"
                    title="Error Loading Dashboard"
                    message="Unable to fetch summary aggregates for the selected period."
                />
            ) : (
                <>
                    {/* Summary Cards */}
                    <motion.div
                        className="summary-cards"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        <MetricCard
                            title={`Monthly Income (${CURRENCY})`}
                            value={dashboardData.total_income || 0}
                            className="income"
                        />
                        <MetricCard
                            title={`Monthly Expenses (${CURRENCY})`}
                            value={dashboardData.total_expense || 0}
                            className="expense"
                        />
                        <MetricCard
                            title={`Net Savings (${CURRENCY})`}
                            value={dashboardData.net_savings || 0}
                            className={(dashboardData.net_savings || 0) >= 0 ? 'savings-positive' : 'savings-negative'}
                        />
                    </motion.div>

                    {/* Budget Alerts */}
                    {activeAlerts.length > 0 && (
                        <div className="budget-alerts-container">
                            {activeAlerts.map((cat, i) => {
                                const percentage = Math.round((cat.amount / cat.budget) * 100);
                                const isOver = cat.amount >= cat.budget;
                                return (
                                    <AlertBanner
                                        key={i}
                                        type={isOver ? 'danger' : 'warning'}
                                        icon={isOver ? 'warning' : 'bolt'}
                                        message={isOver
                                            ? `Over budget! ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                                            : `Approaching limit: ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Pie Chart — Spending by Category */}
                    <div className="dashboard-chart-card">
                        <h3>Spending by Category ({CURRENCY})</h3>
                        {dashboardData.by_category && dashboardData.by_category.length > 0 ? (
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
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
                            <EmptyState
                                icon="pie_chart"
                                title="No Expense Data Found"
                                message="There are no categorized expenses logged for this month."
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardContent;
