// SavedMealPlansPage.jsx - Manage saved meal plans
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSavedMealPlans, 
  deleteMealPlanById, 
  loadMealPlanById,
  exportMealPlan 
} from '../../services/mealPlanService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/SavedMealPlansPage.css';

const SavedMealPlansPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [filterText, setFilterText] = useState('');
  const [selectedPlans, setSelectedPlans] = useState(new Set());

  // Load meal plans on component mount
  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = () => {
    setIsLoading(true);
    try {
      const plans = getSavedMealPlans();
      console.log('Loaded meal plans:', plans);
      setMealPlans(plans);
    } catch (error) {
      console.error('Error loading meal plans:', error);
      if (showToast) {
        showToast('Error loading meal plans', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort meal plans
  const filteredAndSortedPlans = React.useMemo(() => {
    let filtered = mealPlans.filter(plan =>
      plan.name.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return (a.totalCost || 0) - (b.totalCost || 0);
        case 'calories':
          return (a.totalNutrition?.calories || 0) - (b.totalNutrition?.calories || 0);
        case 'date':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return filtered;
  }, [mealPlans, filterText, sortBy]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (mealPlans.length === 0) return { totalPlans: 0, avgCost: 0, avgCalories: 0, totalCost: 0 };
    
    const totalCost = mealPlans.reduce((sum, plan) => sum + (plan.totalCost || 0), 0);
    const totalCalories = mealPlans.reduce((sum, plan) => sum + (plan.totalNutrition?.calories || 0), 0);
    
    return {
      totalPlans: mealPlans.length,
      avgCost: totalCost / mealPlans.length,
      avgCalories: Math.round(totalCalories / mealPlans.length),
      totalCost: totalCost
    };
  }, [mealPlans]);

  // Handle plan selection
  const handlePlanSelect = (planId, isSelected) => {
    setSelectedPlans(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(planId);
      } else {
        newSelected.delete(planId);
      }
      return newSelected;
    });
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedPlans(new Set(filteredAndSortedPlans.map(plan => plan.id)));
    } else {
      setSelectedPlans(new Set());
    }
  };

  // Handle viewing plan details
  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
  };

  // Handle plan deletion
  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteConfirm(true);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedPlans.size === 0) return;
    
    const planNames = Array.from(selectedPlans)
      .map(id => mealPlans.find(p => p.id === id)?.name)
      .filter(Boolean);
    
    if (window.confirm(`Are you sure you want to delete ${selectedPlans.size} meal plan(s)?\n\n${planNames.join('\n')}`)) {
      let successCount = 0;
      
      selectedPlans.forEach(planId => {
        if (deleteMealPlanById(planId)) {
          successCount++;
        }
      });
      
      setMealPlans(prev => prev.filter(plan => !selectedPlans.has(plan.id)));
      setSelectedPlans(new Set());
      
      if (showToast) {
        showToast(`Successfully deleted ${successCount} meal plan(s)`, 'success');
      }
    }
  };

  const confirmDelete = () => {
    if (planToDelete) {
      const success = deleteMealPlanById(planToDelete.id);
      if (success) {
        setMealPlans(prev => prev.filter(plan => plan.id !== planToDelete.id));
        
        // Clean up associated shopping list
        try {
          const savedLists = JSON.parse(localStorage.getItem('savedShoppingLists') || '[]');
          const filteredLists = savedLists.filter(list => 
            !(list.mealPlanReference && list.mealPlanReference.id === planToDelete.id)
          );
          localStorage.setItem('savedShoppingLists', JSON.stringify(filteredLists));
        } catch (error) {
          console.error('Error cleaning up shopping list:', error);
        }
        
        if (showToast) {
          showToast('Meal plan deleted successfully', 'success');
        }
      } else {
        if (showToast) {
          showToast('Error deleting meal plan', 'error');
        }
      }
    }
    setShowDeleteConfirm(false);
    setPlanToDelete(null);
  };

  // Handle loading plan to meal planner
  const handleLoadToPlan = (plan) => {
    try {
      localStorage.setItem('loadedMealPlan', JSON.stringify(plan));
      navigate('/meal-planner');
      if (showToast) {
        showToast('Meal plan loaded to planner', 'success');
      }
    } catch (error) {
      console.error('Error loading plan to meal planner:', error);
      if (showToast) {
        showToast('Error loading plan', 'error');
      }
    }
  };

  // Handle exporting plan
  const handleExportPlan = (plan) => {
    try {
      const exportData = exportMealPlan(plan, 'json');
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(exportData);
      
      const exportFileDefaultName = `meal-plan-${plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      if (showToast) {
        showToast('Meal plan exported', 'success');
      }
    } catch (error) {
      console.error('Error exporting meal plan:', error);
      if (showToast) {
        showToast('Error exporting meal plan', 'error');
      }
    }
  };

  // Handle viewing shopping list
  const handleViewShoppingList = (plan) => {
    navigate('/shopping-list', { 
      state: { 
        fromMealPlan: plan.id,
        mealPlanName: plan.name 
      } 
    });
  };

  // Handle duplicating a plan
  const handleDuplicatePlan = (plan) => {
    try {
      const duplicatedPlan = {
        ...plan,
        id: Date.now().toString(),
        name: `${plan.name} (Copy)`,
        createdAt: new Date().toISOString()
      };
      
      const savedPlans = getSavedMealPlans();
      savedPlans.push(duplicatedPlan);
      localStorage.setItem('savedMealPlans', JSON.stringify(savedPlans));
      
      setMealPlans(prev => [...prev, duplicatedPlan]);
      
      if (showToast) {
        showToast('Meal plan duplicated', 'success');
      }
    } catch (error) {
      console.error('Error duplicating meal plan:', error);
      if (showToast) {
        showToast('Error duplicating meal plan', 'error');
      }
    }
  };

  const MealPlanCard = ({ plan, isSelected, onSelect, onView, onDelete, onLoad, onExport, onViewShopping, onDuplicate }) => (
    <div className={`plan-card ${isSelected ? 'selected' : ''}`}>
      <div className="plan-card-header">
        <div className="plan-header-left">
          <input
            type="checkbox"
            className="plan-select-checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(plan.id, e.target.checked)}
          />
          <div>
            <h3 className="plan-title">{plan.name}</h3>
            <p className="plan-date">{new Date(plan.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="plan-status">
          {plan.totalNutrition && (
            <span className="status-badge complete">Complete</span>
          )}
        </div>
      </div>

      <div className="plan-card-body">
        {/* Meal Summary */}
        <div className="meal-summary">
          {Object.entries(plan.meals || {}).map(([mealType, meal]) => (
            <div key={mealType} className="meal-row">
              <span className="meal-type">
                {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : '🌙'}
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </span>
              <span className={`meal-name ${!meal ? 'empty' : ''}`}>
                {meal ? meal.name : 'Not selected'}
              </span>
              {meal && (
                <span className="meal-cost">${parseFloat(meal.cost_per_serving || 0).toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>

        {/* Plan Totals */}
        <div className="plan-totals">
          <div className="total-cost">
            <span className="total-cost-label">Total Cost</span>
            <span className="total-cost-value">${(plan.totalCost || 0).toFixed(2)}</span>
          </div>
          
          {plan.totalNutrition && (
            <div className="nutrition-summary">
              <div className="nutrition-item">
                <span className="nutrition-value">{plan.totalNutrition.calories || 0}</span>
                <span>cal</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">{plan.totalNutrition.protein || 0}g</span>
                <span>protein</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">{plan.totalNutrition.carbs || 0}g</span>
                <span>carbs</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">{plan.totalNutrition.fat || 0}g</span>
                <span>fat</span>
              </div>
            </div>
          )}
        </div>

        {/* Plan Actions */}
        <div className="plan-actions">
          <Button 
            onClick={() => onView(plan)}
            variant="primary"
            size="small"
          >
            View Details
          </Button>
          
          <Button 
            onClick={() => onLoad(plan)}
            variant="outline"
            size="small"
          >
            Load to Planner
          </Button>
          
          <div className="action-dropdown">
            <Button 
              variant="outline"
              size="small"
              className="dropdown-trigger"
              onClick={(e) => {
                e.currentTarget.parentNode.classList.toggle('active');
              }}
            >
              ⋯
            </Button>
            <div className="dropdown-menu">
              <button onClick={() => onViewShopping(plan)}>🛒 Shopping List</button>
              <button onClick={() => onDuplicate(plan)}>📋 Duplicate</button>
              <button onClick={() => onExport(plan)}>📁 Export</button>
              <button 
                onClick={() => onDelete(plan)}
                className="delete-action"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="saved-plans-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-plans-container">
      {/* Header */}
      <div className="saved-plans-header">
        <div>
          <h1 className="saved-plans-title">📋 Saved Meal Plans</h1>
          <p className="saved-plans-subtitle">Manage and reuse your meal plans</p>
        </div>
        
        <div className="header-actions">
          <Button
            onClick={loadMealPlans}
            variant="outline"
          >
            🔄 Refresh
          </Button>
          <Button
            onClick={() => navigate('/meal-planner')}
            variant="primary"
          >
            ➕ Create New Plan
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {mealPlans.length > 0 && (
        <div className="stats-summary">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalPlans}</span>
              <span className="stat-label">Total Plans</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${stats.avgCost.toFixed(2)}</span>
              <span className="stat-label">Avg Cost</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgCalories}</span>
              <span className="stat-label">Avg Calories</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${stats.totalCost.toFixed(2)}</span>
              <span className="stat-label">Total Saved</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="search-section">
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search meal plans..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date">Date (Newest First)</option>
                <option value="name">Name</option>
                <option value="cost">Cost (Low to High)</option>
                <option value="calories">Calories (Low to High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredAndSortedPlans.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-left">
            <input
              type="checkbox"
              className="select-all-checkbox"
              checked={selectedPlans.size === filteredAndSortedPlans.length && filteredAndSortedPlans.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="selection-info">
              {selectedPlans.size > 0 
                ? `${selectedPlans.size} plan(s) selected`
                : `${filteredAndSortedPlans.length} plan(s) total`
              }
            </span>
          </div>
          
          {selectedPlans.size > 0 && (
            <div className="bulk-action-buttons">
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="small"
              >
                🗑 Delete Selected ({selectedPlans.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Meal Plans Grid */}
      {filteredAndSortedPlans.length > 0 ? (
        <div className="plans-grid">
          {filteredAndSortedPlans.map(plan => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlans.has(plan.id)}
              onSelect={handlePlanSelect}
              onView={handleViewPlan}
              onDelete={handleDeletePlan}
              onLoad={handleLoadToPlan}
              onExport={handleExportPlan}
              onViewShopping={handleViewShoppingList}
              onDuplicate={handleDuplicatePlan}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2>
            {filterText ? 'No meal plans match your search' : 'No Saved Meal Plans'}
          </h2>
          <p>
            {filterText 
              ? 'Try adjusting your search terms or clearing your search to see all plans.' 
              : 'Create your first meal plan to get started with organized meal planning.'
            }
          </p>
          
          {!filterText && (
            <Button
              onClick={() => navigate('/meal-planner')}
              variant="primary"
            >
              Create Your First Meal Plan
            </Button>
          )}
        </div>
      )}

      {/* Plan Detail Modal */}
      {showDetailModal && selectedPlan && (
        <Modal 
          isOpen={showDetailModal} 
          onClose={() => setShowDetailModal(false)}
          title={selectedPlan.name}
          size="large"
        >
          <div className="plan-detail">
            <div className="detail-header">
              <p><strong>Created:</strong> {new Date(selectedPlan.createdAt).toLocaleDateString()}</p>
              {selectedPlan.date && (
                <p><strong>Planned for:</strong> {new Date(selectedPlan.date).toLocaleDateString()}</p>
              )}
            </div>

            {/* Meals */}
            <div className="detail-meals">
              <h4>Meals:</h4>
              {selectedPlan.meals && Object.entries(selectedPlan.meals).map(([mealType, meal]) => (
                meal && (
                  <div key={mealType} className="detail-meal">
                    <div className="meal-header">
                      <h5>
                        {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : '🌙'}
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </h5>
                      <span className="meal-cost">
                        ${parseFloat(meal.cost_per_serving || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="meal-info">
                      <p><strong>{meal.name}</strong></p>
                      
                      {meal.recipe_nutritions && (
                        <div className="meal-nutrition">
                          <span>🔥 {meal.recipe_nutritions.calories || 0}cal</span>
                          <span>🥩 {meal.recipe_nutritions.protein || 0}g protein</span>
                          <span>🥖 {meal.recipe_nutritions.carbs || 0}g carbs</span>
                          <span>🥑 {meal.recipe_nutritions.fat || 0}g fat</span>
                        </div>
                      )}
                      
                      <div className="meal-meta">
                        <span>⏱ {meal.total_time || (meal.prep_time + meal.cook_time) || 0}min</span>
                        {meal.difficulty_rating && (
                          <span>⭐ {meal.difficulty_rating}/5 difficulty</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setShowDetailModal(false);
                        navigate(`/recipes/${meal.id}`);
                      }}
                      variant="outline"
                      size="small"
                    >
                      View Recipe
                    </Button>
                  </div>
                )
              ))}
            </div>

            {/* Totals */}
            {selectedPlan.totalNutrition && (
              <div className="detail-totals">
                <h4>Total Nutrition:</h4>
                <div className="nutrition-grid">
                  <div className="nutrition-item">
                    <span>Calories</span>
                    <strong>{selectedPlan.totalNutrition.calories}</strong>
                  </div>
                  <div className="nutrition-item">
                    <span>Protein</span>
                    <strong>{selectedPlan.totalNutrition.protein}g</strong>
                  </div>
                  <div className="nutrition-item">
                    <span>Carbs</span>
                    <strong>{selectedPlan.totalNutrition.carbs}g</strong>
                  </div>
                  <div className="nutrition-item">
                    <span>Fat</span>
                    <strong>{selectedPlan.totalNutrition.fat}g</strong>
                  </div>
                </div>
                
                <div className="total-cost-display">
                  <span>Total Cost: </span>
                  <strong>${(selectedPlan.totalCost || 0).toFixed(2)}</strong>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <Button
                onClick={() => handleLoadToPlan(selectedPlan)}
                variant="primary"
              >
                Load to Meal Planner
              </Button>
              <Button
                onClick={() => handleViewShoppingList(selectedPlan)}
                variant="outline"
              >
                View Shopping List
              </Button>
              <Button
                onClick={() => handleDuplicatePlan(selectedPlan)}
                variant="outline"
              >
                Duplicate Plan
              </Button>
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && planToDelete && (
        <Modal 
          isOpen={showDeleteConfirm} 
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
        >
          <div className="delete-confirm">
            <p>Are you sure you want to delete "{planToDelete.name}"?</p>
            <p className="delete-warning">
              This action cannot be undone and will also delete the associated shopping list.
            </p>
            
            <div className="modal-actions">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="primary"
                className="delete-button"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SavedMealPlansPage;