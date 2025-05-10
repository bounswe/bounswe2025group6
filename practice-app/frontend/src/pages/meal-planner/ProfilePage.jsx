// src/pages/meal-planner/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserPreferences, 
  uploadProfileImage 
} from '../../services/profileService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ImageUploader from '../../components/ui/ImageUploader';
import '../../styles/ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Form states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    userType: 'personal',
    dietaryPreferences: [],
    allergens: [],
    dislikedFoods: '',
    monthlyBudget: '',
    householdSize: 1,
    publicProfile: false
  });
  
  // Options for dietary preferences
  const dietaryOptions = [
    'High Protein', 
    'Low Carbohydrate', 
    'Vegetarian', 
    'Vegan', 
    'Gluten-Free',
    'Keto',
    'Paleo',
    'Dairy-Free'
  ];
  
  // Options for allergens
  const allergenOptions = [
    'Peanuts', 
    'Tree Nuts', 
    'Milk', 
    'Eggs', 
    'Wheat', 
    'Soy', 
    'Fish', 
    'Shellfish'
  ];

  const handleProfileImageUpload = async (file, base64Image) => {
    try {
      // First upload the image and get the URL
      const imageUrl = await uploadProfileImage(file);
      
      // Then update the profile with the new image URL
      await updateUserProfile({
        ...profileData,
        profilePicture: imageUrl
      });
      
      // Update the local state
      setProfileData(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      
      return true;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  };

  console.log(profileData)
  // Load profile data on component mount

  useEffect(() => {
    document.title = "Profile";
  }, []);
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        setProfileData({
          ...profile,
          // Set defaults if data is missing
          dietaryPreferences: profile.dietaryPreferences || [],
          allergens: profile.allergens || [],
          dislikedFoods: profile.dislikedFoods || '',
          monthlyBudget: profile.monthlyBudget || '',
          householdSize: profile.householdSize || 1,
          publicProfile: profile.publicProfile || false
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [toast]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Toggle dietary preference
  const toggleDietaryPreference = (preference) => {
    setProfileData(prev => {
      const dietaryPreferences = prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(item => item !== preference)
        : [...prev.dietaryPreferences, preference];
      return { ...prev, dietaryPreferences };
    });
  };
  
  // Toggle allergen
  const toggleAllergen = (allergen) => {
    setProfileData(prev => {
      const allergens = prev.allergens.includes(allergen)
        ? prev.allergens.filter(item => item !== allergen)
        : [...prev.allergens, allergen];
      return { ...prev, allergens };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Split the update into profile update and preferences update
      await updateUserProfile({
        username: profileData.username,
        email: profileData.email
      });
      
      await updateUserPreferences({
        dietaryPreferences: profileData.dietaryPreferences,
        allergens: profileData.allergens,
        dislikedFoods: profileData.dislikedFoods,
        monthlyBudget: profileData.monthlyBudget,
        householdSize: profileData.householdSize,
        publicProfile: profileData.publicProfile
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <Card className="mb-6">
        <Card.Body className="flex flex-col md:flex-row gap-6">
          {/* Profile picture and basic info */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="mb-4">
              <ImageUploader 
                currentImage={profileData.profilePicture} 
                onImageUpload={handleProfileImageUpload} 
              />
            </div>
            <h2 className="text-xl font-semibold">{profileData.username}</h2>
            <p className="text-gray-600 mb-2">{profileData.email}</p>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {profileData.userType === 'dietitian' ? 'Dietitian' : 'Personal User'}
            </span>
            <div className="mt-6 w-full">
              <Button 
                variant="danger" 
                onClick={handleLogout} 
                className="w-full"
              >
                Log Out
              </Button>
            </div>
          </div>
          
          {/* Profile form */}
          <div className="w-full md:w-2/3">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    readOnly
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </Card.Body>
      </Card>
      
      {/* Preferences */}
      <Card className="mb-6">
        <Card.Header>
          <h2 className="text-xl font-semibold">Preferences</h2>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            {/* Dietary Preferences */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleDietaryPreference(option)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      profileData.dietaryPreferences.includes(option)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Allergens */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergens
              </label>
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map(allergen => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      profileData.allergens.includes(allergen)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Disliked Foods */}
            <div className="mb-6">
              <label htmlFor="dislikedFoods" className="block text-sm font-medium text-gray-700 mb-1">
                Disliked Foods
              </label>
              <input
                type="text"
                id="dislikedFoods"
                name="dislikedFoods"
                value={profileData.dislikedFoods}
                onChange={handleChange}
                placeholder="e.g., Brussels sprouts, olives"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="mt-1 text-sm text-gray-500">Separate multiple items with commas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Monthly Budget */}
              <div>
                <label htmlFor="monthlyBudget" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Food Budget (₺)
                </label>
                <input
                  type="number"
                  id="monthlyBudget"
                  name="monthlyBudget"
                  value={profileData.monthlyBudget}
                  onChange={handleChange}
                  placeholder="e.g., 2000"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              {/* Household Size */}
              <div>
                <label htmlFor="householdSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Household Size
                </label>
                <select
                  id="householdSize"
                  name="householdSize"
                  value={profileData.householdSize}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Privacy Settings */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="publicProfile"
                  name="publicProfile"
                  checked={profileData.publicProfile}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="publicProfile" className="ml-2 block text-sm text-gray-700">
                  Make my profile and saved recipes visible to other users
                </label>
              </div>
            </div>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfilePage;