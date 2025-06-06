import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../../services/recipeService';
import RecipeCard from '../../components/recipe/RecipeCard';
import Button from '../../components/ui/Button';
import '../../styles/RecipeDiscoveryPage.css';
import '../../styles/style.css';

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
    document.title = "Recipe Discovery";
  }, []);
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetchRecipes(currentPage, 10);
        setRecipes(response.results);
        setFilteredRecipes(response.results);
        setTotalPages(Math.ceil(response.total / 10));
        
        // Optional: Prefetch next page data after current page loads
        if (currentPage < Math.ceil(response.total / 10)) {
          setTimeout(() => {
            fetchRecipes(currentPage + 1, 10).catch(err => 
              console.log('Error prefetching next page:', err)
            );
          }, 2000);
        }
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

  const handleNavigateToUpload = () => {
    navigate('/uploadRecipe');
  };

  if (loading) return <div>Loading recipes...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div id='recipeDiscoveryPage' className='container'>

      <h1>Discover Recipes</h1>

      <div className='recipe-discovery-page-header'>
        <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="recipe-discovery-page-header-item"
        />
        <button onClick={handleNavigateToUpload} className="green-button">
                  Upload New Recipe
        </button>
      </div>

      <div className="recipe-list">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
      </div>

      <div className="pagination-controls">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className='pagination-green-button'>
            Previous
          </button>
          <span> {currentPage} </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className='pagination-green-button'>
            Next
          </button>
      </div>

      

      


    
    
    </div>
  );
};

export default RecipeDiscoveryPage;