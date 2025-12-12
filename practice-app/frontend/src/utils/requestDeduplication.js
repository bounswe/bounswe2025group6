// src/utils/requestDeduplication.js
// Request deduplication utility to prevent duplicate requests

const pendingRequests = new Map();

/**
 * Generate a unique key for a request
 */
function generateRequestKey(config) {
  const { method, url, params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

/**
 * Request interceptor to deduplicate requests
 */
export function requestDeduplicationInterceptor(config) {
  const requestKey = generateRequestKey(config);
  
  // Check if there's already a pending request with the same key
  if (pendingRequests.has(requestKey)) {
    // Return the existing promise instead of making a new request
    return pendingRequests.get(requestKey);
  }
  
  // Create a new promise for this request
  const requestPromise = Promise.resolve(config);
  
  // Store the promise
  pendingRequests.set(requestKey, requestPromise);
  
  // Remove from pending requests after a short delay (to allow response interceptor to handle it)
  // The response interceptor will handle cleanup
  return requestPromise;
}

/**
 * Response interceptor to clean up pending requests
 */
export function responseDeduplicationInterceptor(response) {
  const requestKey = generateRequestKey(response.config);
  pendingRequests.delete(requestKey);
  return response;
}

/**
 * Error interceptor to clean up pending requests on error
 */
export function errorDeduplicationInterceptor(error) {
  if (error.config) {
    const requestKey = generateRequestKey(error.config);
    pendingRequests.delete(requestKey);
  }
  return Promise.reject(error);
}

/**
 * Clear all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}

