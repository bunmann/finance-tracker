// ============================================================================
// File: WealthDashboard.jsx
// Description: Main container for Net Worth, Wealth Health, Summary Widgets,
//              and AI Financial Assistant.
// ============================================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../../contexts/FinanceContext';
import api from '../../api';
import './WealthDashboard.css';
import NetWorthCard from './NetWorthCard';
import CashFlowPulseCard from './CashFlowPulseCard';
import PeriodSelector from '../common/inputs/PeriodSelector';
import WealthSummaryWidgets from './WealthSummaryWidgets';
import AiFinancialAssistant from './AiFinancialAssistant';

function WealthDashboard() {
    const { wealthData, healthData, portfolioData, fetchWealthData, fetchStocksData } = useFinance();
    const [periodMode, setPeriodMode] = useState('all'); // 'all' | 'year' | 'month'
    const [selectedPeriod, setSelectedPeriod] = useState({ month: 0, year: 0, label: 'All Time' });
    const [dashboardData, setDashboardData] = useState(null);

    // Initial load for wealth & stocks data
    useEffect(() => {
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, false);
        fetchStocksData(false);
    }, [selectedPeriod, fetchWealthData, fetchStocksData]);

    // Fetch filtered expense breakdown dashboard data
    useEffect(() => {
        const m = periodMode === 'all' ? 0 : selectedPeriod.month;
        const y = periodMode === 'all' ? 0 : selectedPeriod.year;

        api.get(`/dashboard?month=${m}&year=${y}`)
            .then(res => setDashboardData(res.data))
            .catch(err => console.error("Error fetching wealth dashboard category data:", err));
    }, [periodMode, selectedPeriod]);

    const handleUpdate = () => {
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, true);
        fetchStocksData(true);
    };

    const handleModeChange = (newMode) => {
        setPeriodMode(newMode);
        if (newMode === 'all') {
            setSelectedPeriod({ month: 0, year: 0, label: 'All Time' });
        } else if (newMode === 'year') {
            const y = selectedPeriod.year || new Date().getFullYear();
            setSelectedPeriod({ month: 0, year: y, label: `Year ${y}` });
        } else if (newMode === 'month') {
            const m = selectedPeriod.month || new Date().getMonth() + 1;
            const y = selectedPeriod.year || new Date().getFullYear();
            const dateObj = new Date(y, m - 1);
            const label = `${dateObj.toLocaleString('default', { month: 'long' })} ${y}`;
            setSelectedPeriod({ month: m, year: y, label });
        }
    };

    const handlePeriodChange = (month, year) => {
        let label = 'All Time';
        if (month === 0 && year > 0) {
            label = `Year ${year}`;
        } else if (month > 0 && year > 0) {
            const dateObj = new Date(year, month - 1);
            label = `${dateObj.toLocaleString('default', { month: 'long' })} ${year}`;
        }
        setSelectedPeriod({ month, year, label });
    };

    return (
        <div className="wealth-dashboard-container">
            {/* Header controls bar */}
            <div className="wealth-header">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Wealth & Health
                </motion.h1>
                <PeriodSelector 
                    mode={periodMode}
                    month={selectedPeriod.month}
                    year={selectedPeriod.year}
                    onModeChange={handleModeChange}
                    onPeriodChange={handlePeriodChange}
                />
            </div>

            {/* Row 1: Top Hero Cards */}
            <div className="wealth-grid">
                <NetWorthCard data={wealthData} onUpdate={handleUpdate} />
                <CashFlowPulseCard data={healthData} periodLabel={selectedPeriod.label} />
            </div>

            {/* Row 2: Stock Portfolio Performance & Date-Filtered Expense Breakdown */}
            <WealthSummaryWidgets 
                portfolio={portfolioData}
                dashboardData={dashboardData}
                periodLabel={selectedPeriod.label}
            />

            {/* Row 3: AI Financial Assistant (Gemini 1.5) */}
            <AiFinancialAssistant />
        </div>
    );
}

export default WealthDashboard;
