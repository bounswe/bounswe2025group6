import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchRecipes } from '../../services/recipeService';
import RecipeCard from '../../components/recipe/RecipeCard';
import Button from '../../components/ui/Button';
import '../../styles/RecipeDiscoveryPage.css';
import '../../styles/style.css';
import { useTranslation } from "react-i18next";

const RecipeDiscoveryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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

  // Handle URL parameters and save filters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
      setSearchQuery(searchParam);
      // Save the current filters to localStorage for back navigation
      localStorage.setItem('recipeSearchFilters', location.search);
    } else {
      // Clear localStorage if no search params
      localStorage.removeItem('recipeSearchFilters');
    }
  }, [location.search]);

  // Save current search query as filter when it changes
  useEffect(() => {
    if (searchQuery) {
      const currentFilters = `search=${encodeURIComponent(searchQuery)}`;
      localStorage.setItem('recipeSearchFilters', currentFilters);
    } else {
      localStorage.removeItem('recipeSearchFilters');
    }
  }, [searchQuery]);
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetchRecipes(currentPage, 12);
        setRecipes(response.results);
        setFilteredRecipes(response.results);
        setTotalPages(Math.ceil(response.total / 12));
        
        // Optional: Prefetch next page data after current page loads
        if (currentPage < Math.ceil(response.total / 12)) {
          setTimeout(() => {
            fetchRecipes(currentPage + 1, 12).catch(err => 
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL with search parameter
    const urlParams = new URLSearchParams(location.search);
    if (value.trim()) {
      urlParams.set('search', value);
    } else {
      urlParams.delete('search');
    }
    
    const newSearch = urlParams.toString();
    const newUrl = newSearch ? `/recipes?${newSearch}` : '/recipes';
    navigate(newUrl, { replace: true });
  };

  if (loading) return <div>{t("recipeDiscoveryPageLoading")}</div>;
  if (error) return <div className="text-red-500">{t("recipeDiscoveryPageError")}: {error}</div>;

  return (
    <div id='recipeDiscoveryPage' className='container'>

      <h1>{t("recipeDiscoveryPagHeader")}</h1>

      <div className='recipe-discovery-page-header'>
        <input
            type="text"
            placeholder={t("recipeDiscoverySearchPlaceholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="recipe-discovery-page-header-item"
        />
        <button onClick={handleNavigateToUpload} className="green-button">
                  {t("recipeDiscoveryUploadRecipe")}
        </button>
      </div>

      <div className="recipe-list">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
      </div>

      <div className="pagination-controls">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className='pagination-green-button'>
            {t("previous")}
          </button>
          <span> {currentPage}/{totalPages} </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className='pagination-green-button'>
            {t("next")}
          </button>
      </div>

      

      


    
    
    </div>
  );
};

export default RecipeDiscoveryPage;