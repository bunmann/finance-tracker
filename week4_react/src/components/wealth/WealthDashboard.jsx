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
    const { globalPeriod, setGlobalPeriod, wealthData, healthData, portfolioData, isStocksLoading, fetchWealthData, fetchStocksData } = useFinance();
    const [dashboardData, setDashboardData] = useState(null);

    const periodMode = globalPeriod.mode;
    const mVal = globalPeriod.mode === 'all' ? 0 : (globalPeriod.month || new Date().getMonth() + 1);
    const yVal = globalPeriod.mode === 'all' ? 0 : (globalPeriod.year || new Date().getFullYear());

    let periodLabel = 'All Time';
    if (globalPeriod.mode === 'year' || (mVal === 0 && yVal > 0)) {
        periodLabel = `Year ${yVal}`;
    } else if (mVal > 0 && yVal > 0) {
        const dateObj = new Date(yVal, mVal - 1);
        periodLabel = `${dateObj.toLocaleString('default', { month: 'long' })} ${yVal}`;
    }

    const selectedPeriod = { month: mVal, year: yVal, label: periodLabel };

    // Initial load for wealth & stocks data
    useEffect(() => {
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, false);
        fetchStocksData(false);
    }, [selectedPeriod.month, selectedPeriod.year, fetchWealthData, fetchStocksData]);

    // Fetch filtered expense breakdown dashboard data
    useEffect(() => {
        api.get(`/dashboard?month=${selectedPeriod.month}&year=${selectedPeriod.year}`)
            .then(res => setDashboardData(res.data))
            .catch(err => console.error("Error fetching wealth dashboard category data:", err));
    }, [selectedPeriod.month, selectedPeriod.year]);

    const handleUpdate = () => {
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, true);
        fetchStocksData(true);
    };

    const handleModeChange = (newMode) => {
        if (newMode === 'all') {
            setGlobalPeriod({ mode: 'all', month: 0, year: 0 });
        } else if (newMode === 'year') {
            const y = globalPeriod.year || new Date().getFullYear();
            setGlobalPeriod({ mode: 'year', month: 0, year: y });
        } else if (newMode === 'month') {
            const m = globalPeriod.month || new Date().getMonth() + 1;
            const y = globalPeriod.year || new Date().getFullYear();
            setGlobalPeriod({ mode: 'month', month: m, year: y });
        }
    };

    const handlePeriodChange = (month, year) => {
        setGlobalPeriod({ month, year });
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
                isStocksLoading={isStocksLoading}
                dashboardData={dashboardData}
                periodLabel={selectedPeriod.label}
            />

            {/* Row 3: AI Financial Assistant (Gemini 1.5) */}
            <AiFinancialAssistant />
        </div>
    );
}

export default WealthDashboard;
