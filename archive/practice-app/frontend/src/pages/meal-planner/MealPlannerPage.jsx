import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/MealPlannerPage.css';

const MealPlannerPage = () => {
  const {
    mealOptions,
    activePlan,
    updateActiveMeal,
    saveMealPlan,
    resetActivePlan,
    calculateTotalCost,
    calculateTotalNutrition,
    isLoading,
  } = useMealPlan();

  const toast = useToast();

  const [filters, setFilters] = useState({ meals: ['breakfast', 'lunch', 'dinner'], maxBudget: '' });

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === 'checkbox') {
      setFilters((prev) => {
        const meals = checked
          ? [...prev.meals, name]
          : prev.meals.filter((meal) => meal !== name);
        return { ...prev, meals };
      });
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMealSelection = (mealType, meal) => {
    updateActiveMeal(mealType, meal === activePlan[mealType] ? null : meal);
  };

  const handleSaveMealPlan = () => {
    const plan = {
      date: new Date().toISOString(),
      meals: activePlan,
      totalCost: calculateTotalCost(),
      totalNutrition: calculateTotalNutrition(),
    };

    const success = saveMealPlan(plan);
    if (success) {
      toast.success('Meal plan saved successfully!');
    } else {
      toast.error('Failed to save meal plan');
    }
  };

  const filteredMealOptions = Object.entries(mealOptions)
    .filter(([mealType]) => filters.meals.includes(mealType))
    .reduce((acc, [mealType, meals]) => {
      acc[mealType] = meals.filter((meal) => !filters.maxBudget || meal.cost <= Number(filters.maxBudget));
      return acc;
    }, {});

  const totalCost = calculateTotalCost();
  const totalNutrition = calculateTotalNutrition();
  const hasSelectedMeals = Object.values(activePlan).some(Boolean);
  useEffect(() => {
    document.title = "Meal Planner";
  }, []);
  return (
    <div className="meal-planner-container">
      <div className="meal-planner-header">
        <h1 className="meal-planner-title">Meal Planner</h1>
        <div className="flex gap-2">
          <Link to="/saved-meal-plans">
            <Button variant="secondary">View Saved Plans</Button>
          </Link>
          <Link to="/shopping-list">
            <Button disabled={!hasSelectedMeals}>Generate Shopping List</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Meal Types</h3>
              <div className="flex gap-3">
                {['breakfast', 'lunch', 'dinner'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      name={type}
                      checked={filters.meals.includes(type)}
                      onChange={handleFilterChange}
                      className="mr-1"
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium">Budget</h3>
              <input
                type="number"
                name="maxBudget"
                placeholder="Max cost per meal (₺)"
                value={filters.maxBudget}
                onChange={handleFilterChange}
                className="border rounded px-3 py-1 w-48"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading meal options...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredMealOptions).map(([mealType, meals]) => (
            <section key={mealType}>
              <h2 className="text-2xl font-semibold capitalize mb-4">{mealType}</h2>
              {meals.length > 0 ? (
                <div className="meal-options">
                  {meals.map((meal) => (
                    <Card
                      key={meal.id}
                      className={`meal-card ${activePlan[mealType]?.id === meal.id ? 'selected' : ''}`}
                      onClick={() => handleMealSelection(mealType, meal)}
                    >
                      <Card.Body>
                        <h3 className="font-semibold text-lg">{meal.title}</h3>
                        <p className="text-gray-600 mb-2">₺{meal.cost}</p>
                        <div className="text-sm text-gray-500">
                          <p>{meal.calories} calories</p>
                          <p>Protein: {meal.protein}g</p>
                          <p>Carbs: {meal.carbs}g</p>
                          <p>Fat: {meal.fat}g</p>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No meals available for the selected filters.</p>
              )}
            </section>
          ))}
        </div>
      )}

      <Card className="my-6">
        <Card.Header>
          <h2 className="text-xl font-semibold">Meal Plan Summary</h2>
        </Card.Header>
        <Card.Body>
          {hasSelectedMeals ? (
            <div>
              <div className="space-y-3 mb-4">
                {Object.entries(activePlan).map(
                  ([type, meal]) =>
                    meal && (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}:</span>
                        <span>{meal.title} (₺{meal.cost})</span>
                      </div>
                    )
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₺{totalCost}</span>
                </div>
              </div>

              <div className="nutrition-summary">
                <h3 className="font-semibold mb-2">Nutrition Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {totalNutrition.calories}</div>
                  <div>Protein: {totalNutrition.protein}g</div>
                  <div>Carbs: {totalNutrition.carbs}g</div>
                  <div>Fat: {totalNutrition.fat}g</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="success" onClick={handleSaveMealPlan}>
                  Save Meal Plan
                </Button>
                <Button variant="secondary" onClick={resetActivePlan}>
                  Clear Selections
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select meals from the options above to build your meal plan.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MealPlannerPage;
