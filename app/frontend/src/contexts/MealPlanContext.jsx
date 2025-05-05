// src/contexts/MealPlanContext.jsx

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { 
  getSavedMealPlans, 
  saveMealPlan as saveMealPlanService, 
  deleteMealPlanById as deleteMealPlanService
} from '../services/mealPlanService';

// Initial mock data
const initialMealOptions = {
  breakfast: [
    { id: 1, title: "Oatmeal with Fruit", cost: 45, calories: 320, protein: 12, carbs: 54, fat: 6 },
    { id: 2, title: "Menemen", cost: 30, calories: 280, protein: 14, carbs: 12, fat: 18 },
    { id: 3, title: "Whole Grain Toast with Avocado", cost: 35, calories: 260, protein: 8, carbs: 30, fat: 12 },
    { id: 4, title: "Greek Yogurt with Honey", cost: 25, calories: 220, protein: 20, carbs: 26, fat: 5 },
    { id: 5, title: "Spinach and Feta Omelette", cost: 40, calories: 310, protein: 22, carbs: 4, fat: 22 },
  ],
  lunch: [
    { id: 6, title: "Grilled Chicken Salad", cost: 70, calories: 380, protein: 32, carbs: 12, fat: 22 },
    { id: 7, title: "Vegetarian Quinoa Bowl", cost: 65, calories: 420, protein: 14, carbs: 68, fat: 12 },
    { id: 8, title: "Lentil Soup", cost: 40, calories: 250, protein: 18, carbs: 36, fat: 4 },
    { id: 9, title: "Mediterranean Wrap", cost: 55, calories: 440, protein: 20, carbs: 48, fat: 18 },
    { id: 10, title: "Tuna Salad Sandwich", cost: 60, calories: 420, protein: 28, carbs: 42, fat: 14 },
  ],
  dinner: [
    { id: 11, title: "Stuffed Peppers", cost: 80, calories: 380, protein: 22, carbs: 32, fat: 18 },
    { id: 12, title: "Baked Salmon & Veggies", cost: 120, calories: 440, protein: 36, carbs: 16, fat: 24 },
    { id: 13, title: "Pasta Primavera", cost: 55, calories: 480, protein: 14, carbs: 72, fat: 16 },
    { id: 14, title: "Beef Stir Fry", cost: 90, calories: 520, protein: 32, carbs: 42, fat: 24 },
    { id: 15, title: "Vegetable Curry with Rice", cost: 65, calories: 460, protein: 12, carbs: 64, fat: 18 },
  ],
};

// Create context
const MealPlanContext = createContext();

// Action types
const SET_MEAL_OPTIONS = 'SET_MEAL_OPTIONS';
const SET_SAVED_PLANS = 'SET_SAVED_PLANS';
const ADD_PLAN = 'ADD_PLAN';
const DELETE_PLAN = 'DELETE_PLAN';
const SET_ACTIVE_PLAN = 'SET_ACTIVE_PLAN';

// Reducer function
const mealPlanReducer = (state, action) => {
  switch (action.type) {
    case SET_MEAL_OPTIONS:
      return { ...state, mealOptions: action.payload };
    case SET_SAVED_PLANS:
      return { ...state, savedPlans: action.payload };
    case ADD_PLAN:
      return { ...state, savedPlans: [...state.savedPlans, action.payload] };
    case DELETE_PLAN:
      return { 
        ...state, 
        savedPlans: state.savedPlans.filter((_, index) => index !== action.payload) 
      };
    case SET_ACTIVE_PLAN:
      return { ...state, activePlan: action.payload };
    default:
      return state;
  }
};

/**
 * MealPlanProvider component
 * Provides meal planning context to the app
 */
export const MealPlanProvider = ({ children }) => {
  // Initial state
  const initialState = {
    mealOptions: initialMealOptions,
    savedPlans: [],
    activePlan: {
      breakfast: null,
      lunch: null,
      dinner: null
    }
  };

  const [state, dispatch] = useReducer(mealPlanReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved meal plans on mount
  useEffect(() => {
    const loadSavedPlans = async () => {
      setIsLoading(true);
      try {
        const savedPlans = await getSavedMealPlans();
        dispatch({ type: SET_SAVED_PLANS, payload: savedPlans });
      } catch (err) {
        setError('Failed to load saved meal plans');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedPlans();
  }, []);

  /**
   * Save a meal plan
   * @param {Object} plan - The meal plan to save
   */
  const saveMealPlan = async (plan) => {
    setIsLoading(true);
    try {
      await saveMealPlanService(plan);
      dispatch({ type: ADD_PLAN, payload: plan });
      return true;
    } catch (err) {
      setError('Failed to save meal plan');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a meal plan by index
   * @param {number} index - The index of the plan to delete
   */
  const deleteMealPlan = async (index) => {
    setIsLoading(true);
    try {
      await deleteMealPlanService(index);
      dispatch({ type: DELETE_PLAN, payload: index });
      return true;
    } catch (err) {
      setError('Failed to delete meal plan');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set the active meal plan being worked on
   * @param {Object} plan - The meal plan
   */
  const setActivePlan = (plan) => {
    dispatch({ type: SET_ACTIVE_PLAN, payload: plan });
  };

  /**
   * Update a meal in the active plan
   * @param {string} mealType - The meal type (breakfast, lunch, dinner)
   * @param {Object|null} meal - The meal data or null to remove
   */
  const updateActiveMeal = (mealType, meal) => {
    dispatch({
      type: SET_ACTIVE_PLAN,
      payload: {
        ...state.activePlan,
        [mealType]: meal
      }
    });
  };

  /**
   * Calculate total cost of the active plan
   * @returns {number} The total cost
   */
  const calculateTotalCost = () => {
    return Object.values(state.activePlan)
      .filter(Boolean)
      .reduce((sum, meal) => sum + meal.cost, 0);
  };

  /**
   * Calculate total nutrition of the active plan
   * @returns {Object} The nutritional totals
   */
  const calculateTotalNutrition = () => {
    return Object.values(state.activePlan)
      .filter(Boolean)
      .reduce(
        (totals, meal) => ({
          calories: totals.calories + meal.calories,
          protein: totals.protein + meal.protein,
          carbs: totals.carbs + meal.carbs,
          fat: totals.fat + meal.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  };

  /**
   * Reset the active plan
   */
  const resetActivePlan = () => {
    dispatch({
      type: SET_ACTIVE_PLAN,
      payload: {
        breakfast: null,
        lunch: null,
        dinner: null
      }
    });
  };

  // Value to provide to consumers
  const value = {
    mealOptions: state.mealOptions,
    savedPlans: state.savedPlans,
    activePlan: state.activePlan,
    isLoading,
    error,
    saveMealPlan,
    deleteMealPlan,
    setActivePlan,
    updateActiveMeal,
    calculateTotalCost,
    calculateTotalNutrition,
    resetActivePlan
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};

/**
 * Hook to use the meal plan context
 */
export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
};