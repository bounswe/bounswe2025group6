// src/services/authService.js

// Local storage keys
const TOKEN_KEY = 'mealPlanner_token';
const USER_KEY = 'mealPlanner_user';

/**
 * Register a new user
 * @param {Object} userData User registration data
 * @returns {Promise<Object>} Registered user data
 */
export const registerUser = async (userData) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if email is already in use (simulated)
        const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
        const existingUser = users.find(user => user.email === userData.email);
        
        if (existingUser) {
          reject(new Error('Email is already in use'));
          return;
        }
        
        // Create new user
        const newUser = {
          id: Date.now(),
          ...userData,
          createdAt: new Date().toISOString()
        };
        
        // Remove password from returned user object
        const { password, ...userWithoutPassword } = newUser;
        
        // Save user to "database" (localStorage)
        users.push(newUser);
        localStorage.setItem('mealPlanner_users', JSON.stringify(users));
        
        // Generate token (in a real app, this would be a JWT)
        const token = `mock-token-${Date.now()}`;
        
        // Save auth data to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
        
        // Return user data
        resolve(userWithoutPassword);
      }, 800); // Simulate network delay
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
console.log(localStorage)
/**
 * Login a user
 * @param {Object} credentials Login credentials (email & password)
 * @returns {Promise<Object>} User data
 */
export const loginUser = async (credentials) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Get users from "database" (localStorage)
        const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
        
        // Find user by email
        const user = users.find(user => user.email === credentials.email);
        
        // Validate credentials
        if (!user || user.password !== credentials.password) {
          reject(new Error('Invalid email or password'));
          return;
        }
        
        // Remove password from returned user object
        const { password, ...userWithoutPassword } = user;
        
        // Generate token (in a real app, this would be a JWT)
        const token = `mock-token-${Date.now()}`;
        
        // Save auth data to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
        
        // Return user data
        resolve(userWithoutPassword);
      }, 800); // Simulate network delay
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Clear auth data from localStorage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        resolve();
      }, 300);
    });
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get user from localStorage
        const userJson = localStorage.getItem(USER_KEY);
        const user = userJson ? JSON.parse(userJson) : null;
        
        resolve(user);
      }, 300);
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Update user profile
 * @param {Object} userData Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (userData) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Get current user
        const userJson = localStorage.getItem(USER_KEY);
        if (!userJson) {
          reject(new Error('Not authenticated'));
          return;
        }
        
        const currentUser = JSON.parse(userJson);
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
        
        // Find user index
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }
        
        // Update user data
        const updatedUser = {
          ...users[userIndex],
          ...userData,
          updatedAt: new Date().toISOString()
        };

        if (userData.profilePicture) {
          updatedUser.profilePicture = userData.profilePicture;
        }
        
        // Remove password from returned user object
        const { password, ...userWithoutPassword } = updatedUser;
        
        // Update users array
        users[userIndex] = updatedUser;
        localStorage.setItem('mealPlanner_users', JSON.stringify(users));
        
        // Update current user in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
        
        // Return updated user data
        resolve(userWithoutPassword);
      }, 800);
    });
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Request password reset (simulation)
 * @param {string} email User email
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (email) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Get users from "database" (localStorage)
        const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
        
        // Check if email exists
        const user = users.find(user => user.email === email);
        if (!user) {
          reject(new Error('Email not found'));
          return;
        }
        
        // In a real app, this would send an email with a reset link
        console.log(`Password reset requested for email: ${email}`);
        
        resolve();
      }, 800);
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password (simulation)
 * @param {string} token Reset token
 * @param {string} newPassword New password
 * @returns {Promise<void>}
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Simulate API call (replace with actual API call in production)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In a real app, this would validate the token and update the password
        console.log(`Password reset with token: ${token}`);
        
        resolve();
      }, 800);
    });
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Initialize mock users if none exist
export const initializeMockUsers = () => {
  const users = JSON.parse(localStorage.getItem('mealPlanner_users') || '[]');
  
  if (users.length === 0) {
    const mockUsers = [
      {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        password: 'password123',
        userType: 'personal',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: 'dietitian',
        email: 'dietitian@example.com',
        password: 'password123',
        userType: 'dietitian',
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('mealPlanner_users', JSON.stringify(mockUsers));
    console.log('Initialized mock users');
  }
};

// Call to initialize mock users
initializeMockUsers();