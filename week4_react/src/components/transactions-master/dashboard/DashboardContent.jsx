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
import { getPnlClass, getPeriodMultiplier } from '../../../utils/helpers';

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
 *   - transactions (Array): List of user transactions for periodMultiplier scaling.
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
    transactions = [],
    loading
}) {
    // Inject colors directly into data array
    const chartData = (dashboardData?.by_category || []).map((entry, index) => ({
        ...entry,
        fill: COLORS[index % COLORS.length],
    }));

    const periodMultiplier = getPeriodMultiplier(periodMode, month, year, transactions || []);

    // Filter and sort budget alerts by severity (highest % of scaled budget consumed first)
    const activeAlerts = (dashboardData?.by_category || [])
        .map(cat => {
            const targetBudget = (cat.budget || 0) * periodMultiplier;
            const percentage = targetBudget > 0 ? Math.round((cat.amount / targetBudget) * 100) : 0;
            return {
                ...cat,
                targetBudget,
                percentage
            };
        })
        .filter(cat => cat.targetBudget > 0 && cat.percentage >= 75)
        .sort((a, b) => b.percentage - a.percentage);

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
                <div className="spinner-container spinner-container--page">
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
                    {/* Dynamic Period Label Helper */}
                    {(() => {
                        const periodPrefix = periodMode === 'all' ? 'Total' : (periodMode === 'year' ? 'Annual' : 'Monthly');
                        return (
                            <motion.div
                                className="summary-cards"
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                            >
                                <MetricCard
                                    title={`${periodPrefix} Income (${CURRENCY})`}
                                    value={dashboardData.total_income || 0}
                                    className="income"
                                />
                                <MetricCard
                                    title={`${periodPrefix} Expenses (${CURRENCY})`}
                                    value={dashboardData.total_expense || 0}
                                    className="expense"
                                />
                                <MetricCard
                                    title={`Net Savings (${CURRENCY})`}
                                    value={dashboardData.net_savings || 0}
                                    className={getPnlClass(dashboardData.net_savings)}
                                />
                            </motion.div>
                        );
                    })()}

                    {/* Budget Alerts */}
                    {activeAlerts.length > 0 && (
                        <div className="budget-alerts-container">
                            {activeAlerts.map((cat, i) => {
                                const percentage = cat.percentage;
                                const isOver = cat.amount >= cat.targetBudget;
                                return (
                                    <AlertBanner
                                        key={i}
                                        type={isOver ? 'danger' : 'warning'}
                                        icon={isOver ? 'warning' : 'bolt'}
                                        message={isOver
                                            ? `Over budget! ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.targetBudget.toFixed(2)} (${percentage}%)`
                                            : `Approaching limit: ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.targetBudget.toFixed(2)} (${percentage}%)`
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
                            <div className="dashboard-chart-wrapper">
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
                                message="There are no categorized expenses logged for this selected period."
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardContent;
