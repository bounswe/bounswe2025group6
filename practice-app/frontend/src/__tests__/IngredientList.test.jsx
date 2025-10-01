import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IngredientList from '../components/recipe/IngredientList';

describe('IngredientList Component', () => {
  const sampleIngredients = [
    { id: 1, name: 'Salt', quantity: 1, unit: 'tsp' },
    { id: 2, name: 'Flour', quantity: 2, unit: 'cup' },
    { id: 3, name: 'Eggs', quantity: 3, unit: 'pcs' },
  ];

  test('renders non-editable view with ingredients', () => {
    render(<IngredientList ingredients={sampleIngredients} editable={false} />);
    
    // Should render a list of ingredients
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(sampleIngredients.length);
    
    // Check content of ingredients
    expect(screen.getByText('Salt')).toBeInTheDocument();
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    
    // Check quantities
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders editable view with input fields', () => {
    render(<IngredientList ingredients={sampleIngredients} editable={true} />);
    
    // Should render ingredient names
    expect(screen.getByText('Salt')).toBeInTheDocument();
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    
    // Should render input fields for quantities
    const quantityInputs = screen.getAllByPlaceholderText('Qty');
    expect(quantityInputs).toHaveLength(sampleIngredients.length);
    
    // Should render select elements for units
    const unitSelects = screen.getAllByRole('combobox');
    expect(unitSelects).toHaveLength(sampleIngredients.length);
    
    // Should render delete buttons
    const deleteButtons = screen.getAllByText('×');
    expect(deleteButtons).toHaveLength(sampleIngredients.length);
  });

  test('calls onUpdate when quantity is changed', () => {
    const handleUpdate = jest.fn();
    render(
      <IngredientList 
        ingredients={sampleIngredients} 
        editable={true} 
        onUpdate={handleUpdate} 
      />
    );
    
    const quantityInputs = screen.getAllByPlaceholderText('Qty');
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });
    
    expect(handleUpdate).toHaveBeenCalledWith(0, {
      id: 1,
      name: 'Salt',
      quantity: '5',
      unit: 'tsp'
    });
  });

  test('calls onUpdate when unit is changed', () => {
    const handleUpdate = jest.fn();
    render(
      <IngredientList 
        ingredients={sampleIngredients} 
        editable={true} 
        onUpdate={handleUpdate} 
      />
    );
    
    const unitSelects = screen.getAllByRole('combobox');
    fireEvent.change(unitSelects[0], { target: { value: 'tbsp' } });
    
    expect(handleUpdate).toHaveBeenCalledWith(0, {
      id: 1,
      name: 'Salt',
      quantity: 1,
      unit: 'tbsp'
    });
  });

  test('calls onDelete when delete button is clicked', () => {
    const handleDelete = jest.fn();
    render(
      <IngredientList 
        ingredients={sampleIngredients} 
        editable={true} 
        onDelete={handleDelete} 
      />
    );
    
    const deleteButtons = screen.getAllByText('×');
    fireEvent.click(deleteButtons[1]); // Delete second ingredient
    
    expect(handleDelete).toHaveBeenCalledWith(1);
  });

  test('renders empty state when no ingredients are provided', () => {
    render(<IngredientList editable={false} />);
    
    // Should render an empty list
    const list = screen.getByRole('list');
    expect(list).toBeEmptyDOMElement();
  });

  test('renders selected ingredients when provided', () => {
    const selectedIngredients = [
      { id: 4, name: 'Sugar' },
      { id: 5, name: 'Butter' }
    ];
    
    render(
      <IngredientList 
        ingredients={sampleIngredients} 
        editable={true} 
        selectedIngredients={selectedIngredients} 
      />
    );
    
    // Should render selected ingredients
    expect(screen.getByText('Sugar')).toBeInTheDocument();
    expect(screen.getByText('Butter')).toBeInTheDocument();
    
    // And should render remove buttons
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons).toHaveLength(selectedIngredients.length);
  });

  test('calls onRemoveIngredient when Remove button is clicked', () => {
    const handleRemove = jest.fn();
    const selectedIngredients = [
      { id: 4, name: 'Sugar' },
      { id: 5, name: 'Butter' }
    ];
    
    render(
      <IngredientList 
        ingredients={sampleIngredients} 
        editable={true} 
        selectedIngredients={selectedIngredients}
        onRemoveIngredient={handleRemove}
      />
    );
    
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove first selected ingredient
    
    expect(handleRemove).toHaveBeenCalledWith(4); // Should call with the id of the first selected ingredient
  });
});
