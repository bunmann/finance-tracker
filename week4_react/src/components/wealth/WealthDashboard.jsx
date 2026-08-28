// ============================================================================
// File: WealthDashboard.jsx
// Description: Main container for the Net Worth and Wealth Health page.
// ============================================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../../contexts/FinanceContext';
import './WealthDashboard.css';
import NetWorthCard from './NetWorthCard';
import CashFlowPulseCard from './CashFlowPulseCard';
import PeriodSelector from '../common/inputs/PeriodSelector';

function WealthDashboard() {
    const { wealthData, healthData, isWealthLoading, wealthError, fetchWealthData } = useFinance();
    const [selectedPeriod, setSelectedPeriod] = useState({ month: 0, year: 0, label: 'All Time' });

    useEffect(() => {
        // Fetch only if strictly needed. The strict cache check happens inside fetchWealthData.
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, false);
    }, [selectedPeriod, fetchWealthData]);

    const handleUpdate = () => {
        // Force refresh
        fetchWealthData(selectedPeriod.month, selectedPeriod.year, true);
    };

    const handlePeriodChange = (month, year, label) => {
        setSelectedPeriod({ month, year, label });
    };

    return (
        <div className="wealth-dashboard-container">
            <div className="wealth-header">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Wealth & Health
                </motion.h1>
                <PeriodSelector onPeriodChange={handlePeriodChange} />
            </div>
            
            {wealthError && <div className="error-message" style={{color: '#FF3B3B', marginBottom: '20px'}}>{wealthError}</div>}

            <div className="wealth-grid">
                <NetWorthCard data={wealthData} onUpdate={handleUpdate} />
                <CashFlowPulseCard data={healthData} periodLabel={selectedPeriod.label} />
            </div>
        </div>
    );
}

export default WealthDashboard;
