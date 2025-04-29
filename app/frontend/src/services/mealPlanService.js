// src/services/mealPlanService.js

const MEAL_PLANS_KEY = 'savedMealPlans';

export const saveMealPlan = (plan) => {
  const existingPlans = JSON.parse(localStorage.getItem(MEAL_PLANS_KEY)) || [];
  const newPlans = [...existingPlans, plan];
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(newPlans));
};

export const getSavedMealPlans = () => {
  return JSON.parse(localStorage.getItem(MEAL_PLANS_KEY)) || [];
};

export const clearMealPlans = () => {
  localStorage.removeItem(MEAL_PLANS_KEY);
};

// TODO: Mock Deletion (localStorage)
export const deleteMealPlanById = (index) => {
    const existingPlans = JSON.parse(localStorage.getItem(MEAL_PLANS_KEY)) || [];
    existingPlans.splice(index, 1);
    localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(existingPlans));
  };
  
export const deleteSavedMealPlan = (index) => {
const saved = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
saved.splice(index, 1); // Remove 1 item at 'index'
localStorage.setItem('savedMealPlans', JSON.stringify(saved));
};
  /*
    TODO: 
    - Replace deleteMealPlanById(index) with real backend call later.
    - Example backend version:
  
      export const deleteMealPlanById = async (id) => {
        await api.delete(`/mealplans/${id}`);
      };
  */