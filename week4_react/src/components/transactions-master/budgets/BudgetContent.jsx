// ============================================================================
// File: BudgetContent.jsx
// Description: Pure presenter component that renders period selectors, inline
//              category creation form, and the grid of budget category cards.
// ============================================================================
import { AnimatePresence } from 'framer-motion';
import BudgetCard from './components/BudgetCard';
import CategoryCreateForm from './components/CategoryCreateForm';
import PeriodSelector from '../../common/inputs/PeriodSelector';
import { CURRENCY } from '../../../utils/config';

/**
 * Component: BudgetContent
 * Description: Full page presenter rendering all budget UI controls and cards.
 * Props:
 *   - categories (Array): List of category definition objects.
 *   - budgetData (Array): Calculated category spending totals for the month.
 *   - transactions (Array): List of user transactions for card dropdown filtering.
 *   - periodMode (String): Current period filter mode ('all', 'year', 'month').
 *   - month (Number): Selected calendar month.
 *   - year (Number): Selected calendar year.
 *   - onModeChange (Function): Period mode updater callback.
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
    periodMode = 'month',
    month,
    year,
    onModeChange,
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
                <div className="budget-controls budget-controls--no-margin">
                    <PeriodSelector
                        mode={periodMode}
                        month={month}
                        year={year}
                        onModeChange={onModeChange}
                        onPeriodChange={(m, y) => {
                            if (m !== undefined) onMonthChange?.(m);
                            if (y !== undefined) onYearChange?.(y);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="spinner-container spinner-container--page">
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
                                        periodMode={periodMode}
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
