import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../../services/recipeService';
import RecipeCard from '../../components/recipe/RecipeCard';
import Button from '../../components/ui/Button';
import '../../styles/RecipePages.css';

const RecipeDiscoveryPage = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetchRecipes(currentPage, 10); // Sayfa başına 10 tarif
        setRecipes(response.results);
        setFilteredRecipes(response.results);
        setTotalPages(Math.ceil(response.total / 10));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) return <div>Loading recipes...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="recipe-discovery-page">
      <h1 className="page-title">Discover Recipes</h1>

      <div className="searchbox-container">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="searchbox"
        />
      </div>

      <div className="recipe-list">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <div className="pagination-controls">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span> {currentPage} </span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default RecipeDiscoveryPage;