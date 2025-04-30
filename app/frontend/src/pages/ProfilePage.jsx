// src/pages/ProfilePage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSavedMealPlans, deleteSavedMealPlan } from '../services/mealPlanService';
import '../styles/ProfilePage.css'; 

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    username: 'Ahmet',
    email: 'ahmet@example.com',
    userType: 'Personal User',
    joined: 'March 2025',
    dietaryPreferences: [],
    allergens: [],
    dislikedFoods: '',
    monthlyBudget: '',
    privacyPublic: true,
    profilePhoto: 'https://via.placeholder.com/150',
  });

  const [savedMealPlans, setSavedMealPlans] = useState(getSavedMealPlans());

  const dietaryOptions = [
    'High Protein', 'Low Carbohydrate', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto',
  ];

  const allergenOptions = [
    'Tree Nuts', 'Shellfish', 'Peanuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelectChange = (field, value) => {
    setProfileData((prev) => {
      const selected = prev[field];
      return selected.includes(value)
        ? { ...prev, [field]: selected.filter((item) => item !== value) }
        : { ...prev, [field]: [...selected, value] };
    });
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      deleteSavedMealPlan(index);
      setSavedMealPlans(getSavedMealPlans());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving profile data:', profileData);
    // TODO: Save to backend
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Profile Header */}
        <div className="profile-header">
          <img
            src={profileData.profilePhoto}
            alt="Profile"
            className="profile-photo"
          />
          <h1 className="profile-name">{profileData.username}</h1>
          <p className="profile-email">{profileData.email}</p>
          <p className="profile-meta">{profileData.userType} • Joined {profileData.joined}</p>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="profile-form">

          {/* Dietary Preferences */}
          <div className="profile-section">
            <h2 className="section-title">Dietary Preferences</h2>
            <div className="badge-group">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`badge-btn ${profileData.dietaryPreferences.includes(option) ? 'selected' : ''}`}
                  onClick={() => handleMultiSelectChange('dietaryPreferences', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div className="profile-section">
            <h2 className="section-title">Allergens</h2>
            <div className="badge-group">
              {allergenOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`badge-btn red ${profileData.allergens.includes(option) ? 'selected' : ''}`}
                  onClick={() => handleMultiSelectChange('allergens', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Disliked Foods */}
          <div className="profile-section">
            <label className="input-label">Disliked Foods</label>
            <input
              type="text"
              name="dislikedFoods"
              value={profileData.dislikedFoods}
              onChange={handleChange}
              placeholder="e.g., Avocado, Olives"
              className="profile-input"
            />
          </div>

          {/* Monthly Budget */}
          <div className="profile-section">
            <label className="input-label">Monthly Food Budget (₺)</label>
            <input
              type="number"
              name="monthlyBudget"
              value={profileData.monthlyBudget}
              onChange={handleChange}
              placeholder="e.g., 1500"
              className="profile-input"
            />
          </div>

          {/* Privacy Checkbox */}
          <div className="profile-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="privacyPublic"
                checked={profileData.privacyPublic}
                onChange={handleChange}
                className="checkbox-input"
              />
              Make my saved recipes visible to others
            </label>
          </div>

          {/* Save Changes Button */}
          <button type="submit" className="primary-btn full-width">
            Save Changes
          </button>
        </form>

        {/* Saved Meal Plans */}
        <div className="profile-mealplans">
          <h2 className="section-title">Saved Meal Plans</h2>

          {savedMealPlans.length > 0 ? (
            <ul className="mealplan-list">
              {savedMealPlans.map((plan, idx) => (
                <li key={idx} className="mealplan-card">
                  <div><strong>Meal Type:</strong> {plan.mealType}</div>
                  <div><strong>Selected Meal:</strong> {plan.selectedMeal}</div>
                  <div><strong>Budget:</strong> ₺{plan.budget}</div>
                  <div className="mealplan-date">{new Date(plan.date).toLocaleString()}</div>

                  <button
                    onClick={() => handleDelete(idx)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No saved meal plans yet.</p>
          )}
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-8 text-center">
          <Link to="/dashboard" className="secondary-btn">
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;