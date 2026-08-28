// ============================================================================
// File: WealthSummaryWidgets.jsx
// Description: Row 2 summary widgets for Wealth & Health dashboard:
//              1. Stock Portfolio Summary (Value, Cost Basis, P&L, Top 3 holdings)
//              2. Date-Filtered Expense Breakdown (Total Expenses, Net Savings, Category Bars)
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import HoldingMiniCard from '../stocks-master/stocks-summary/components/HoldingMiniCard';

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(val || 0);
};

function WealthSummaryWidgets({ portfolio, dashboardData, periodLabel }) {
    const holdings = portfolio?.holdings || [];
    const topHoldings = [...holdings].sort((a, b) => (b.market_value || 0) - (a.market_value || 0)).slice(0, 3);

    const totalVal = portfolio?.total_value || 0;
    const totalCost = portfolio?.total_cost || 0;
    const totalGain = portfolio?.total_gain || 0;
    const isGainPositive = totalGain >= 0;

    // Expenses Breakdown Data from dashboardData
    const totalIncome = dashboardData?.total_income || 0;
    const totalExpense = dashboardData?.total_expense || 0;
    const netSavings = dashboardData?.net_savings || 0;
    const categoryBreakdown = dashboardData?.by_category || [];

    const topCategories = [...categoryBreakdown]
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 4);

    return (
        <div className="wealth-summary-widgets-grid">
            {/* Widget 1: Stock Portfolio Performance */}
            <div className="summary-widget-card">
                <div className="widget-card-header">
                    <div>
                        <h3 className="widget-title">Stock Portfolio Performance</h3>
                        <p className="widget-subtitle">Live Exchange Valuation & Cost Basis</p>
                    </div>
                    <Link to="/stocks/portfolio" className="widget-header-link">
                        Manage Portfolio →
                    </Link>
                </div>

                <div className="portfolio-kpi-row">
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Market Value</span>
                        <span className="kpi-val">{formatCurrency(totalVal)}</span>
                    </div>
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Cost Basis</span>
                        <span className="kpi-val">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Unrealized P&L</span>
                        <span className={`kpi-val ${isGainPositive ? 'positive' : 'negative'}`}>
                            {isGainPositive ? '+' : ''}{formatCurrency(totalGain)}
                        </span>
                    </div>
                </div>

                <div className="widget-list-section">
                    <h4 className="widget-section-subhead">Top Stock Holdings</h4>
                    {topHoldings.length === 0 ? (
                        <p className="widget-empty-text">No active stock holdings found. Upload a brokerage CSV or log trades in Stocks.</p>
                    ) : (
                        <div className="mini-holdings-list">
                            {topHoldings.map((h) => (
                                <HoldingMiniCard key={h.ticker} holding={h} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Widget 2: Expenses & Category Allocation (Date Filtered) */}
            <div className="summary-widget-card">
                <div className="widget-card-header">
                    <div>
                        <h3 className="widget-title">Expense & Category Allocation</h3>
                        <p className="widget-subtitle">Filtered Period ({periodLabel || 'All Time'})</p>
                    </div>
                    <Link to="/cashflow/transactions" className="widget-header-link">
                        View Transactions →
                    </Link>
                </div>

                <div className="portfolio-kpi-row">
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Total Expenses</span>
                        <span className="kpi-val negative">{formatCurrency(totalExpense)}</span>
                    </div>
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Total Income</span>
                        <span className="kpi-val positive">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="kpi-mini-box">
                        <span className="kpi-label">Net Savings</span>
                        <span className={`kpi-val ${netSavings >= 0 ? 'positive' : 'negative'}`}>
                            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
                        </span>
                    </div>
                </div>

                <div className="widget-list-section">
                    <h4 className="widget-section-subhead">Top Spending Categories</h4>
                    {topCategories.length === 0 ? (
                        <p className="widget-empty-text">No expense transactions logged for this selected period.</p>
                    ) : (
                        <div className="category-bars-list">
                            {topCategories.map((cat) => {
                                const pct = totalExpense > 0 ? Math.min(100, Math.round((cat.amount / totalExpense) * 100)) : 0;
                                return (
                                    <div key={cat.category_name} className="category-bar-row">
                                        <div className="category-bar-info">
                                            <span className="cat-name">{cat.category_name}</span>
                                            <span className="cat-amt">{formatCurrency(cat.amount)} ({pct}%)</span>
                                        </div>
                                        <div className="category-progress-track">
                                            <div 
                                                className="category-progress-fill" 
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WealthSummaryWidgets;
