// ============================================================================
// File: BudgetOverview.jsx
// Description: Parent component managing state for budget limits, selected period,
//              and rendering a list of BudgetCard components.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../../api';
import BudgetContent from './BudgetContent';
import { sortCategories } from '../../../utils/helpers';
import './Budgets.css';


/**
 * Component: BudgetOverview
 * Description: Parent page component that coordinates the month/year selection
 *              and fetches budget limits and spent totals from the API.
 * Props:
 *   - transactions (Array): List of all loaded transactions (passed to BudgetCard for filtering).
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function BudgetOverview({
    periodMode = 'month',
    onModeChange,
    month = new Date().getMonth() + 1,
    onMonthChange,
    year = new Date().getFullYear(),
    onYearChange,
    transactions = [],
    showToast
}) {
    const [categories, setCategories] = useState([]);
    const [budgetData, setBudgetData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    /**
     * Hook: useEffect (Data Fetcher)
     * Description: Runs whenever selected month or year changes. Fires parallel
     *              API requests to fetch all category definitions and category-wise
     *              spending totals, updating state when done.
     */
    useEffect(() => {
        setLoading(true);

        const reqMonth = periodMode === 'all' ? 0 : (periodMode === 'year' ? 0 : month);
        const reqYear = periodMode === 'all' ? 0 : year;

        Promise.all([
            api.get('/categories'),
            api.get(`/dashboard?month=${reqMonth}&year=${reqYear}`)
        ])
            .then(([catResponse, dashResponse]) => {
                setCategories(sortCategories(catResponse.data));
                setBudgetData(dashResponse.data.by_category);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching budget data:', error);
                showToast?.('Failed to load budget data.', 'error');
                setLoading(false);
            });
    }, [periodMode, month, year, showToast]);

    /**
     * Function: handleBudgetUpdate
     * Description: Submits an API PUT request to update the target category's budget limit,
     *              updating the local React categories state upon successful confirmation.
     * Parameters:
     *   - categoryId (Number): Database ID of the category being modified.
     *   - newBudget (String): The text input value of the new budget limit.
     * Passed to: BudgetCard (via the onBudgetUpdate prop)
     */
    const handleBudgetUpdate = (categoryId, newBudget) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const payload = {
            name: category.name,
            icon: category.icon || '📁',
            monthly_budget: parseFloat(newBudget) || 0
        };

        api.put(`/categories/${categoryId}`, payload)
            .then(response => {
                setCategories(categories.map(c => c.id === categoryId ? response.data : c));
                setBudgetData(budgetData.map(b => b.category_name === category.name ? { ...b, budget: response.data.monthly_budget } : b));
                showToast?.('Budget limit updated successfully!');
            })
            .catch(error => {
                console.error('Error updating budget:', error);
                showToast?.('Failed to update budget limit.', 'error');
            });
    };

    /**
     * Function: handleCreateCategory
     * Description: Submits POST /categories request and updates state.
     */
    const handleCreateCategory = (newCategory, onSuccess) => {
        setIsCreating(true);
        api.post('/categories', newCategory)
            .then(response => {
                setCategories(sortCategories([...categories, response.data]));
                showToast?.('Category created successfully!');
                onSuccess?.();
            })
            .catch(error => {
                console.error('Error creating category:', error);
                showToast?.('Failed to create category.', 'error');
            })
            .finally(() => {
                setIsCreating(false);
            });
    };

    return (
        <div className="page-container">
            <BudgetContent
                periodMode={periodMode}
                onModeChange={onModeChange}
                month={month}
                year={year}
                onMonthChange={onMonthChange}
                onYearChange={onYearChange}
                categories={categories}
                budgetData={budgetData}
                transactions={transactions}
                isCreating={isCreating}
                onCreateCategory={handleCreateCategory}
                onBudgetUpdate={handleBudgetUpdate}
                showToast={showToast}
                loading={loading}
            />
        </div>
    );
}

export default BudgetOverview;