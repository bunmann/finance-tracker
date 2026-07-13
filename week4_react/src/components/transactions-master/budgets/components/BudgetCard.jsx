// ============================================================================
// File: BudgetCard.jsx
// Description: Renders a single category budget card with progress bar,
//              inline budget update, and a collapsible transaction list.
// ============================================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionTable from '../../transactions/components/TransactionTable';
import NonNegativeInput from '../../../common/inputs/NonNegativeInput';
import { accordionCollapse } from '../../../../utils/animations';
import { getPeriodMultiplier } from '../../../../utils/helpers';

/**
 * Component: BudgetCard
 * Description: Renders a card displaying budget progress for a specific category.
 *              Includes local state for toggle expand and lists relevant transactions.
 * Props:
 *   - category (Object): The category DB definition (name, icon, monthly_budget).
 *   - spent (Number): Calculated spending total for this category for the month/period.
 *   - transactions (Array): List of all user transactions (filtered inside this card).
 *   - periodMode (String): Current period view mode ('month', 'year', 'all').
 *   - month (Number): Currently selected calendar month.
 *   - year (Number): Currently selected calendar year.
 *   - onBudgetUpdate (Function): Parent callback handler triggered on budget input blur.
 */
function BudgetCard({ category, spent, transactions, periodMode = 'month', month, year, onBudgetUpdate }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const baseMonthlyBudget = parseFloat(category.monthly_budget) || 0;
    const periodMultiplier = getPeriodMultiplier(periodMode, month, year, transactions || []);

    const targetBudget = baseMonthlyBudget * periodMultiplier;
    const percentage = targetBudget > 0 ? Math.round((spent / targetBudget) * 100) : 0;

    // Filter transactions for this category based on active periodMode
    const catTransactions = (transactions || []).filter(t => {
        if (t.category_id !== category.id) return false;
        if (periodMode === 'all' || (month === 0 && year === 0)) return true;
        if (!t.date) return false;
        const [tYear, tMonth] = t.date.split('-');
        if (periodMode === 'year' || month === 0) {
            return parseInt(tYear) === year;
        }
        return parseInt(tMonth) === month && parseInt(tYear) === year;
    });

    const getPeriodHeader = () => {
        if (periodMode === 'all' || (month === 0 && year === 0)) {
            return 'All Transactions';
        }
        if (periodMode === 'year' || month === 0) {
            return `Transactions in ${year}`;
        }
        return `Transactions in ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    };

    /**
     * Function: getProgressColor
     * Description: Helper that maps budget consumption percentages to CSS class styles.
     * Parameters:
     *   - percentage (Number): Current spending percentage relative to budget limit.
     * Returns:
     *   - String: 'over-budget' (>=100%), 'warning' (>=75%), or 'on-track' (<75%).
     */
    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'over-budget';
        if (percentage >= 75) return 'warning';
        return 'on-track';
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`budget-card ${getProgressColor(percentage)}`}
        >
            <div 
                className="budget-header clickable budget-header--clickable"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="budget-category">
                    <span className="expand-arrow" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                        ►
                    </span>
                    {category.icon} {category.name}
                </span>
                <span className="budget-amounts">
                    ${spent.toFixed(2)} / ${targetBudget.toFixed(2)}
                </span>
            </div>

            {/* Progress bar with smooth width transition */}
            <div className="progress-bar-container">
                <motion.div
                    className={`progress-bar-fill ${getProgressColor(percentage)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
            </div>

            <div className="budget-footer">
                <span className={`budget-percentage ${getProgressColor(percentage)}`}>
                    {targetBudget > 0 ? `${percentage}%` : 'No budget set'}
                </span>
                <div className="budget-input-group" onClick={(e) => e.stopPropagation()}>
                    <label title="Edits your base monthly budget target across all period views">Monthly Budget: $</label>
                    <NonNegativeInput
                        key={`${category.id}-${baseMonthlyBudget}`}
                        defaultValue={baseMonthlyBudget}
                        step="10"
                        onBlur={(e, sanitized) => {
                            const val = parseFloat(sanitized) || 0;
                            onBudgetUpdate(category.id, val);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.target.blur();
                            }
                        }}
                    />
                </div>
            </div>

            {/* Collapsible Transactions Dropdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        className="budget-card-transactions"
                        variants={accordionCollapse}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="budget-expand-body"
                    >
                        <div className="budget-transactions-divider"></div>
                        <h4 className="budget-transactions-title">
                            {getPeriodHeader()}
                        </h4>
                        {catTransactions.length === 0 ? (
                            <p className="no-transactions-text">No transactions logged under this category for this period.</p>
                        ) : (
                            <TransactionTable
                                transactions={catTransactions}
                                hiddenColumns={['category', 'type', 'actions']}
                                defaultPageSize={5}
                                pageSizeOptions={[5, 10, 25, 'All']}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default BudgetCard;
