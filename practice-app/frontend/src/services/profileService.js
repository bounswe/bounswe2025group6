// src/services/profileService.js

// Local storage keys
const PROFILE_KEY = 'mealPlanner_userProfile';
const PREFERENCES_KEY = 'mealPlanner_userPreferences';

/**
 * Get the current user's profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get user data from localStorage
        const profileData = localStorage.getItem(PROFILE_KEY);
        const preferencesData = localStorage.getItem(PREFERENCES_KEY);
        
        // Parse data or use defaults
        const profile = profileData ? JSON.parse(profileData) : {
          username: 'User',
          email: 'user@example.com',
          userType: 'personal',
          joinedDate: new Date().toISOString()
        };
        
        const preferences = preferencesData ? JSON.parse(preferencesData) : {
          dietaryPreferences: [],
          allergens: [],
          dislikedFoods: '',
          monthlyBudget: '',
          householdSize: 1,
          publicProfile: false
        };
        
        // Combine profile and preferences
        resolve({
          ...profile,
          ...preferences
        });
      }, 500);
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update the user's profile information
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get current data
        const currentData = localStorage.getItem(PROFILE_KEY);
        const current = currentData ? JSON.parse(currentData) : {
          username: 'User',
          email: 'user@example.com',
          userType: 'personal',
          joinedDate: new Date().toISOString()
        };
        
        // Update with new data
        const updatedProfile = {
          ...current,
          ...profileData,
          updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
        
        resolve(updatedProfile);
      }, 500);
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update the user's preferences
 * @param {Object} preferencesData - Updated preferences data
 * @returns {Promise<Object>} Updated preferences
 */
export const updateUserPreferences = async (preferencesData) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get current data
        const currentData = localStorage.getItem(PREFERENCES_KEY);
        const current = currentData ? JSON.parse(currentData) : {
          dietaryPreferences: [],
          allergens: [],
          dislikedFoods: '',
          monthlyBudget: '',
          householdSize: 1,
          publicProfile: false
        };
        
        // Update with new data
        const updatedPreferences = {
          ...current,
          ...preferencesData,
          updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));
        
        resolve(updatedPreferences);
      }, 500);
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Upload a profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of the uploaded image
 */
export const uploadProfilePicture = async (file) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would upload the file and return a URL
        // For demo purposes, we just return a placeholder URL
        const imageUrl = 'https://via.placeholder.com/150';
        
        // Update profile with the image URL
        updateUserProfile({ profilePicture: imageUrl });
        
        resolve(imageUrl);
      }, 1000);
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // This is a simplified check - in a real app, this would validate against stored password
        if (currentPassword === 'oldpassword') {
          // Password change successful
          resolve(true);
        } else {
          // Current password is incorrect
          reject(new Error('Current password is incorrect'));
        }
      }, 800);
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {string} password - Password confirmation
 * @returns {Promise<boolean>} Success status
 */
export const deleteAccount = async (password) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In a real app, this would verify the password
        if (password) {
          // Clear user data
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(PREFERENCES_KEY);
          localStorage.removeItem('mealPlanner_token');
          localStorage.removeItem('mealPlanner_user');
          
          resolve(true);
        } else {
          reject(new Error('Password is required to delete account'));
        }
      }, 800);
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

/**
 * Get user activity statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async () => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock statistics data
        const stats = {
          recipesCreated: Math.floor(Math.random() * 10),
          mealPlansCreated: Math.floor(Math.random() * 20),
          recipesSaved: Math.floor(Math.random() * 30),
          totalBudgetSaved: Math.floor(Math.random() * 500),
          lastActive: new Date().toISOString()
        };
        
        resolve(stats);
      }, 500);
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Initialize profile data if it doesn't exist
export const initializeProfile = () => {
  const profile = localStorage.getItem(PROFILE_KEY);
  if (!profile) {
    // Get user from auth if available
    const user = localStorage.getItem('mealPlanner_user');
    
    if (user) {
      const userData = JSON.parse(user);
      const initialProfile = {
        username: userData.username || 'User',
        email: userData.email || 'user@example.com',
        userType: userData.userType || 'personal',
        joinedDate: new Date().toISOString()
      };
      
      localStorage.setItem(PROFILE_KEY, JSON.stringify(initialProfile));
    }
  }
};

/**
 * Upload a profile image
 * @param {File} imageFile The image file to upload
 * @returns {Promise<string>} URL of the uploaded image
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    // In a real application, you would upload to a server/cloud storage
    // For this mock implementation, we'll use localStorage and base64
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Convert file to base64 string for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          // In a real app, this would be the URL returned from the server
          const imageUrl = reader.result;
          
          // Get current user
          const userKey = 'mealPlanner_user';
          const userJson = localStorage.getItem(userKey);
          if (userJson) {
            const currentUser = JSON.parse(userJson);
            
            // Update user's profile picture in "database"
            const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
            const userIndex = users.findIndex(user => user.id === currentUser.id);
            
            if (userIndex !== -1) {
              users[userIndex].profilePicture = imageUrl;
              localStorage.setItem('mealPlanner_users', JSON.stringify(users));
              
              // Update current user in localStorage
              currentUser.profilePicture = imageUrl;
              localStorage.setItem(userKey, JSON.stringify(currentUser));
            }
          }
          
          resolve(imageUrl);
        };
        reader.readAsDataURL(imageFile);
      }, 1000); // Simulate network delay
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
};
/*
export const uploadProfileImage = async (imageFile) => {
  try {
    // First get a pre-signed URL for direct upload
    const { data: uploadData } = await axios.post(`${API_URL}/users/profile-image/upload-url`, {
      fileName: imageFile.name,
      fileType: imageFile.type
    });
    
    // Upload directly to cloud storage using the pre-signed URL
    await axios.put(uploadData.uploadUrl, imageFile, {
      headers: {
        'Content-Type': imageFile.type
      }
    });
    
    // Return the URL where the image can be accessed
    return uploadData.imageUrl;
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
};
*/

// Call initialization
initializeProfile();