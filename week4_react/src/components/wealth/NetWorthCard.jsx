// ============================================================================
// File: NetWorthCard.jsx
// Description: Component for displaying the total Net Worth and historical sparkline.
// ============================================================================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api';

import { useFinance } from '../../contexts/FinanceContext';

const formatCurrency = (value) => {
    const num = Number(value);
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(isNaN(num) ? 0 : num);
};

function NetWorthCard({ data, onUpdate }) {
    const { setWealthData } = useFinance();
    const [isEditing, setIsEditing] = useState(false);
    const [liabilityInput, setLiabilityInput] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    if (!data) return (
        <div className="net-worth-card loading-card">
            <div className="net-worth-header">
                <div>
                    <h2 className="net-worth-title">Total Net Worth</h2>
                    <p className="net-worth-subtitle">All-Time Cumulative Assets & Liabilities</p>
                </div>
            </div>
            <div className="spinner-container" style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        </div>
    );

    const handleStartEdit = () => {
        setLiabilityInput(data.liabilities !== undefined ? data.liabilities : 0);
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const newAmount = parseFloat(liabilityInput) || 0;

        // Instant Optimistic Context Update
        if (setWealthData && data) {
            const newNw = (data.cash_balance || 0) + (data.stock_value || 0) - newAmount;
            setWealthData({
                ...data,
                liabilities: newAmount,
                net_worth: newNw
            });
        }

        setIsEditing(false);
        setIsLoading(true);

        try {
            const res = await api.put('/wealth/liabilities', { amount: newAmount });
            if (res.data && setWealthData) {
                setWealthData(res.data);
            }
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to update liabilities", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="net-worth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="net-worth-header">
                <div>
                    <h2 className="net-worth-title">Total Net Worth</h2>
                    <p className="net-worth-subtitle">All-Time Cumulative Assets & Liabilities</p>
                </div>
            </div>
            <h1 className="net-worth-value">{formatCurrency(data?.net_worth)}</h1>

            <div className="net-worth-breakdown">
                <div className="breakdown-item">
                    <span className="breakdown-label">Cash & Spending</span>
                    <span className={`breakdown-value ${(data?.cash_balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(data?.cash_balance)}
                    </span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">Stock Portfolio</span>
                    <span className="breakdown-value positive">
                        {formatCurrency(data?.stock_value)}
                    </span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">
                        Liabilities 
                        {!isEditing && (
                            <button 
                                type="button" 
                                className="edit-liabilities-btn" 
                                onClick={handleStartEdit}
                                title="Edit Liabilities Amount"
                            >
                                ✎
                            </button>
                        )}
                    </span>
                    {isEditing ? (
                        <form className="liabilities-input-container" onSubmit={handleSave}>
                            <input 
                                type="number" 
                                className="liabilities-input"
                                value={liabilityInput}
                                onChange={(e) => setLiabilityInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                disabled={isLoading}
                                step="any"
                                min="0"
                                autoFocus
                            />
                            <button type="submit" className="save-btn" disabled={isLoading}>
                                {isLoading ? '...' : 'Save'}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn" 
                                onClick={() => setIsEditing(false)}
                                disabled={isLoading}
                            >
                                ✕
                            </button>
                        </form>
                    ) : (
                        <span className="breakdown-value negative">
                            -{formatCurrency(data?.liabilities)}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default NetWorthCard;
