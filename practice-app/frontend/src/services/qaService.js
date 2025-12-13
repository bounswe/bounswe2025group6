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
      const response = await api.get('/qa/questions/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getQuestionById: async (id) => {
    try {
      const response = await api.get(`/qa/questions/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/qa/questions/', questionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateQuestion: async (id, questionData) => {
    try {
      const response = await api.put(`/qa/questions/${id}/`, questionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    try {
      const response = await api.delete(`/qa/questions/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Question Votes
  voteQuestion: async (questionId, voteType) => {
    try {
      const response = await api.post(`/qa/question/${questionId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteVoteQuestion: async (questionId) => {
    try {
      const response = await api.delete(`/qa/question/${questionId}/vote/`);
      // DELETE may return 204 No Content, which has no response body
      return response.data || { success: true };
    } catch (error) {
      throw error;
    }
  },

  checkQuestionVoteStatus: async (questionId) => {
    try {
      const response = await api.get(`/qa/question/${questionId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      const voteType = response.data.vote_type;
      
      // Only return hasVoted true if we have a valid vote type
      if (voteType === 'up' || voteType === 'down') {
        return {
          hasVoted: true,
          voteType: voteType
        };
      } else {
        return {
          hasVoted: false,
          voteType: null
        };
      }
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && (error.response.status === 204 || error.response.status === 404)) {
        return {
          hasVoted: false,
          voteType: null
        };
      }
      
      // For other errors (401, etc.), throw the error
      throw error;
    }
  },

  // Answers
  getAnswersByQuestionId: async (questionId, page = 1, pageSize = 10) => {
    try {
      const response = await api.get(`/qa/questions/${questionId}/answers/`, {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAnswer: async (questionId, content) => {
    try {
      const response = await api.post(`/qa/questions/${questionId}/answers/`, {
        content
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAnswer: async (questionId, answerId) => {
    try {
      const response = await api.delete(`/qa/questions/${questionId}/answers/${answerId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Answer Votes
  voteAnswer: async (answerId, voteType) => {
    try {
      const response = await api.post(`/qa/answer/${answerId}/vote/`, {
        vote_type: voteType // 'up' or 'down'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteVoteAnswer: async (answerId) => {
    try {
      const response = await api.delete(`/qa/answer/${answerId}/vote/`);
      // DELETE may return 204 No Content, which has no response body
      return response.data || { success: true };
    } catch (error) {
      throw error;
    }
  },

  checkAnswerVoteStatus: async (answerId) => {
    try {
      const response = await api.get(`/qa/answer/${answerId}/vote/`);
      
      // For 200 OK responses, the endpoint returns the vote data
      return {
        hasVoted: true,
        voteType: response.data.vote_type
      };
    } catch (error) {
      // For 204 Not Found (no vote), return hasVoted: false
      if (error.response && error.response.status === 204) {
        return {
          hasVoted: false,
          voteType: null
        };
      }
      // For other errors (401, 404, etc.), throw the error
      throw error;
    }
  }
};

export default qaService;
