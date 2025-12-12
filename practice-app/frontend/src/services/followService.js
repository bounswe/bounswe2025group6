// src/services/followService.js
import axios from 'axios';

// Create an axios instance with auth
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Toggle follow status for a user
 * @param {number} userId - ID of the user to follow/unfollow
 * @returns {Promise} Response with follow status and follower count
 */
export const toggleFollow = async (userId) => {
  try {
    const response = await api.post('/api/users/follow/', {
      user_id: userId
    });
    return response.data; // { status: 'followed/unfollowed', target_user_id, current_followers_count }
  } catch (error) {
    console.error('Error toggling follow:', error);
    throw error;
  }
};

/**
 * Get user's followers list
 * @param {number|string} userId - User ID (required)
 * @returns {Promise} Array of follower users (IDs or user objects)
 * 
 * Note: Backend serializer doesn't expose 'followers' field, so we need to
 * find followers by checking all users' followedUsers lists
 */
export const getFollowers = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // First check if backend returns followers field (in case it's added later)
    const userResponse = await api.get(`/api/users/${userId}/`);
    if (userResponse.data.followers && Array.isArray(userResponse.data.followers)) {
      // Backend returns followers field
      return userResponse.data.followers.map(follower => {
      if (typeof follower === 'number' || typeof follower === 'string') {
        return { id: Number(follower) };
      }
      return follower;
    });
    }
    
    // Backend doesn't return followers, so we need to find them manually
    // Get all users and check which ones have this user in their followedUsers list
    const followers = [];
    let page = 1;
    let hasMore = true;
    const targetUserId = Number(userId);
    
    while (hasMore) {
      try {
        const response = await api.get(`/api/users/?page=${page}&page_size=100`);
        const users = response.data.results || [];
        
        // Check each user's followedUsers list
        for (const user of users) {
          if (user.followedUsers && Array.isArray(user.followedUsers)) {
            const isFollowing = user.followedUsers.some(followedId => {
              const id = typeof followedId === 'object' ? followedId.id : followedId;
              return Number(id) === targetUserId;
            });
            
            if (isFollowing) {
              // Get typeOfCook from user data already fetched
              followers.push({
                id: user.id,
                username: user.username,
                profilePhoto: user.profilePhoto,
                typeOfCook: user.typeOfCook || null,
                usertype: user.usertype || null
              });
            }
          }
        }
        
        // Check if there are more pages
        hasMore = response.data.next !== null && users.length > 0;
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 100) break;
      } catch (error) {
        console.error(`Error fetching users page ${page}:`, error);
        hasMore = false;
      }
    }
    
    return followers;
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }
};

/**
 * Get user's following list
 * @param {number|string} userId - User ID (required)
 * @returns {Promise} Array of followed users with full details (id, username, profilePhoto, typeOfCook, usertype)
 */
export const getFollowing = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const response = await api.get(`/api/users/${userId}/`);
    // Backend returns followedUsers as array of IDs
    const followingIds = response.data.followedUsers || [];
    
    if (followingIds.length === 0) {
      return [];
    }
    
    // Fetch full user details for each followed user
    // Do this in parallel for better performance
    const followingPromises = followingIds.map(async (userIdOrId) => {
      try {
        const id = typeof userIdOrId === 'object' ? userIdOrId.id : userIdOrId;
        const userResponse = await api.get(`/api/users/${id}/`);
        
        return {
          id: userResponse.data.id,
          username: userResponse.data.username,
          profilePhoto: userResponse.data.profilePhoto,
          typeOfCook: userResponse.data.typeOfCook || null,
          usertype: userResponse.data.usertype || null
        };
      } catch (error) {
        console.error(`Error fetching user ${userIdOrId}:`, error);
        // Return minimal object if fetch fails
        const id = typeof userIdOrId === 'object' ? userIdOrId.id : userIdOrId;
        return { id: Number(id), username: `User ${id}`, typeOfCook: null, usertype: null };
      }
    });
    
    const following = await Promise.all(followingPromises);
    return following;
  } catch (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
};

/**
 * Check if current user is following a specific user
 * @param {number} targetUserId - Target user ID to check
 * @param {Array} followingList - Array of followed user IDs
 * @returns {boolean} True if following
 */
export const isFollowing = (targetUserId, followingList) => {
  if (!followingList || !Array.isArray(followingList)) return false;
  return followingList.some(user => user.id === targetUserId || user === targetUserId);
};

