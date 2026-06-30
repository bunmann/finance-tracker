// ============================================================================
// File: BudgetOverview.jsx
// Description: Parent component managing state for budget limits, selected period,
//              and rendering a list of BudgetCard components.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import BudgetContent from './BudgetContent';
import { sortCategories } from '../../utils/helpers';
import '../../styles/Budgets.css';


/**
 * Component: BudgetOverview
 * Description: Parent page component that coordinates the month/year selection
 *              and fetches budget limits and spent totals from the API.
 * Props:
 *   - transactions (Array): List of all loaded transactions (passed to BudgetCard for filtering).
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function BudgetOverview({ transactions = [], showToast }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
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

        Promise.all([
            api.get('/categories'),
            api.get(`/dashboard?month=${month}&year=${year}`)
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
    }, [month, year, showToast]);

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

        api.put(`/categories/${categoryId}`, {
            name: category.name,
            icon: category.icon,
            monthly_budget: parseFloat(newBudget) || 0
        })
            .then(response => {
                setCategories(categories.map(c =>
                    c.id === categoryId ? response.data : c
                ));
                showToast?.('Budget updated successfully!');
            })
            .catch(error => {
                console.error('Error updating budget:', error);
                showToast?.('Failed to update budget.', 'error');
            });
    };

    /**
     * Function: handleCreateCategory
     * Description: Submits POST /categories request and updates state.
     */
    const handleCreateCategory = (newCatData, onSuccess) => {
        setIsCreating(true);
        api.post('/categories', newCatData)
            .then(response => {
                setCategories(sortCategories([...categories, response.data]));
                setIsCreating(false);
                onSuccess?.();
                showToast?.(`Category "${response.data.name}" created successfully!`);
            })
            .catch(error => {
                console.error('Error creating category:', error);
                const detail = error.response?.data?.detail || 'Failed to create category.';
                showToast?.(detail, 'error');
                setIsCreating(false);
            });
    };

    return (
        <div className="page-container">
            <BudgetContent
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
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