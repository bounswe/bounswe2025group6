import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/IngredientList.css';
import '../../styles/IngredientsPage.css';

const IngredientsPage = () => {
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Ingredients";
  }, []);

  useEffect(() => {
    const fetchAllIngredients = async () => {
      try {
        setLoading(true);
        let allData = [];
        let nextUrl = 'http://localhost:8000/ingredients/';

        while (nextUrl) {
          const res = await fetch(nextUrl);
          if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
          const data = await res.json();
          allData = [...allData, ...data.results];
          nextUrl = data.next;
        }

        setAllIngredients(allData);
        setIngredients(allData.slice(0, 10));
        setHasNextPage(allData.length > 10); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllIngredients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIngredients([]); 
    } else {
    const filtered = allIngredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
      setFilteredIngredients(filtered);
    }
  }, [searchQuery, allIngredients]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      const startIndex = (page - 1) * 10;
      const endIndex = startIndex + 10;
      setIngredients(allIngredients.slice(startIndex, endIndex));
      setHasNextPage(allIngredients.length > endIndex);
    }
  }, [page, searchQuery, allIngredients]);

  const handleNextPage = () => {
    if (hasNextPage) setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage((prevPage) => prevPage - 1);
  };

  if (loading) return <div>Loading ingredients…</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="ingredients-page">
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

      <ul className="ingredient-list">
        {(searchQuery.trim() ? filteredIngredients : ingredients).map((ingredient) => (
          <li
            key={ingredient.id}
            className="ingredient-item"
            onClick={() => navigate(`/ingredients/${ingredient.id}`)}
            style={{ cursor: 'pointer' }}
          >
            {ingredient.name}
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      {!searchQuery.trim() && (
        <div className="pagination-controls">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            Previous
          </button>
          <span> {page} </span>
          <button onClick={handleNextPage} disabled={!hasNextPage}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default IngredientsPage;