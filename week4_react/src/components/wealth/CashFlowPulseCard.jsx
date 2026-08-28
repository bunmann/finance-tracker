// ============================================================================
// File: CashFlowPulseCard.jsx
// Description: Component for displaying monthly savings rate and cash flow breakdown.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(value);
};

function CashFlowPulseCard({ data, periodLabel }) {
    if (!data) return <div className="pulse-card skeleton">Loading...</div>;

    const {
        total_income,
        total_expenses,
        net_savings,
        savings_rate,
        biggest_expense_category
    } = data;

    // Determine savings rate styling
    let badgeClass = 'rate-danger';
    if (savings_rate >= 20) badgeClass = 'rate-excellent';
    else if (savings_rate >= 10) badgeClass = 'rate-warning';

    // Calculate bar widths
    const totalFlow = total_income + total_expenses;
    const incomePercent = totalFlow > 0 ? (total_income / totalFlow) * 100 : 50;
    const expensePercent = totalFlow > 0 ? (total_expenses / totalFlow) * 100 : 50;

    return (
        <motion.div 
            className="pulse-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <div className="pulse-header">
                <div>
                    <h2 className="pulse-title">Savings Rate</h2>
                    <p className="pulse-subtitle">{periodLabel || 'All Time'}</p>
                </div>
                <div className={`savings-rate-badge ${badgeClass}`}>
                    {savings_rate.toFixed(1)}%
                </div>
            </div>

            <div className="pulse-bar-container">
                <div className="pulse-bar-labels">
                    <span className="label-income">Income</span>
                    <span className="label-expenses">Expenses</span>
                </div>
                <div className="pulse-bar-values">
                    <span className="label-income">{formatCurrency(total_income)}</span>
                    <span className="label-expenses">{formatCurrency(total_expenses)}</span>
                </div>
                <div className="pulse-bar">
                    <div className="bar-segment-income" style={{ width: `${incomePercent}%` }}></div>
                    <div className="bar-segment-expenses" style={{ width: `${expensePercent}%` }}></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="pulse-stats-grid">
                <div className="stat-box">
                    <span className="stat-label">Net Savings</span>
                    <span className={`stat-value ${net_savings >= 0 ? 'positive' : 'negative'}`}>
                        {net_savings >= 0 ? '+' : ''}{formatCurrency(net_savings)}
                    </span>
                </div>
                {biggest_expense_category && (
                    <div className="stat-box">
                        <span className="stat-label">Top Expense Category</span>
                        <span className="stat-value expense-category-name">
                            ⚠️ {biggest_expense_category}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default CashFlowPulseCard;
