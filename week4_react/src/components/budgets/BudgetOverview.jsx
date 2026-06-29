// ============================================================================
// File: BudgetOverview.jsx
// Description: Parent component managing state for budget limits, selected period,
//              and rendering a list of BudgetCard components.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import BudgetCard from './BudgetCard';
import MonthSelect from '../common/inputs/MonthSelect';
import '../../styles/Budgets.css';
import { CURRENCY } from '../../utils/config';


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
                setCategories(catResponse.data);
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

    if (loading) return (
        <div className="spinner-container">
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">Budget Overview ({CURRENCY})</h2>
                <div className="budget-controls" style={{ margin: 0 }}>
                    <div className="control-group">
                        <label>Month</label>
                        <MonthSelect value={month} onChange={setMonth} />
                    </div>

                    <div className="control-group">
                        <label>Year</label>
                        <input
                            className="year-input"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            min="2020"
                            max="2030"
                        />
                    </div>
                </div>
            </div>

            {/* Budget cards for each category */}
            <div className="budget-list">
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
                            onBudgetUpdate={handleBudgetUpdate}
                        />
                    );
                })}
            </div>

            {categories.length === 0 && (
                <p className="no-data-message">No categories yet. Create categories in the Transactions page first.</p>
            )}
        </div>
    );
}

export default BudgetOverview;