// ============================================================================
// File: CategoryCreateForm.jsx
// Description: Modular child presenter component rendering the inline category
//              creation form with emoji selector and NonNegativeInput.
// ============================================================================
import { useState } from 'react';
import NonNegativeInput from '../../../common/inputs/NonNegativeInput';
import { CURRENCY } from '../../../../utils/config';

const PRESET_ICONS = ['🍔', '🏠', '🚗', '🛍️', '💡', '🏋️', '🎬', '💊', '✈️', '💰', '🏷️'];

/**
 * Component: CategoryCreateForm
 * Description: Child presenter component for adding a new budget category.
 * Props:
 *   - onCreateCategory (Function): Parent callback receiving new category object.
 *   - isCreating (Boolean): Loading indicator disabling inputs during submit.
 *   - showToast (Function): Toast notification callback.
 */
function CategoryCreateForm({ onCreateCategory, isCreating, showToast }) {
    const [newCategory, setNewCategory] = useState({ name: '', icon: '🏷️', monthly_budget: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            showToast?.('Please enter a category name.', 'error');
            return;
        }

        const rawBudget = parseFloat(newCategory.monthly_budget);
        const sanitizedBudget = !isNaN(rawBudget) ? Math.abs(rawBudget) : 0;

        onCreateCategory({
            name: newCategory.name.trim(),
            icon: newCategory.icon || '🏷️',
            monthly_budget: sanitizedBudget
        }, () => {
            // Reset form on success callback
            setNewCategory({ name: '', icon: '🏷️', monthly_budget: '' });
        });
    };

    return (
        <div className="budget-create-section">
            <form className="budget-create-form" onSubmit={handleSubmit} noValidate>
                <div className="form-inline-fields">
                    <div className="create-field">
                        <label>New Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Fitness, Dining"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            disabled={isCreating}
                        />
                    </div>

                    <div className="create-field">
                        <label>Monthly Limit ({CURRENCY})</label>
                        <NonNegativeInput
                            placeholder="0.00"
                            value={newCategory.monthly_budget}
                            onChange={(e) => setNewCategory({ ...newCategory, monthly_budget: e.target.value })}
                            disabled={isCreating}
                        />
                    </div>

                    <div className="create-field">
                        <label>Selected Icon: <span className="selected-preview-icon">{newCategory.icon}</span></label>
                        <div className="preset-icons-grid">
                            {PRESET_ICONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={`preset-icon-btn ${newCategory.icon === emoji ? 'active' : ''}`}
                                    onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                                    disabled={isCreating}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="create-field submit-field">
                        <button type="submit" className="create-category-btn" disabled={isCreating}>
                            {isCreating ? 'Creating...' : '+ Add Category'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CategoryCreateForm;
