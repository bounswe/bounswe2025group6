// src/services/qaService.js
import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("Adding auth token to request:", config.url);
    } else {
      console.warn("No auth token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const qaService = {
  // Questions
  getQuestions: async (page = 1, pageSize = 10) => {
    try {
      console.log(`Fetching questions from /qa/questions/?page=${page}&page_size=${pageSize}`);
      const response = await api.get('/qa/questions/', {
        params: { page, page_size: pageSize }
      });
      console.log("Response data:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  getQuestionById: async (id) => {
    try {
      console.log(`Fetching question with ID: ${id}`);
      const response = await api.get(`/qa/questions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  },

  createQuestion: async (questionData) => {
    try {
      console.log('Creating question with data:', questionData);
      const response = await api.post('/qa/questions/', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  updateQuestion: async (id, questionData) => {
    try {
      console.log(`Updating question ${id} with data:`, questionData);
      const response = await api.put(`/qa/questions/${id}/`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    try {
      console.log(`Deleting question with ID: ${id}`);
      const response = await api.delete(`/qa/questions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Question Votes
  voteQuestion: async (questionId, voteType) => {
    try {
      console.log(`Voting ${voteType} on question ${questionId}`);
      const response = await api.post(`/qa/question/${questionId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on question:', error);
      throw error;
    }
  },

  deleteVoteQuestion: async (questionId) => {
    try {
      console.log(`Removing vote from question ${questionId}`);
      const response = await api.delete(`/qa/question/${questionId}/vote/`);
      return response.data;
    } catch (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  },

  checkQuestionVoteStatus: async (questionId) => {
    try {
      console.log(`Checking vote status for question ${questionId}`);
      const response = await api.get(`/qa/question/${questionId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      console.log("Vote status response:", response.data);
      
      const voteType = response.data.vote_type;
      console.log("Vote type from response:", voteType);
      
      // Only return hasVoted true if we have a valid vote type
      if (voteType === 'up' || voteType === 'down') {
        return {
          hasVoted: true,
          voteType: voteType
        };
      } else {
        console.log("Vote type is invalid, returning hasVoted: false");
        return {
          hasVoted: false,
          voteType: null
        };
      }
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && (error.response.status === 204 || error.response.status === 404)) {
        console.log(`No vote found for question ${questionId}`);
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
      console.error('Error checking question vote status:', error);
      throw error;
    }
  },

  // Answers
  getAnswersByQuestionId: async (questionId, page = 1, pageSize = 10) => {
    try {
      console.log(`Fetching answers for question ${questionId}`);
      const response = await api.get(`/qa/questions/${questionId}/answers/`, {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching answers:', error);
      throw error;
    }
  },

  createAnswer: async (questionId, content) => {
    try {
      console.log(`Creating answer on question ${questionId} with content: ${content}`);
      const response = await api.post(`/qa/questions/${questionId}/answers/`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  },

  deleteAnswer: async (questionId, answerId) => {
    try {
      console.log(`Deleting answer ${answerId} from question ${questionId}`);
      const response = await api.delete(`/qa/questions/${questionId}/answers/${answerId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting answer:', error);
      throw error;
    }
  },

  // Answer Votes
  voteAnswer: async (answerId, voteType) => {
    try {
      console.log(`Voting ${voteType} on answer ${answerId}`);
      const response = await api.post(`/qa/answer/${answerId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on answer:', error);
      throw error;
    }
  },

  deleteVoteAnswer: async (answerId) => {
    try {
      console.log(`Removing vote from answer ${answerId}`);
      const response = await api.delete(`/qa/answer/${answerId}/vote/`);
      return response.data;
    } catch (error) {
      console.error('Error removing answer vote:', error);
      throw error;
    }
  },

  checkAnswerVoteStatus: async (answerId) => {
    try {
      console.log(`Checking vote status for answer ${answerId}`);
      const response = await api.get(`/qa/answer/${answerId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      return {
        hasVoted: true,
        voteType: response.data.vote_type
      };
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && error.response.status === 204) {
        console.log(`No vote found for answer ${answerId}`);
        return {
          hasVoted: false,
          voteType: null
        };
      }
      // For other errors (401, 404, etc.), throw the error
      console.error('Error checking answer vote status:', error);
      throw error;
    }
  }
};

export default qaService;
