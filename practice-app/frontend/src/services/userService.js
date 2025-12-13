// src/services/userService.js
import axios from "axios";
import { userCache, recipeCache, postCache, commentCache } from "../utils/cache";
import { requestDeduplicationInterceptor, responseDeduplicationInterceptor, errorDeduplicationInterceptor } from "../utils/requestDeduplication";

// Create an axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map();

function generateRequestKey(config) {
  const { method, url, params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

// Add request deduplication interceptor
api.interceptors.request.use(
  (config) => {
    const requestKey = generateRequestKey(config);
    
    // Check if there's already a pending request with the same key
    if (pendingRequests.has(requestKey)) {
      // Cancel this request and return the existing promise
      config.cancelToken = new axios.CancelToken(cancel => {
        cancel('Duplicate request cancelled');
      });
      return config;
    }
    
    // Add auth token
    const token = localStorage.getItem("fithub_access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("No auth token found for request:", config.url);
    }
    
    // Store request key (will be cleaned up in response/error interceptors)
    config._requestKey = requestKey;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to clean up pending requests
api.interceptors.response.use(
  (response) => {
    if (response.config._requestKey) {
      pendingRequests.delete(response.config._requestKey);
    }
    return response;
  },
  (error) => {
    // Clean up on error (unless it's a cancellation)
    if (error.config && error.config._requestKey && !axios.isCancel(error)) {
      pendingRequests.delete(error.config._requestKey);
    }
    return Promise.reject(error);
  }
);

export const getUsername = async (userId) => {
  if (!userId || userId === 0) return "Unknown";

  try {
    const response = await api.get(`/api/users/${userId}/`);
    console.log("Fetched user:", response.data);
    return response.data.username || "Unknown";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown";
  }
};

const userService = {
  // Get user profile by ID
  getUserById: async (userId) => {
    try {
      // Check cache first
      if (userCache.has('user', userId)) {
        return userCache.get('user', userId);
      }

      const response = await api.get(`/api/users/${userId}/`);
      const userData = response.data;
      
      // Cache the result
      userCache.set('user', userData, 5 * 60 * 1000, userId); // Cache for 5 minutes
      return userData;
    } catch (error) {
      // Ignore cancellation errors (duplicate requests)
      if (axios.isCancel(error)) {
        throw error;
      }
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  // Update user profile
  updateUserById: async (userId, userData) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user details:", error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async (userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await api.patch(`/api/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  // Get user's settings
  getUserSettings: async () => {
    try {
      const response = await api.get("/api/users/settings/");
      return response.data;
    } catch (error) {
      console.error("Error fetching user settings:", error);
      throw error;
    }
  },

  // Update user's settings
  updateUserSettings: async (settingsData) => {
    try {
      const response = await api.patch("/api/users/settings/", settingsData);
      return response.data;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  },

  getUsername,

  // Get user recipe count and badge
  getUserRecipeCount: async (userId) => {
    try {
      const response = await api.get(`/recipes/user/${userId}/recipe-count/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user recipe count:", error);
      // Return default values if error
      return { user_id: userId, recipe_count: 0, badge: null };
    }
  },

  // Upload profile photo using FormData for Cloudinary upload
  uploadProfilePhoto: async (userId, imageFile) => {
    try {
      // Create FormData to send file as multipart/form-data
      const formData = new FormData();
      formData.append('profilePhoto', imageFile);
      
      // Use patch with FormData (axios will set Content-Type to multipart/form-data)
      const response = await api.patch(`/api/users/${userId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      // Provide better error message
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.profilePhoto?.[0] || 
                        error.response?.data?.error ||
                        'Failed to upload profile photo. Please try again.';
        error.message = errorMsg;
      }
      throw error;
    }
  },

  // Delete profile photo (set to null)
  // Backend now supports both JSON and FormData, so we can use JSON for deletion
  deleteProfilePhoto: async (userId) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, {
        profilePhoto: null
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      throw error;
    }
  },

  // Update username
  updateUsername: async (userId, newUsername) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, {
        username: newUsername
      });
      return response.data;
    } catch (error) {
      console.error("Error updating username:", error);
      throw error;
    }
  },

  // Check if username is available
  checkUsernameAvailability: async (username) => {
    try {
      // Get all users and check if username exists
      const response = await api.get(`/api/users/`);
      const users = response.data.results || [];
      const usernameExists = users.some(user => user.username.toLowerCase() === username.toLowerCase());
      return !usernameExists;
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  },

  // Get user's recipes by user ID
  // Backend returns recipe_ids, so we fetch the IDs and then get full recipe objects
  getUserRecipes: async (userId) => {
    try {
      // Check cache first - use proper cache key format
      if (recipeCache.has('user-recipes', userId)) {
        return recipeCache.get('user-recipes', userId);
      }

      // First get recipe IDs
      const idsResponse = await api.get(`/api/users/${userId}/recipe-ids/`);
      const recipeIds = idsResponse.data.recipe_ids || [];
      
      if (recipeIds.length === 0) {
        recipeCache.set('user-recipes', [], 2 * 60 * 1000, userId); // Cache empty result for 2 minutes
        return [];
      }
      
      // Fetch all recipes in parallel (with individual caching)
      const recipeService = (await import('./recipeService')).default;
      const recipePromises = recipeIds.map(async id => {
        // Check individual recipe cache
        if (recipeCache.has('recipe', id)) {
          return recipeCache.get('recipe', id);
        }
        
        try {
          const recipe = await recipeService.getRecipeById(id);
          recipeCache.set('recipe', recipe, 10 * 60 * 1000, id); // Cache for 10 minutes
          return recipe;
        } catch (err) {
          console.error(`Error loading recipe ${id}:`, err);
          return null;
        }
      });
      
      const recipes = await Promise.all(recipePromises);
      const validRecipes = recipes.filter(recipe => recipe !== null);
      
      // Cache the result - use proper cache key format
      recipeCache.set('user-recipes', validRecipes, 5 * 60 * 1000, userId); // Cache for 5 minutes
      return validRecipes;
    } catch (error) {
      console.error("Error fetching user recipes:", error);
      // Return empty array if endpoint doesn't exist or user has no recipes
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get user's posts by user ID
  // Backend returns post_ids, so we fetch the IDs and then get full post objects
  getUserPosts: async (userId) => {
    try {
      // Check cache first - use proper cache key format
      if (postCache.has('user-posts', userId)) {
        return postCache.get('user-posts', userId);
      }

      // First get post IDs
      const idsResponse = await api.get(`/api/users/${userId}/post-ids/`);
      const postIds = idsResponse.data.post_ids || [];
      
      if (postIds.length === 0) {
        postCache.set('user-posts', [], 2 * 60 * 1000, userId); // Cache empty result for 2 minutes
        return [];
      }
      
      // Fetch all posts in parallel (with individual caching)
      const forumService = (await import('./forumService')).default;
      const postPromises = postIds.map(async id => {
        // Check individual post cache
        if (postCache.has('post', id)) {
          return postCache.get('post', id);
        }
        
        try {
          const post = await forumService.getPostById(id);
          postCache.set('post', post, 2 * 60 * 1000, id); // Cache for 2 minutes
          return post;
        } catch (err) {
          console.error(`Error loading post ${id}:`, err);
          return null;
        }
      });
      
      const posts = await Promise.all(postPromises);
      const validPosts = posts.filter(post => post !== null);
      
      // Cache the result - use proper cache key format
      postCache.set('user-posts', validPosts, 2 * 60 * 1000, userId); // Cache for 2 minutes
      return validPosts;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      // Return empty array if endpoint doesn't exist or user has no posts
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get user's comments by user ID
  // Backend returns comment_ids, but we need full comment objects with post info
  // Since we can't get comments directly by ID, we'll use the old approach for now
  // TODO: Backend should provide an endpoint that returns full comment objects with post info
  getUserComments: async (userId) => {
    try {
      // For comments, we need to get all posts and their comments
      // This is not ideal but necessary until backend provides a better endpoint
      const forumService = (await import('./forumService')).default;
      const allComments = [];
      
      // Get all posts (paginated)
      let page = 1;
      const pageSize = 100;
      let allPosts = [];
      
      while (true) {
        try {
          const postsResponse = await forumService.getPosts(page, pageSize);
          const posts = postsResponse.results || [];
          
          if (!posts || posts.length === 0) {
            break;
          }
          
          allPosts.push(...posts);
          
          if (posts.length < pageSize) {
            break;
          }
          
          page++;
          if (page > 100) break; // Safety limit
        } catch (error) {
          if (error.response?.status === 404) {
            break;
          }
          throw error;
        }
      }
      
      // Get comments for each post and filter by user
      const commentPromises = allPosts.map(async (post) => {
        try {
          let commentPage = 1;
          const commentPageSize = 100;
          const postComments = [];
          
          while (true) {
            try {
              const commentsResponse = await forumService.getCommentsByPostId(post.id, commentPage, commentPageSize);
              const comments = commentsResponse.results || [];
              
              if (!comments || comments.length === 0) {
                break;
              }
              
              // Filter comments by user
              const userComments = comments.filter(comment => 
                Number(comment.author) === Number(userId)
              );
              
              const mappedComments = userComments.map(c => ({
                ...c,
                postId: post.id,
                postTitle: post.title
              }));
              
              postComments.push(...mappedComments);
              
              if (comments.length < commentPageSize) {
                break;
              }
              
              commentPage++;
              if (commentPage > 100) break;
            } catch (error) {
              if (error.response?.status === 404) {
                break;
              }
              throw error;
            }
          }
          
          return postComments;
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
          return [];
        }
      });
      
      const commentsArrays = await Promise.all(commentPromises);
      allComments.push(...commentsArrays.flat());
      
      return allComments;
    } catch (error) {
      console.error("Error fetching user comments:", error);
      // Return empty array if endpoint doesn't exist or user has no comments
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
};

export default userService;
