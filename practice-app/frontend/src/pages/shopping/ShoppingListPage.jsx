// ShoppingListPage.jsx - Enhanced shopping list management with meal plan integration
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRetailerInfo } from '../../services/mealPlanService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/ShoppingListPage.css';

const ShoppingListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [shoppingLists, setShoppingLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('BIM');
  const [showListModal, setShowListModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [showCompletedItems, setShowCompletedItems] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLists, setSelectedLists] = useState(new Set());

  const retailers = getRetailerInfo();

  // Category icons mapping
  const categoryIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    dairy: '🥛',
    meat: '🥩',
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    pantry: '🥫',
    spices: '🧂',
    frozen: '❄️',
    bakery: '🍞',
    default: '🛒'
  };

  // Load data on component mount
  useEffect(() => {
    loadShoppingLists();
    
    // Check if coming from meal plan with specific list to show
    if (location.state?.fromMealPlan) {
      const mealPlanId = location.state.fromMealPlan;
      // Find and show the shopping list for this meal plan
      setTimeout(() => {
        const savedLists = JSON.parse(localStorage.getItem('savedShoppingLists') || '[]');
        const targetList = savedLists.find(list => 
          list.mealPlanReference?.id === mealPlanId
        );
        if (targetList) {
          handleViewList(targetList);
        }
      }, 500);
    }
  }, [location.state]);

  const loadShoppingLists = () => {
    setIsLoading(true);
    try {
      // Get saved shopping lists
      const savedLists = JSON.parse(localStorage.getItem('savedShoppingLists') || '[]');
      
      // Get saved meal plans to generate shopping lists if none exist
      const savedMealPlans = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
      
      console.log('Loaded shopping lists:', savedLists);
      console.log('Loaded meal plans:', savedMealPlans);
      
      // If no shopping lists but meal plans exist, generate them
      if (savedLists.length === 0 && savedMealPlans.length > 0) {
        const generatedLists = generateShoppingListsFromMealPlans(savedMealPlans);
        setShoppingLists(generatedLists);
        
        if (generatedLists.length > 0) {
          localStorage.setItem('savedShoppingLists', JSON.stringify(generatedLists));
          if (showToast) {
            showToast(`Generated ${generatedLists.length} shopping lists from your meal plans!`, 'success');
          }
        }
      } else {
        setShoppingLists(savedLists);
      }
    } catch (error) {
      console.error('Error loading shopping lists:', error);
      if (showToast) {
        showToast('Error loading shopping lists', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate shopping lists from existing meal plans
  const generateShoppingListsFromMealPlans = (mealPlans) => {
    return mealPlans.map(plan => {
      const shoppingList = {
        id: `${plan.id}-shopping`,
        createdAt: new Date().toISOString(),
        mealPlanReference: {
          id: plan.id,
          name: plan.name,
          date: plan.date || plan.createdAt
        },
        items: [],
        totalCost: plan.totalCost || 0,
        costByMarket: {
          A101: 0,
          SOK: 0,
          BIM: 0,
          MIGROS: 0
        },
        cheapestMarket: 'BIM',
        mealReferences: []
      };

      // Process each meal in the meal plan
      if (plan.meals) {
        Object.entries(plan.meals).forEach(([mealType, meal]) => {
          if (meal) {
            // Add meal reference
            shoppingList.mealReferences.push({
              mealType,
              mealName: meal.name,
              recipeId: meal.id
            });

            // Create shopping list item for this meal
            const item = {
              id: `${meal.id}-item`,
              name: `Ingredients for ${meal.name}`,
              category: mealType,
              quantity: 1,
              unit: 'recipe',
              estimatedCosts: meal.recipe_costs || {
                A101: parseFloat(meal.cost_per_serving || 0),
                SOK: parseFloat(meal.cost_per_serving || 0),
                BIM: parseFloat(meal.cost_per_serving || 0),
                MIGROS: parseFloat(meal.cost_per_serving || 0)
              },
              mealInfo: {
                mealType,
                recipeName: meal.name,
                recipeId: meal.id
              }
            };

            shoppingList.items.push(item);

            // Add to market costs
            Object.entries(item.estimatedCosts).forEach(([market, cost]) => {
              shoppingList.costByMarket[market] += cost || 0;
            });
          }
        });
      }

      // Find cheapest market
      const cheapestMarket = Object.entries(shoppingList.costByMarket)
        .reduce((min, [market, cost]) => 
          cost < min.cost ? { market, cost } : min, 
          { market: 'BIM', cost: Infinity }
        ).market;

      shoppingList.cheapestMarket = cheapestMarket;
      shoppingList.totalCost = shoppingList.costByMarket[cheapestMarket];

      // Round costs
      Object.keys(shoppingList.costByMarket).forEach(market => {
        shoppingList.costByMarket[market] = Math.round(shoppingList.costByMarket[market] * 100) / 100;
      });
      shoppingList.totalCost = Math.round(shoppingList.totalCost * 100) / 100;

      return shoppingList;
    });
  };

  // Handle viewing shopping list details
  const handleViewList = (list) => {
    setSelectedList(list);
    setSelectedMarket(list.cheapestMarket || 'BIM');
    setCheckedItems(new Set());
    setShowListModal(true);
  };

  // Handle list selection for bulk operations
  const handleListSelect = (listId, isSelected) => {
    setSelectedLists(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(listId);
      } else {
        newSelected.delete(listId);
      }
      return newSelected;
    });
  };

  // Handle select all lists
  const handleSelectAllLists = (isSelected) => {
    if (isSelected) {
      setSelectedLists(new Set(shoppingLists.map(list => list.id)));
    } else {
      setSelectedLists(new Set());
    }
  };

  // Handle deleting a shopping list
  const handleDeleteList = (listId) => {
    if (window.confirm('Are you sure you want to delete this shopping list?')) {
      try {
        const updatedLists = shoppingLists.filter(list => list.id !== listId);
        setShoppingLists(updatedLists);
        setSelectedLists(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(listId);
          return newSelected;
        });
        localStorage.setItem('savedShoppingLists', JSON.stringify(updatedLists));
        if (showToast) {
          showToast('Shopping list deleted', 'success');
        }
      } catch (error) {
        console.error('Error deleting shopping list:', error);
        if (showToast) {
          showToast('Error deleting shopping list', 'error');
        }
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedLists.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedLists.size} shopping list(s)?`)) {
      try {
        const updatedLists = shoppingLists.filter(list => !selectedLists.has(list.id));
        setShoppingLists(updatedLists);
        setSelectedLists(new Set());
        localStorage.setItem('savedShoppingLists', JSON.stringify(updatedLists));
        if (showToast) {
          showToast(`Deleted ${selectedLists.size} shopping list(s)`, 'success');
        }
      } catch (error) {
        console.error('Error deleting shopping lists:', error);
        if (showToast) {
          showToast('Error deleting shopping lists', 'error');
        }
      }
    }
  };

  // Handle market change in modal
  const handleMarketChange = (market) => {
    setSelectedMarket(market);
  };

  // Handle item checking in shopping list
  const handleItemCheck = (itemId, isChecked) => {
    setCheckedItems(prev => {
      const newChecked = new Set(prev);
      if (isChecked) {
        newChecked.add(itemId);
      } else {
        newChecked.delete(itemId);
      }
      return newChecked;
    });
  };

  // Toggle category collapse
  const handleCategoryToggle = (category) => {
    setCollapsedCategories(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(category)) {
        newCollapsed.delete(category);
      } else {
        newCollapsed.add(category);
      }
      return newCollapsed;
    });
  };

  // Export shopping list
  const handleExportList = (list) => {
    try {
      const exportData = {
        name: list.mealPlanReference?.name || 'Shopping List',
        date: new Date(list.createdAt).toLocaleDateString(),
        market: selectedMarket,
        items: list.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          cost: item.estimatedCosts[selectedMarket]
        })),
        totalCost: list.costByMarket[selectedMarket]
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `shopping-list-${list.mealPlanReference?.name || 'list'}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      if (showToast) {
        showToast('Shopping list exported', 'success');
      }
    } catch (error) {
      console.error('Error exporting shopping list:', error);
      if (showToast) {
        showToast('Error exporting shopping list', 'error');
      }
    }
  };

  // Print shopping list
  const handlePrintList = () => {
    window.print();
  };

  // Regenerate shopping lists from meal plans
  const handleRegenerateFromMealPlans = () => {
    try {
      const savedMealPlans = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
      
      if (savedMealPlans.length === 0) {
        if (showToast) {
          showToast('No meal plans found to generate shopping lists', 'warning');
        }
        return;
      }

      const generatedLists = generateShoppingListsFromMealPlans(savedMealPlans);
      
      // Merge with existing lists (avoiding duplicates)
      const existingIds = shoppingLists.map(list => list.mealPlanReference?.id);
      const newLists = generatedLists.filter(list => 
        !existingIds.includes(list.mealPlanReference?.id)
      );

      const allLists = [...shoppingLists, ...newLists];
      setShoppingLists(allLists);
      localStorage.setItem('savedShoppingLists', JSON.stringify(allLists));

      if (showToast) {
        showToast(`Generated ${newLists.length} new shopping lists`, 'success');
      }
    } catch (error) {
      console.error('Error regenerating shopping lists:', error);
      if (showToast) {
        showToast('Error generating shopping lists', 'error');
      }
    }
  };

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!selectedList || !groupByCategory) {
      return { 'All Items': selectedList?.items || [] };
    }

    const groups = {};
    selectedList.items.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }, [selectedList, groupByCategory]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalLists = shoppingLists.length;
    const totalItems = shoppingLists.reduce((sum, list) => sum + list.items.length, 0);
    const avgCost = totalLists > 0 ? shoppingLists.reduce((sum, list) => sum + list.totalCost, 0) / totalLists : 0;
    const totalSavings = shoppingLists.reduce((sum, list) => {
      const maxCost = Math.max(...Object.values(list.costByMarket));
      const minCost = Math.min(...Object.values(list.costByMarket));
      return sum + (maxCost - minCost);
    }, 0);

    return { totalLists, totalItems, avgCost, totalSavings };
  }, [shoppingLists]);

  const ShoppingListCard = ({ list, isSelected, onSelect, onView, onDelete }) => (
    <div className={`shopping-list-card ${isSelected ? 'selected' : ''}`}>
      <div className="list-card-header">
        <div className="list-header-left">
          <input
            type="checkbox"
            className="list-select-checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(list.id, e.target.checked)}
          />
          <div>
            <h3 className="list-title">
              🛒 {list.mealPlanReference?.name || 'Shopping List'}
            </h3>
            <p className="list-date">
              Created: {new Date(list.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="list-status">
          <span className="status-badge complete">Ready</span>
        </div>
      </div>

      <div className="list-card-body">
        {list.mealPlanReference && (
          <div className="meal-plan-info">
            <p className="meal-plan-name">
              📋 From: {list.mealPlanReference.name}
            </p>
            {list.mealPlanReference.date && (
              <p className="meal-plan-date">
                📅 For: {new Date(list.mealPlanReference.date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="list-summary">
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Items:</span>
              <span className="summary-value">{list.items.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Best Price:</span>
              <span className="summary-value">
                ${list.totalCost.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="best-market">
            <span className="market-name">🏪 Best at {retailers[list.cheapestMarket]?.name}</span>
          </div>
        </div>

        {list.mealReferences && list.mealReferences.length > 0 && (
          <div className="meal-references">
            <p className="meal-ref-label">Meals included:</p>
            <div className="meal-ref-list">
              {list.mealReferences.slice(0, 3).map((ref, index) => (
                <span key={index} className="meal-ref-item">
                  {categoryIcons[ref.mealType]} {ref.mealName}
                </span>
              ))}
              {list.mealReferences.length > 3 && (
                <span className="meal-ref-more">+{list.mealReferences.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        <div className="market-comparison">
          <h4>Price Comparison:</h4>
          <div className="market-costs">
            {Object.entries(list.costByMarket).map(([market, cost]) => (
              <div key={market} className={`market-cost ${market === list.cheapestMarket ? 'cheapest' : ''}`}>
                <span className="market-name">{retailers[market]?.name}</span>
                <span className="market-price">${cost.toFixed(2)}</span>
                {market === list.cheapestMarket && <span className="cheapest-badge">Best</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="list-actions">
          <Button 
            onClick={() => onView(list)}
            variant="primary"
            size="small"
          >
            View Shopping List
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
              <button onClick={() => handleExportList(list)}>📁 Export</button>
              <button 
                onClick={() => onDelete(list.id)}
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
      <div className="shopping-list-container">
        <div className="loading-state">
          <h1>🛒 Shopping Lists</h1>
          <div className="loading-spinner"></div>
          <p>Loading your shopping lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-list-container">
      {/* Header */}
      <div className="shopping-list-header">
        <div>
          <h1 className="shopping-list-title">🛒 Shopping Lists</h1>
          <p className="shopping-list-subtitle">Manage your grocery shopping from meal plans</p>
        </div>
        
        <div className="header-actions">
          <Button
            onClick={loadShoppingLists}
            variant="outline"
          >
            🔄 Refresh
          </Button>
          
          <Button
            onClick={handleRegenerateFromMealPlans}
            variant="outline"
          >
            ➕ Generate from Meal Plans
          </Button>
          
          <Button
            onClick={() => navigate('/meal-planner')}
            variant="primary"
          >
            ➕ Create Meal Plan
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {shoppingLists.length > 0 && (
        <div className="stats-summary">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalLists}</span>
              <span className="stat-label">Shopping Lists</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalItems}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${stats.avgCost.toFixed(2)}</span>
              <span className="stat-label">Avg Cost</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${stats.totalSavings.toFixed(2)}</span>
              <span className="stat-label">Potential Savings</span>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {shoppingLists.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-left">
            <input
              type="checkbox"
              className="select-all-checkbox"
              checked={selectedLists.size === shoppingLists.length && shoppingLists.length > 0}
              onChange={(e) => handleSelectAllLists(e.target.checked)}
            />
            <span className="selection-info">
              {selectedLists.size > 0 
                ? `${selectedLists.size} list(s) selected`
                : `${shoppingLists.length} list(s) total`
              }
            </span>
          </div>
          
          {selectedLists.size > 0 && (
            <div className="bulk-action-buttons">
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="small"
              >
                🗑 Delete Selected ({selectedLists.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Shopping Lists */}
      {shoppingLists.length > 0 ? (
        <div className="shopping-lists-grid">
          {shoppingLists.map(list => (
            <ShoppingListCard
              key={list.id}
              list={list}
              isSelected={selectedLists.has(list.id)}
              onSelect={handleListSelect}
              onView={handleViewList}
              onDelete={handleDeleteList}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <div className="empty-icon">🛒</div>
          <h2>No Shopping Lists Found</h2>
          <p>Create a meal plan to automatically generate your shopping list, or generate lists from existing meal plans.</p>
          
          <div className="empty-actions">
            <Button
              onClick={handleRegenerateFromMealPlans}
              variant="primary"
            >
              📋 Generate from Saved Meal Plans
            </Button>
            
            <Button
              onClick={() => navigate('/meal-planner')}
              variant="outline"
            >
              ➕ Create New Meal Plan
            </Button>
          </div>
        </div>
      )}

      {/* Shopping List Detail Modal */}
      {showListModal && selectedList && (
        <Modal 
          isOpen={showListModal} 
          onClose={() => setShowListModal(false)}
          title={`🛒 ${selectedList.mealPlanReference?.name || 'Shopping List'}`}
          size="large"
        >
          <div className="shopping-list-detail">
            {/* Controls */}
            <div className="shopping-controls">
              <div className="shopping-controls-left">
                <div className="market-selector">
                  <label>Store:</label>
                  <select 
                    value={selectedMarket} 
                    onChange={(e) => handleMarketChange(e.target.value)}
                    className="market-select"
                  >
                    {Object.entries(retailers).map(([key, retailer]) => (
                      <option key={key} value={key}>
                        {retailer.name} - ${selectedList.costByMarket[key].toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="shopping-controls-right">
                <div className="toggle-controls">
                  <div className="toggle-item">
                    <input
                      type="checkbox"
                      id="group-by-category"
                      checked={groupByCategory}
                      onChange={(e) => setGroupByCategory(e.target.checked)}
                    />
                    <label htmlFor="group-by-category">Group by category</label>
                  </div>
                  <div className="toggle-item">
                    <input
                      type="checkbox"
                      id="show-completed"
                      checked={showCompletedItems}
                      onChange={(e) => setShowCompletedItems(e.target.checked)}
                    />
                    <label htmlFor="show-completed">Show completed items</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <h3>📊 Shopping Summary</h3>
                <div className="total-cost">${selectedList.costByMarket[selectedMarket].toFixed(2)}</div>
                <div className="cost-breakdown">
                  <div className="item-count">
                    <span className="checked-count">{checkedItems.size}</span>
                    <span> / {selectedList.items.length} items</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-card">
                <h3>🏪 Market Comparison</h3>
                <div className="cost-breakdown">
                  {Object.entries(selectedList.costByMarket).map(([market, cost]) => (
                    <div key={market} className="market-cost">
                      <span>{retailers[market]?.name}</span>
                      <span>${cost.toFixed(2)}</span>
                      {market === selectedList.cheapestMarket && <span className="cheapest-badge">Best</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shopping Items */}
            <div className="items-section">
              <div className="items-header">
                <h3>Shopping List for {retailers[selectedMarket].name}</h3>
                <Button
                  className="select-all-btn"
                  onClick={() => {
                    if (checkedItems.size === selectedList.items.length) {
                      setCheckedItems(new Set());
                    } else {
                      setCheckedItems(new Set(selectedList.items.map(item => item.id)));
                    }
                  }}
                >
                  {checkedItems.size === selectedList.items.length ? 'Uncheck All' : 'Check All'}
                </Button>
              </div>

              <div className="shopping-items">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="category-group">
                    {groupByCategory && (
                      <div 
                        className={`category-header ${collapsedCategories.has(category) ? 'collapsed' : ''}`}
                        onClick={() => handleCategoryToggle(category)}
                      >
                        <span className="category-icon">
                          {categoryIcons[category] || categoryIcons.default}
                        </span>
                        <span className="category-name">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                        <span className="category-count">{items.length}</span>
                        <span className="collapse-icon">▼</span>
                      </div>
                    )}
                    
                    {(!groupByCategory || !collapsedCategories.has(category)) && (
                      <div className="category-items">
                        {items
                          .filter(item => showCompletedItems || !checkedItems.has(item.id))
                          .map(item => (
                            <div 
                              key={item.id} 
                              className={`shopping-item ${checkedItems.has(item.id) ? 'checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                className="item-checkbox"
                                checked={checkedItems.has(item.id)}
                                onChange={(e) => handleItemCheck(item.id, e.target.checked)}
                              />
                              
                              <div className="item-details">
                                <div className="item-info">
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-quantity">
                                    {item.quantity} {item.unit}
                                  </span>
                                  {item.mealInfo && (
                                    <span className="item-recipe-refs">
                                      For {item.mealInfo.mealType}: {item.mealInfo.recipeName}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="item-cost">
                                  <span className="current-cost">
                                    ${item.estimatedCosts[selectedMarket].toFixed(2)}
                                  </span>
                                  <div className="cost-options">
                                    {Object.entries(item.estimatedCosts)
                                      .filter(([market]) => market !== selectedMarket)
                                      .map(([market, cost]) => (
                                        <div key={market} className="cost-option">
                                          <span>{retailers[market]?.name}: ${cost.toFixed(2)}</span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Plan Reference */}
            {selectedList.mealPlanReference && (
              <div className="meal-plan-reference">
                <h4>📋 From Meal Plan:</h4>
                <p><strong>{selectedList.mealPlanReference.name}</strong></p>
                {selectedList.mealPlanReference.date && (
                  <p>📅 Planned for: {new Date(selectedList.mealPlanReference.date).toLocaleDateString()}</p>
                )}
                
                <div className="reference-actions">
                  <Button
                    onClick={() => {
                      setShowListModal(false);
                      navigate('/saved-meal-plans');
                    }}
                    variant="outline"
                    size="small"
                  >
                    📋 View Meal Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="action-buttons no-print">
              <Button
                onClick={() => handleExportList(selectedList)}
                variant="outline"
              >
                📁 Export List
              </Button>
              <Button
                onClick={handlePrintList}
                variant="outline"
              >
                🖨️ Print List
              </Button>
              <Button
                onClick={() => setShowListModal(false)}
                variant="primary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShoppingListPage;