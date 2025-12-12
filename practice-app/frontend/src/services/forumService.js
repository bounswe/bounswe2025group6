// src/services/forumService.js
import axios from 'axios';
import { postCache, commentCache } from '../utils/cache';

// Create an axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request deduplication
const pendingRequests = new Map();

function generateRequestKey(config) {
  const { method, url, params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const requestKey = generateRequestKey(config);
    
    // Check if there's already a pending request with the same key
    if (pendingRequests.has(requestKey)) {
      // Cancel this request
      config.cancelToken = new axios.CancelToken(cancel => {
        cancel('Duplicate request cancelled');
      });
      return config;
    }
    
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("Adding auth token to request:", config.url);
    }
    else {
      console.warn("No auth token found for request:", config.url);
    }
    
    // Store request key
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
    if (error.config && error.config._requestKey && !axios.isCancel(error)) {
      pendingRequests.delete(error.config._requestKey);
    }
    return Promise.reject(error);
  }
);

const forumService = {
  // Posts
  getPosts: async (page = 1, pageSize = 10) => {
    try {
      // Check cache first - use proper cache key format
      if (postCache.has('posts', page, pageSize)) {
        return postCache.get('posts', page, pageSize);
      }

      console.log(`Fetching posts from /forum/posts/?page=${page}&page_size=${pageSize}`);
      const response = await api.get('/forum/posts/', {
        params: { page, page_size: pageSize }
      });
      console.log("Response data:", response.data);
      
      const postsData = response.data;
      
      // Cache individual posts
      if (postsData.results && Array.isArray(postsData.results)) {
        postsData.results.forEach(post => {
          postCache.set('post', post, 2 * 60 * 1000, post.id);
        });
      }
      
      // Cache the paginated response - use proper cache key format
      postCache.set('posts', postsData, 1 * 60 * 1000, page, pageSize); // Cache for 1 minute
      return postsData;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  getPostById: async (id) => {
    try {
      // Check cache first
      if (postCache.has('post', id)) {
        return postCache.get('post', id);
      }

      console.log(`Fetching post with ID: ${id}`);
      const response = await api.get(`/forum/posts/${id}/`);
      const postData = response.data;
      
      // Cache the result
      postCache.set('post', postData, 2 * 60 * 1000, id); // Cache for 2 minutes
      return postData;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  createPost: async (postData) => {
    try {
      console.log('Creating post with data:', postData);
      const response = await api.post('/forum/posts/', postData);
      
      // Clear post list cache when new post is created
      postCache.clear('posts:');
      
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  updatePost: async (id, postData) => {
    try {
      console.log(`Updating post ${id} with data:`, postData);
      const response = await api.put(`/forum/posts/${id}/`, postData);
      
      // Clear cache for this post and post lists
      postCache.delete('post', id);
      postCache.clear('posts:');
      postCache.clear('user-posts:');
      
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  deletePost: async (id) => {
    try {
      console.log(`Deleting post with ID: ${id}`);
      const response = await api.delete(`/forum/posts/${id}/`);
      
      // Clear cache for this post and post lists
      postCache.delete('post', id);
      postCache.clear('posts:');
      postCache.clear('user-posts:');
      commentCache.clear(`comments:post:${id}:`);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Post Votes
  votePost: async (postId, voteType) => {
    try {
      console.log(`Voting ${voteType} on post ${postId}`);
      const response = await api.post(`/forum/post/${postId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
  },

  deleteVotePost: async (postId) => {
    try {
      console.log(`Removing vote from post ${postId}`);
      const response = await api.delete(`/forum/post/${postId}/vote/`);
      return response.data;
    } catch (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  },

  // Comments
  getCommentsByPostId: async (postId, page = 1, pageSize = 10) => {
    try {
      // Check cache first
      const cacheKey = `comments:post:${postId}:page:${page}:size:${pageSize}`;
      if (commentCache.has(cacheKey)) {
        return commentCache.get(cacheKey);
      }

      console.log(`Fetching comments for post ${postId}`);
      const response = await api.get(`/forum/posts/${postId}/comments/`, {
        params: { page, page_size: pageSize }
      });
      
      const commentsData = response.data;
      
      // Cache the result
      commentCache.set(cacheKey, commentsData, 2 * 60 * 1000); // Cache for 2 minutes
      return commentsData;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  createComment: async (postId, content) => {
    try {
      console.log(`Creating comment on post ${postId} with content: ${content}`);
      const response = await api.post(`/forum/posts/${postId}/comments/`, {
        content
      });
      
      // Clear comment cache for this post
      commentCache.clear(`comments:post:${postId}:`);
      
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      console.log(`Deleting comment ${commentId} from post ${postId}`);
      const response = await api.delete(`/forum/posts/${postId}/comments/${commentId}/`);
      
      // Clear comment cache for this post
      commentCache.clear(`comments:post:${postId}:`);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Comment Votes
  voteComment: async (commentId, voteType) => {
    try {
      console.log(`Voting ${voteType} on comment ${commentId}`);
      const response = await api.post(`/forum/comment/${commentId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  },

  deleteVoteComment: async (commentId) => {
    try {
      console.log(`Removing vote from comment ${commentId}`);
      const response = await api.delete(`/forum/comment/${commentId}/vote/`);
      return response.data;
    } catch (error) {
      console.error('Error removing comment vote:', error);
      throw error;
    }
  },

  checkPostVoteStatus: async (postId) => {
    try {
      console.log(`Checking vote status for post ${postId}`);
      const response = await api.get(`/forum/post/${postId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      console.log("Vote status response:", response.data);
      
      // Make sure vote_type is correctly extracted and validated
      const voteType = response.data.vote_type;
      console.log("Vote type from response:", voteType);
      
      // Only return hasVoted true if we have a valid vote type
      if (voteType === 'up' || voteType === 'down') {
        return {
          hasVoted: true,
          voteType: voteType
        };
      } else {
        // If vote_type is not 'up' or 'down' but we got a 200 response,
        // something is inconsistent - return not voted to be safe
        console.log("Vote type is invalid, returning hasVoted: false");
        return {
          hasVoted: false,
          voteType: null
        };
      }
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && (error.response.status === 204 || error.response.status === 404)) {
        console.log(`No vote found for post ${postId}`);
        return {
          hasVoted: false,
          voteType: null
        };
      }
      
      // Log the error response for debugging
      if (error.response) {
        console.error('Error response:', error.response.status);
      }
      
      // For other errors (401, etc.), throw the error
      console.error('Error checking post vote status:', error);
      throw error;
    }
  },

  // Comment vote status - NEW FUNCTION
  checkCommentVoteStatus: async (commentId) => {
    try {
      console.log(`Checking vote status for comment ${commentId}`);
      const response = await api.get(`/forum/comment/${commentId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      return {
        hasVoted: true,
        voteType: response.data.vote_type
      };
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && error.response.status === 204) {
        console.log(`No vote found for comment ${commentId}`);
        return {
          hasVoted: false,
          voteType: null
        };
      }
      // For other errors (401, 404, etc.), throw the error
      console.error('Error checking comment vote status:', error);
      throw error;
    }
  }
};

export default forumService;
