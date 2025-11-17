import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed wikidata import as it's not needed
import { useCurrency } from '../../contexts/CurrencyContext';
import { translateIngredient } from '../../utils/ingredientTranslations';
import '../../styles/IngredientList.css';
import '../../styles/IngredientsPage.css';
import { useTranslation } from "react-i18next";

// Main component for displaying and managing ingredients with pagination and search
const IngredientsPage = () => {
  // State declarations for managing ingredients, pagination, and UI state
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  
  // Get current language for ingredient translation
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language.startsWith('tr') ? 'tr' : 'en');
  
  // Update language when i18n language changes
  useEffect(() => {
    const lang = i18n.language.startsWith('tr') ? 'tr' : 'en';
    setCurrentLanguage(lang);
  }, [i18n.language]);
  
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(50);
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
        
        // Sort ingredients by translated name based on current language
        const sortedIngredients = [...data.results].sort((a, b) => {
          const nameA = translateIngredient(a.name, currentLanguage);
          const nameB = translateIngredient(b.name, currentLanguage);
          
          if (currentLanguage === 'tr') {
            // Turkish-specific sorting - use Turkish locale for proper character ordering
            // Turkish alphabet: A, B, C, Ç, D, E, F, G, Ğ, H, I, İ, J, K, L, M, N, O, Ö, P, R, S, Ş, T, U, Ü, V, Y, Z
            const result = nameA.localeCompare(nameB, 'tr-TR', { 
              sensitivity: 'base',
              ignorePunctuation: true,
              numeric: true 
            });
            return result;
          } else {
            // English sorting
            return nameA.localeCompare(nameB, 'en-US', { 
              sensitivity: 'base',
              ignorePunctuation: true,
              numeric: true 
            });
          }
        });
        
        // Debug: Log first few sorted items to verify sorting
        if (currentLanguage === 'tr' && sortedIngredients.length > 0) {
          console.log('Turkish sorting - First 5 items:', sortedIngredients.slice(0, 5).map(i => translateIngredient(i.name, 'tr')));
          console.log('Current language:', currentLanguage, 'i18n.language:', i18n.language);
        }
        
        setIngredients(sortedIngredients);
        setHasNextPage(page < data.total_pages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [page, pageSize, currentLanguage]);

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

          const filtered = allData.filter((ingredient) => {
            // Search only in the current language
            const translatedName = translateIngredient(ingredient.name, currentLanguage).toLowerCase();
            const query = searchQuery.toLowerCase();
            return translatedName.includes(query);
          });
          
          // Sort filtered ingredients by translated name based on current language
          const sortedFiltered = filtered.sort((a, b) => {
            const nameA = translateIngredient(a.name, currentLanguage);
            const nameB = translateIngredient(b.name, currentLanguage);
            
            if (currentLanguage === 'tr') {
              // Turkish-specific sorting - use Turkish locale for proper character ordering
              // Turkish alphabet: A, B, C, Ç, D, E, F, G, Ğ, H, I, İ, J, K, L, M, N, O, Ö, P, R, S, Ş, T, U, Ü, V, Y, Z
              return nameA.localeCompare(nameB, 'tr-TR', { 
                sensitivity: 'base',
                ignorePunctuation: true,
                numeric: true 
              });
            } else {
              // English sorting
              return nameA.localeCompare(nameB, 'en-US', { 
                sensitivity: 'base',
                ignorePunctuation: true,
                numeric: true 
              });
            }
          });
          
          setFilteredIngredients(sortedFiltered);
        } catch (err) {
          console.error('Search error:', err);
        }
      };
      
      searchIngredients();
    }
  }, [searchQuery, currentLanguage]);

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
          {(() => {
            const itemsToShow = searchQuery.trim() ? filteredIngredients : ingredients;
            // Calculate number of columns based on pageSize
            // 50 -> 5 columns, 40 -> 4 columns, 20 -> 2 columns, 10 -> 1 column
            // Same logic for both search results and paginated results
            const numColumns = pageSize === 50 ? 5 
              : pageSize === 40 ? 4 
              : pageSize === 20 ? 2 
              : pageSize === 10 ? 1 
              : 3; // Default to 3 columns (for 30 per page)
            
            return Array.from({ length: numColumns }).map((_, columnIndex) => (
              <div key={columnIndex} className="ingredient-column">
                <ul className="ingredient-list">
                  {itemsToShow
                    .filter((_, index) => index % numColumns === columnIndex)
                    .map((ingredient) => {
                    const translatedName = translateIngredient(ingredient.name, currentLanguage);
                    const nameLength = translatedName.length;

                    // Calculate font size to fit full name in single line within card width (~98px)
                    // More aggressive scaling - each character needs space proportional to font size
                    let fontSize;
                    if (nameLength > 25) {
                      fontSize = '0.45rem';
                    } else if (nameLength > 20) {
                      fontSize = '0.5rem';
                    } else if (nameLength > 16) {
                      fontSize = '0.55rem';
                    } else if (nameLength > 13) {
                      fontSize = '0.6rem'; // Dolmalık Biber (14 chars) will use this
                    } else if (nameLength > 10) {
                      fontSize = '0.65rem';
                    } else if (nameLength > 7) {
                      fontSize = '0.7rem';
                    } else {
                      fontSize = '0.75rem';
                    }
                    
                    return (
                      <li
                        key={ingredient.id}
                        className="ingredient-item"
                        onClick={() => navigate(`/ingredients/${ingredient.id}`)}
                      >
                        <div className="ingredient-item-content">
                          <span className="ingredient-name" style={{ fontSize, maxWidth: '100%' }}>{translatedName}</span>
                        
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
                                  {ingredient.prices.A101} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.SOK && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/sok.png" alt="ŞOK" className="price-logo" />
                                  {ingredient.prices.SOK} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.BIM && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/bim.png" alt="BIM" className="price-logo" />
                                  {ingredient.prices.BIM} {ingredient.prices.currency || currency}
                                </span>
                              )}
                              {ingredient.prices.MIGROS && (
                                <span className="price-item">
                                  <img src="/src/assets/market_logos/migros.png" alt="MIGROS" className="price-logo" />
                                  {ingredient.prices.MIGROS} {ingredient.prices.currency || currency}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            ));
          })()}
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
