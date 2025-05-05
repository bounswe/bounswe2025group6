import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecipes, filterRecipes, sortRecipes } from '../../services/recipeService';
import RecipeCard from '../../components/recipe/RecipeCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import '../../styles/RecipePages.css';

const RecipeDiscoveryPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({ searchTerm: '', maxCost: '', dietary: [] });
  const [inputValues, setInputValues] = useState({ searchTerm: '', maxCost: '', dietary: [] });

  const [sortBy, setSortBy] = useState('cost');
  const [sortOrder, setSortOrder] = useState('asc');

  const dietaryOptions = ['High Protein', 'Low Carbohydrate', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Quick', 'Budget-Friendly'];

  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        const allRecipes = await getAllRecipes();
        setRecipes(allRecipes);
        setFilteredRecipes(allRecipes);
      } catch (error) {
        console.error('Error loading recipes:', error);
        toast.error('Failed to load recipes');
      } finally {
        setIsLoading(false);
      }
    };
    loadRecipes();
  }, [toast]);

  useEffect(() => {
    try {
      const filtered = filterRecipes(filters);
      const sorted = sortRecipes(filtered, sortBy, sortOrder);
      setFilteredRecipes(sorted);
    } catch (error) {
      console.error('Filtering error:', error);
      toast.error('Failed to filter recipes');
    }
  }, [filters, sortBy, sortOrder, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  const toggleDietaryFilter = (diet) => {
    setInputValues(prev => {
      const updated = prev.dietary.includes(diet)
        ? prev.dietary.filter(d => d !== diet)
        : [...prev.dietary, diet];
      return { ...prev, dietary: updated };
    });
  };

  const handleSortChange = (e) => setSortBy(e.target.value);
  const toggleSortOrder = () => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));

  const applyFilters = () => setFilters(inputValues);

  const clearFilters = () => {
    const cleared = { searchTerm: '', maxCost: '', dietary: [] };
    setInputValues(cleared);
    setFilters(cleared);
    setSortBy('cost');
    setSortOrder('asc');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discover Recipes</h1>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          <Button onClick={() => navigate('/upload')}>Upload Recipe</Button>
        </div>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <input
              type="text"
              name="searchTerm"
              value={inputValues.searchTerm}
              onChange={handleInputChange}
              placeholder="Search recipes..."
              className="w-full md:w-1/3 px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              name="maxCost"
              value={inputValues.maxCost}
              onChange={handleInputChange}
              placeholder="Max cost (₺)"
              className="w-full md:w-1/4 px-3 py-2 border rounded-md"
            />
            <div className="flex w-full md:w-1/3">
              <select value={sortBy} onChange={handleSortChange} className="flex-1 px-3 py-2 border rounded-l-md">
                <option value="cost">Cost</option>
                <option value="time">Preparation Time</option>
                <option value="title">Title</option>
              </select>
              <button onClick={toggleSortOrder} className="px-3 py-2 border-t border-r border-b rounded-r-md bg-gray-50">
                {sortOrder === 'asc' ? '▲' : '▼'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {dietaryOptions.map(diet => (
              <button
                key={diet}
                onClick={() => toggleDietaryFilter(diet)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  inputValues.dietary.includes(diet)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={clearFilters}>Clear</Button>
            <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading recipes...</div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="text-center py-12">
            <p className="text-gray-500 mb-4">No recipes match your criteria.</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default RecipeDiscoveryPage;