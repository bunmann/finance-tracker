// ============================================================================
// File: BudgetContent.jsx
// Description: Pure presenter component that renders period selectors, inline
//              category creation form, and the grid of budget category cards.
// ============================================================================
import { AnimatePresence } from 'framer-motion';
import BudgetCard from './BudgetCard';
import CategoryCreateForm from './CategoryCreateForm';
import MonthSelect from '../common/inputs/MonthSelect';
import { CURRENCY } from '../../utils/config';

/**
 * Component: BudgetContent
 * Description: Full page presenter rendering all budget UI controls and cards.
 * Props:
 *   - categories (Array): List of category definition objects.
 *   - budgetData (Array): Calculated category spending totals for the month.
 *   - transactions (Array): List of user transactions for card dropdown filtering.
 *   - month (Number): Selected calendar month.
 *   - year (Number): Selected calendar year.
 *   - onMonthChange (Function): Period month updater callback.
 *   - onYearChange (Function): Period year updater callback.
 *   - isCreating (Boolean): Loading indicator for category creation.
 *   - onCreateCategory (Function): Callback for adding a category.
 *   - onBudgetUpdate (Function): Callback passed down to BudgetCard.
 *   - showToast (Function): Toast notification callback.
 */
function BudgetContent({
    categories = [],
    budgetData = [],
    transactions = [],
    month,
    year,
    onMonthChange,
    onYearChange,
    isCreating,
    onCreateCategory,
    onBudgetUpdate,
    showToast,
    loading
}) {
    return (
        <div className="budget-content-body">
            {/* Page Header and Period Controls */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">Budget Overview ({CURRENCY})</h2>
                <div className="budget-controls" style={{ margin: 0 }}>
                    <div className="control-group">
                        <label>Month</label>
                        <MonthSelect value={month} onChange={onMonthChange} />
                    </div>

                    <div className="control-group">
                        <label>Year</label>
                        <input
                            className="year-input"
                            type="number"
                            value={year}
                            onChange={(e) => onYearChange(parseInt(e.target.value))}
                            min="2020"
                            max="2030"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ marginTop: '40px' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    {/* Modular Category Creation Form */}
                    <CategoryCreateForm
                        onCreateCategory={onCreateCategory}
                        isCreating={isCreating}
                        showToast={showToast}
                    />

                    {/* Presentational budget card grid */}
                    <div className="budget-list">
                        <AnimatePresence>
                            {categories.map(category => {
                                const spending = budgetData.find(
                                    b => b.category_name === category.name
                                );
                                const spent = spending ? spending.amount : 0;

                                return (
                                    <BudgetCard
                                        key={category.id}
                                        category={category}
                                        spent={spent}
                                        transactions={transactions}
                                        month={month}
                                        year={year}
                                        onBudgetUpdate={onBudgetUpdate}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {categories.length === 0 && (
                        <p className="no-data-message">
                            No categories yet. Create categories above or in the Transactions page first.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

export default BudgetContent;
