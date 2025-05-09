// src/pages/shopping/ShoppingListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { generateShoppingList } from '../../services/mealPlanService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/ShoppingListPage.css';

const ShoppingListPage = () => {
  const { activePlan } = useMealPlan();
  const [shoppingList, setShoppingList] = useState({ categories: [], totalCost: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});
  const [selectedMarket, setSelectedMarket] = useState('BIM');

  // Market price modifiers (simplified)
  const marketPriceModifiers = {
    'BIM': 1.0, // Base price
    'A101': 1.05, // 5% more expensive
    'Migros': 1.12, // 12% more expensive
    'CarrefourSA': 1.15, // 15% more expensive
  };

  useEffect(() => {
    // Generate shopping list from active meal plan
    const generateList = async () => {
      setIsLoading(true);
      try {
        const list = await generateShoppingList({ activePlan });
        setShoppingList(list);
      } catch (error) {
        console.error('Error generating shopping list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateList();
  }, [activePlan]);

  // Initialize checkedItems for all items in the shopping list
  useEffect(() => {
    const initialCheckedState = {};
    shoppingList.categories.forEach(category => {
      category.items.forEach(item => {
        const itemKey = `${category.name}-${item.name}`;
        initialCheckedState[itemKey] = false;
      });
    });
    setCheckedItems(initialCheckedState);
  }, [shoppingList]);

  // Toggle check state for an item
  const toggleItemCheck = (categoryName, itemName) => {
    const itemKey = `${categoryName}-${itemName}`;
    setCheckedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Calculate the estimated cost at selected market
  const getMarketEstimate = (basePrice) => {
    return Math.round(basePrice * marketPriceModifiers[selectedMarket]);
  };

  // Get number of checked items
  const getCheckedItemsCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  // Get total number of items
  const getTotalItemsCount = () => {
    return Object.keys(checkedItems).length;
  };

  // Calculate remaining total (unchecked items)
  const getRemainingTotal = () => {
    let remaining = 0;
    shoppingList.categories.forEach(category => {
      category.items.forEach(item => {
        const itemKey = `${category.name}-${item.name}`;
        if (!checkedItems[itemKey]) {
          remaining += item.price;
        }
      });
    });
    return getMarketEstimate(remaining);
  };

  // Clear all checked items
  const clearCheckedItems = () => {
    const clearedState = {};
    Object.keys(checkedItems).forEach(key => {
      clearedState[key] = false;
    });
    setCheckedItems(clearedState);
  };

  // Check all items
  const checkAllItems = () => {
    const checkedState = {};
    Object.keys(checkedItems).forEach(key => {
      checkedState[key] = true;
    });
    setCheckedItems(checkedState);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Generating your shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping List</h1>
        <Button onClick={() => window.print()} variant="secondary">
          Print List
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span>Progress: {getCheckedItemsCount()}/{getTotalItemsCount()} items</span>
          <span>Remaining: ₺{getRemainingTotal()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(getCheckedItemsCount() / getTotalItemsCount()) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Market Selection */}
      <Card className="mb-6">
        <Card.Body>
          <h2 className="text-xl font-semibold mb-3">Choose Market</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(marketPriceModifiers).map(market => (
              <button
                key={market}
                onClick={() => setSelectedMarket(market)}
                className={`px-4 py-2 rounded-md ${
                  selectedMarket === market 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {market}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-gray-600">
              Estimated total at {selectedMarket}: <span className="font-semibold">₺{getMarketEstimate(shoppingList.totalCost)}</span>
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Shopping List */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Items to Buy</h2>
          <div className="space-x-2">
            <Button size="sm" variant="secondary" onClick={clearCheckedItems}>
              Uncheck All
            </Button>
            <Button size="sm" onClick={checkAllItems}>
              Check All
            </Button>
          </div>
        </div>

        {shoppingList.categories.length > 0 ? (
          <div className="space-y-6">
            {shoppingList.categories.map((category, index) => (
              <Card key={index}>
                <Card.Header>
                  <h3 className="font-semibold">{category.name}</h3>
                </Card.Header>
                <Card.Body>
                  <ul className="divide-y">
                    {category.items.map((item, itemIdx) => {
                      const itemKey = `${category.name}-${item.name}`;
                      return (
                        <li key={itemIdx} className="py-2">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={checkedItems[itemKey] || false}
                                onChange={() => toggleItemCheck(category.name, item.name)}
                                className="mr-3 h-5 w-5"
                              />
                              <span className={checkedItems[itemKey] ? 'line-through text-gray-400' : ''}>
                                {item.quantity} {item.name}
                              </span>
                            </div>
                            <span className={checkedItems[itemKey] ? 'text-gray-400' : 'font-medium'}>
                              ₺{item.price}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Card.Body>
              <p className="text-center text-gray-500">
                No items in your shopping list. Add meals to your meal plan first.
              </p>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 justify-center mt-8">
        <Link to="/meal-planner">
          <Button variant="secondary">Back to Meal Planner</Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default ShoppingListPage;