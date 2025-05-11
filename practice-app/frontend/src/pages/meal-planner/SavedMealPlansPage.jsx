// src/pages/meal-planner/SavedMealPlansPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSavedMealPlans, deleteMealPlanById } from '../../services/mealPlanService';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/SavedMealPlansPage.css';

const SavedMealPlansPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      try {
        const data = await getSavedMealPlans();
        setSavedPlans(data);
      } catch (err) {
        toast.error('Failed to load saved meal plans');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, [toast]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) return;
    try {
      await deleteMealPlanById(id);
      setSavedPlans(prev => prev.filter((_, idx) => idx !== id));
      toast.success('Meal plan deleted');
    } catch {
      toast.error('Failed to delete meal plan');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const sortPlans = (plans) => {
    const sorted = [...plans].sort((a, b) => {
      let comp = 0;
      switch (sortOption) {
        case 'date':
          comp = new Date(a.date) - new Date(b.date); break;
        case 'budget':
          comp = a.totalCost - b.totalCost; break;
        case 'name':
          comp = (a.meals?.breakfast?.title || '').localeCompare(b.meals?.breakfast?.title || ''); break;
        default:
          break;
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return sorted;
  };

  const filteredPlans = sortPlans(
    savedPlans.filter(p => {
      const titles = Object.values(p.meals || {}).map(m => m?.title?.toLowerCase() || '');
      return searchTerm === '' || titles.some(t => t.includes(searchTerm.toLowerCase()));
    })
  );

  const toggleSort = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  useEffect(() => {
      document.title = "Saved Meal Plans";
    }, []);
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Saved Meal Plans</h1>
          <p className="text-gray-600">Manage your saved meal plans</p>
        </div>
        <Button onClick={() => navigate('/meal-planner')}>+ Create New Plan</Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search meal plans..."
              className="w-full px-3 py-2 border rounded-md"
            />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="date">Sort by Date</option>
              <option value="budget">Sort by Cost</option>
              <option value="name">Sort by Name</option>
            </select>
            <Button variant="secondary" onClick={toggleSort}>{sortDirection === 'asc' ? '⬆️' : '⬇️'}</Button>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading...</p>
      ) : filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan, index) => (
            <Card
            key={index}
            className="plan-card hover:shadow-md transition-shadow bg-white rounded-xl"
          >
              <Card.Body>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="font-semibold text-lg">{plan.name || `Meal Plan (${formatDate(plan.date)})`}</h2>
                    <p className="text-sm text-gray-500">{formatDate(plan.date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => handleDelete(index)}>🗑️</Button>
                    <Button variant="ghost" size="xs" onClick={() => navigate(`/meal-planner?load=${index}`)}>✏️</Button>
                  </div>
                </div>
                <div className="mb-3">
                  {Object.entries(plan.meals || {}).map(([type, meal]) => meal && (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>{meal.title}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span>₺{plan.totalCost}</span>
                  </div>
                  <div className="mt-1 text-gray-600">
                    {plan.totalNutrition?.calories || 0} cal • {plan.totalNutrition?.protein || 0}g protein
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => navigate(`/shopping-list?plan=${index}`)}>
                  View Shopping List
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <Card><Card.Body className="text-center py-12 text-gray-500">No meal plans found.</Card.Body></Card>
      )}
    </div>
  );
};

export default SavedMealPlansPage;
