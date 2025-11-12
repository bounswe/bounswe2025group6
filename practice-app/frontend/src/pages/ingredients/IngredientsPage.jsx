import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed wikidata import as it's not needed
import { useCurrency } from '../../contexts/CurrencyContext';
import '../../styles/IngredientList.css';
import '../../styles/IngredientsPage.css';
import { useTranslation } from "react-i18next";

// Main component for displaying and managing ingredients with pagination and search
const IngredientsPage = () => {
  // State declarations for managing ingredients, pagination, and UI state
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(30);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const navigate = useNavigate();

  // Set page title on component mount
  useEffect(() => {
    document.title = "Ingredients";
  }, []);

  // Fetch ingredients from API with pagination
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const url = `${import.meta.env.VITE_API_URL}/ingredients/?page=${page}&page_size=${pageSize}`;
        const token = localStorage.getItem("fithub_access_token");
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        
        setIngredients(data.results);
        setHasNextPage(page < data.total_pages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [page, pageSize]);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIngredients([]);
    } else {
      // For search, we need to fetch all ingredients
      const searchIngredients = async () => {
        try {
          let allData = [];
          let currentPage = 1;
          let hasMore = true;

          const token = localStorage.getItem("fithub_access_token");
          const headers = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          while (hasMore) {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ingredients/?page=${currentPage}&page_size=100`, { headers });
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            const data = await res.json();
            allData = [...allData, ...data.results];
            hasMore = currentPage < data.total_pages;
            currentPage++;
          }

          const filtered = allData.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredIngredients(filtered);
        } catch (err) {
          console.error('Search error:', err);
        }
      };
      
      searchIngredients();
    }
  }, [searchQuery]);

  // This useEffect is no longer needed as pagination is handled by the API

  // Pagination and page size handlers
  const handleNextPage = () => {
    if (hasNextPage) setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage((prevPage) => prevPage - 1);
  };

  const handlePageSizeChange = (e) => {
    const size = Number(e.target.value);
    setIsChanging(true);
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
    
    setTimeout(() => setIsChanging(false), 100);
  };

  // Loading and error states
  if (loading) {
    return <div>Loading ingredients…</div>;
  }
  if (error) return <div className="text-red-500">Error: {error}</div>;

  // Main render
  return (
    <div className="ingredients-page">
      {/* Page header and search */}
      <h1 className="page-title">Ingredients</h1>
      <div className="searchbox-container">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="searchbox"
        />
      </div>

      {/* Ingredients grid with search results or paginated list */}
      {searchQuery.trim() && filteredIngredients.length === 0 ? (
        <div className="no-results">
          No ingredients found matching "{searchQuery}"
        </div>
      ) : (
        <div className={`ingredients-grid fade ${isChanging ? 'fade-loading' : ''}`}>
          {Array.from({ length: Math.ceil(pageSize / 10) }).map((_, columnIndex) => (
            <div key={columnIndex} className="ingredient-column">
              <ul className="ingredient-list">
                {(searchQuery.trim() ? filteredIngredients : ingredients)
                  .slice(columnIndex * 10, (columnIndex + 1) * 10)
                  .map((ingredient) => (
                    <li
                      key={ingredient.id}
                      className="ingredient-item"
                      onClick={() => navigate(`/ingredients/${ingredient.id}`)}
                    >
                      <div className="ingredient-item-content" style={{'--name-length': ingredient.name.length}}>
                        <span className="ingredient-name">{ingredient.name}</span>
                        
                        {/* Nutritional Information */}
                        {ingredient.wikidata_info && ingredient.wikidata_info.nutrition && (
                          <div className="ingredient-nutrition">
                            <span className="nutrition-label">Nutrition:</span>
                            <div className="nutrition-list">
                              {Object.entries(ingredient.wikidata_info.nutrition).slice(0, 2).map(([key, value]) => (
                                <span key={key} className="nutrition-item">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Market Prices */}
                        {ingredient.prices && (
                          <div className="ingredient-prices">
                            <div className="price-list">
                              {ingredient.prices.A101 && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/a101.png" alt="A101" className="price-logo" />
                                  A101: {ingredient.prices.A101} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.SOK && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/sok.png" alt="ŞOK" className="price-logo" />
                                  ŞOK: {ingredient.prices.SOK} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.BIM && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/bim.png" alt="BIM" className="price-logo" />
                                  BIM: {ingredient.prices.BIM} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.MIGROS && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/migros.png" alt="MIGROS" className="price-logo" />
                                  MIGROS: {ingredient.prices.MIGROS} {ingredient.prices.currency || currency}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls and page size selector */}
      {!searchQuery.trim() && (
        <div className="controls-container">
          <div className="pagination-group">
            <button 
              className="pagination-button"
              onClick={handlePreviousPage} 
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="page-number">{page}</span>
            <button 
              className="pagination-button"
              onClick={handleNextPage} 
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
          <select 
            value={pageSize} 
            onChange={handlePageSizeChange} 
            className="ingredient-dropdown"
            disabled={isChanging}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
            <option value={40}>40 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default IngredientsPage;
