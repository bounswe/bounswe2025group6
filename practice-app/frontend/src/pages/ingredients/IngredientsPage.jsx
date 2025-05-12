import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import '../../styles/IngredientList.css';
import '../../styles/IngredientsPage.css';

// Main component for displaying and managing ingredients with pagination and search
const IngredientsPage = () => {
  // State declarations for managing ingredients, pagination, and UI state
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const navigate = useNavigate();

  // Set page title on component mount
  useEffect(() => {
    document.title = "Ingredients";
  }, []);

  // Fetch all ingredients from API and handle pagination
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchAllIngredients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(
          `http://localhost:8000/ingredients/?page=1&page_size=100`, 
          { signal: controller.signal }
        );
    
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
    
        if (isMounted) {
          setAllIngredients(data.results);
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          setIngredients(data.results.slice(startIndex, endIndex));
          setHasNextPage(data.results.length > endIndex);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        if (isMounted) {
          setError(err.message);
          console.error('Error fetching ingredients:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the fetch to prevent multiple rapid calls
    const debouncedFetch = debounce(() => {
      if (ingredients.length === 0) {
        fetchAllIngredients();
      }
    }, 300);

    debouncedFetch();

    return () => {
      isMounted = false;
      controller.abort();
      debouncedFetch.cancel();
    };
  }, [pageSize, selectedColumn, page]);

  // Handle search functionality
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      if (searchQuery.trim() === '') {
        setFilteredIngredients([]);
      } else {
        const filtered = allIngredients.filter((ingredient) =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredIngredients(filtered);
      }
    }, 300);

    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchQuery, allIngredients]);

  // Update displayed ingredients when page or size changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setIngredients(allIngredients.slice(startIndex, endIndex));
      setHasNextPage(allIngredients.length > endIndex);
    }
  }, [page, searchQuery, allIngredients, pageSize]);

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
    setSelectedColumn(0);
    setPage(1);
    
    setTimeout(() => setIsChanging(false), 100);
  };

  // Loading and error states
  if (loading && ingredients.length === 0) {
    return (
      <div className="ingredients-page">
        <div className="ingredients-loading">
          <div className="loading-circle"></div>
          <div className="loading-text">Loading ingredients...</div>
        </div>
      </div>
    );
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
                      {ingredient.name}
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
          <div className="pagination-controls">
            <button 
              className="pagination-button"
              onClick={handlePreviousPage} 
              disabled={page === 1}
            >
              Previous
            </button>
            <span>{page}</span>
            <button 
              className="pagination-button"
              onClick={handleNextPage} 
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
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
        </div>
      )}
    </div>
  );
};

export default IngredientsPage;