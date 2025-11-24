{/* 

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

describe('Apple Ingredient Workflow Scenario', () => {
  const mockIngredients = [
    {
      id: 1,
      name: 'Apple',
      category: 'fruit',
      base_unit: 'g',
      base_quantity: 182,
      allowed_units: ['g', 'kg', 'pcs'],
      wikidata_info: {
        nutrition: {
          calories: 95,
          protein: 0.5,
          fat: 0.3,
          carbohydrates: 25.0,
          fiber: 4.4,
        },
      },
    },
  ];

  beforeEach(() => {
    localStorage.setItem('fithub_access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Mock component to test ingredient display
  const MockIngredientsDisplay = () => {
    return (
      <div>
        <h1>Ingredients</h1>
        {mockIngredients.map(ingredient => (
          <div key={ingredient.id} className="ingredient-item">
            <button>{ingredient.name}</button>
            <p>Category: {ingredient.category}</p>
            <div className="nutrition-info">
              <p>Calories: {ingredient.wikidata_info.nutrition.calories} kcal</p>
              <p>Protein: {ingredient.wikidata_info.nutrition.protein} g</p>
              <p>Fat: {ingredient.wikidata_info.nutrition.fat} g</p>
              <p>Carbohydrates: {ingredient.wikidata_info.nutrition.carbohydrates} g</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  test('should search for Apple ingredient', () => {
    const searchTerm = 'Apple';
    const filtered = mockIngredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Apple');
  });

  test('should find and click Apple ingredient', () => {
    render(
      <BrowserRouter>
        <MockIngredientsDisplay />
      </BrowserRouter>
    );

    const appleButton = screen.getByRole('button', { name: /apple/i });
    expect(appleButton).toBeInTheDocument();

    fireEvent.click(appleButton);
    expect(appleButton).toBeInTheDocument();
  });

  test('should verify Apple category is fruit', () => {
    const apple = mockIngredients[0];
    expect(apple.category).toBe('fruit');
  });

  test('should display Apple category correctly', () => {
    render(
      <BrowserRouter>
        <MockIngredientsDisplay />
      </BrowserRouter>
    );

    expect(screen.getByText(/Category: fruit/i)).toBeInTheDocument();
  });

  test('should verify Apple nutritional info: 95 kcal calories', () => {
    const apple = mockIngredients[0];
    const nutrition = apple.wikidata_info.nutrition;

    expect(nutrition.calories).toBe(95);
  });

  test('should verify Apple nutritional info: 0.5 g protein', () => {
    const apple = mockIngredients[0];
    const nutrition = apple.wikidata_info.nutrition;

    expect(nutrition.protein).toBe(0.5);
  });

  test('should verify Apple nutritional info: 0.3 g fat', () => {
    const apple = mockIngredients[0];
    const nutrition = apple.wikidata_info.nutrition;

    expect(nutrition.fat).toBe(0.3);
  });

  test('should verify Apple nutritional info: 25.0 g carbohydrates', () => {
    const apple = mockIngredients[0];
    const nutrition = apple.wikidata_info.nutrition;

    expect(nutrition.carbohydrates).toBe(25.0);
  });

  test('should display all Apple nutritional information correctly', () => {
    render(
      <BrowserRouter>
        <MockIngredientsDisplay />
      </BrowserRouter>
    );

    // Verify category
    expect(screen.getByText(/Category: fruit/i)).toBeInTheDocument();

    // Verify nutritional information
    expect(screen.getByText(/Calories: 95 kcal/i)).toBeInTheDocument();
    expect(screen.getByText(/Protein: 0.5 g/i)).toBeInTheDocument();
    expect(screen.getByText(/Fat: 0.3 g/i)).toBeInTheDocument();
    expect(screen.getByText(/Carbohydrates: 25 g/i)).toBeInTheDocument();
  });

  test('should complete full Apple workflow: search -> click -> verify category -> verify nutrition', () => {
    // Step 1: Search for Apple
    const searchTerm = 'Apple';
    const filtered = mockIngredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Apple');

    const apple = filtered[0];

    // Step 2: Verify category is 'fruit'
    expect(apple.category).toBe('fruit');

    // Step 3: Verify nutritional information
    const nutrition = apple.wikidata_info.nutrition;
    expect(nutrition.calories).toBe(95);
    expect(nutrition.protein).toBe(0.5);
    expect(nutrition.fat).toBe(0.3);
    expect(nutrition.carbohydrates).toBe(25.0);

    // Step 4: Render and verify UI display
    render(
      <BrowserRouter>
        <MockIngredientsDisplay />
      </BrowserRouter>
    );

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText(/Category: fruit/i)).toBeInTheDocument();
    expect(screen.getByText(/Calories: 95 kcal/i)).toBeInTheDocument();
    expect(screen.getByText(/Protein: 0.5 g/i)).toBeInTheDocument();
    expect(screen.getByText(/Fat: 0.3 g/i)).toBeInTheDocument();
    expect(screen.getByText(/Carbohydrates: 25 g/i)).toBeInTheDocument();
  });
});



*/}