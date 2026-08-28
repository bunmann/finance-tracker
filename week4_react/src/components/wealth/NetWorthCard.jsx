// ============================================================================
// File: NetWorthCard.jsx
// Description: Component for displaying the total Net Worth and historical sparkline.
// ============================================================================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import api from '../../api';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(value);
};

function NetWorthCard({ data, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [liabilityInput, setLiabilityInput] = useState(data?.liabilities || 0);
    const [isLoading, setIsLoading] = useState(false);

    if (!data) return (
        <div className="net-worth-card loading-card">
            <div className="spinner-container" style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        </div>
    );

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await api.put('/wealth/liabilities', { amount: parseFloat(liabilityInput) || 0 });
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to update liabilities", error);
            // Optionally add toast error here
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
            <h2 className="net-worth-title">Total Net Worth</h2>
            <h1 className="net-worth-value">{formatCurrency(data.net_worth)}</h1>

            <div className="net-worth-breakdown">
                <div className="breakdown-item">
                    <span className="breakdown-label">Cash & Spending</span>
                    <span className={`breakdown-value ${data.cash_balance >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(data.cash_balance)}
                    </span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">Stock Portfolio</span>
                    <span className="breakdown-value positive">
                        {formatCurrency(data.stock_value)}
                    </span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">
                        Liabilities 
                        {!isEditing && (
                            <button className="edit-liabilities-btn" onClick={() => setIsEditing(true)}>
                                ✎
                            </button>
                        )}
                    </span>
                    {isEditing ? (
                        <div className="liabilities-input-container">
                            <input 
                                type="number" 
                                className="liabilities-input"
                                value={liabilityInput}
                                onChange={(e) => setLiabilityInput(e.target.value)}
                                disabled={isLoading}
                                step="100"
                                min="0"
                            />
                            <button className="save-btn" onClick={handleSave} disabled={isLoading}>Save</button>
                        </div>
                    ) : (
                        <span className="breakdown-value negative">
                            -{formatCurrency(data.liabilities)}
                        </span>
                    )}
                </div>
            </div>

            {/* Sparkline for last 12 snapshots */}
            {data.history && data.history.length > 1 && (
                <div className="sparkline-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.history} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#006D32" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#006D32" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide={true} />
                            <Tooltip 
                                formatter={(value) => [formatCurrency(value), 'Net Worth']}
                                labelFormatter={(label) => `Date: ${label}`}
                                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="net_worth" 
                                stroke="#006D32" 
                                strokeWidth={2.5} 
                                fillOpacity={1}
                                fill="url(#netWorthGradient)"
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}

export default NetWorthCard;
