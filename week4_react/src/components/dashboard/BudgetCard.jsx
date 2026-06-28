// ============================================================================
// File: BudgetCard.jsx
// Description: Renders a single category budget card with progress bar,
//              inline budget update, and a collapsible transaction list.
// ============================================================================
import { useState } from 'react';
import TransactionTable from '../transactions/TransactionTable';

/**
 * Component: BudgetCard
 * Description: Renders a card displaying budget progress for a specific category.
 *              Includes local state for toggle expand and lists relevant transactions.
 * Props:
 *   - category (Object): The category DB definition (name, icon, monthly_budget).
 *   - spent (Number): Calculated spending total for this category for the month.
 *   - transactions (Array): List of all user transactions (filtered inside this card).
 *   - month (Number): Currently selected calendar month.
 *   - year (Number): Currently selected calendar year.
 *   - onBudgetUpdate (Function): Parent callback handler triggered on budget input blur.
 */
function BudgetCard({ category, spent, transactions, month, year, onBudgetUpdate }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const budget = parseFloat(category.monthly_budget) || 0;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

    // Filter transactions for this category, month, and year
    const catTransactions = transactions.filter(t => {
        if (t.category_id !== category.id) return false;
        if (!t.date) return false;
        const [tYear, tMonth] = t.date.split('-');
        return parseInt(tMonth) === month && parseInt(tYear) === year;
    });

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
        <div className={`budget-card ${getProgressColor(percentage)}`}>
            <div 
                className="budget-header clickable"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
            >
                <span className="budget-category">
                    <span className="expand-arrow" style={{
                        display: 'inline-block',
                        width: '12px',
                        marginRight: '8px',
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'none'
                    }}>
                        ►
                    </span>
                    {category.icon} {category.name}
                </span>
                <span className="budget-amounts">
                    ${spent.toFixed(2)} / ${budget.toFixed(2)}
                </span>
            </div>

            {/* Progress bar */}
            <div className="progress-bar-container">
                <div
                    className={`progress-bar-fill ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            <div className="budget-footer">
                <span className={`budget-percentage ${getProgressColor(percentage)}`}>
                    {budget > 0 ? `${percentage}%` : 'No budget set'}
                </span>
                <div className="budget-input-group" onClick={(e) => e.stopPropagation()}>
                    <label>Budget: $</label>
                    <input
                        type="number"
                        defaultValue={budget}
                        onBlur={(e) => {
                            const parsed = parseFloat(e.target.value);
                            // Fallback validation: if a user bypasses keyboard blocks via copy-paste,
                            // coerce negative numbers or NaN inputs to 0, and update the visual DOM value.
                            const sanitizedValue = isNaN(parsed) || parsed < 0 ? 0 : parsed;
                            e.target.value = sanitizedValue; // Reset visual DOM value if corrected
                            onBudgetUpdate(category.id, sanitizedValue);
                        }}
                        onKeyDown={(e) => {
                            // Block typing negative sign ('-') and scientific exponent ('e')
                            // to prevent users from inputting negative budgets via keyboard.
                            if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                            }
                            if (e.key === 'Enter') {
                                e.target.blur();
                            }
                        }}
                        step="10"
                        min="0"
                    />
                </div>
            </div>

            {/* Collapsible Transactions Dropdown */}
            {isExpanded && (
                <div className="budget-card-transactions">
                    <div className="budget-transactions-divider"></div>
                    <h4 className="budget-transactions-title">
                        Transactions in {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    {catTransactions.length === 0 ? (
                        <p className="no-transactions-text">No transactions logged under this category for this period.</p>
                    ) : (
                        <TransactionTable
                            transactions={catTransactions}
                            isMini={true}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default BudgetCard;
