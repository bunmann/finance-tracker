// ============================================================================
// File: BudgetOverview.jsx
// Description: Component displaying category budget limits, spent vs budgeted progress
//              bars, and inline inputs for updating budgets.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../api';

function BudgetOverview() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [categories, setCategories] = useState([]);
    const [budgetData, setBudgetData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch categories and dashboard data
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
                setLoading(false);
            });
    }, [month, year]);

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
            })
            .catch(error => console.error('Error updating budget:', error));
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'over-budget';
        if (percentage >= 75) return 'warning';
        return 'on-track';
    };

    if (loading) return <p>Loading budget data...</p>;

    return (
        <div>
            <h2>Budget Overview</h2>

            {/* Month/Year selector */}
            <div className="budget-controls">
                <label>Month: </label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <label> Year: </label>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                />
            </div>

            {/* Budget cards for each category */}
            <div className="budget-list">
                {categories.map(category => {
                    const spending = budgetData.find(
                        b => b.category_name === category.name
                    );
                    const spent = spending ? spending.amount : 0;
                    const budget = parseFloat(category.monthly_budget) || 0;
                    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

                    return (
                        <div key={category.id} className="budget-card">
                            <div className="budget-header">
                                <span className="budget-category">
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
                                <div className="budget-input-group">
                                    <label>Budget: $</label>
                                    <input
                                        type="number"
                                        defaultValue={budget}
                                        onBlur={(e) => handleBudgetUpdate(category.id, e.target.value)}
                                        step="10"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <p>No categories yet. Create categories in the Transactions page first.</p>
            )}
        </div>
    );
}

export default BudgetOverview;