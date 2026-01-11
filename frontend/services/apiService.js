/**
 * API Service Layer for Frontend-Backend Integration
 * Handles all HTTP communication with the Recipe API Backend
 * Implements retry logic, error handling, and request validation
 */

class ApiService {
  constructor() {
    // Use localhost for testing, Android emulator IP for production
    // In a real app, this would be configured via environment variables
    this.baseURL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
    this.timeout = 10000; // 10 second timeout
    this.maxRetries = 3;
    
    // Performance optimization properties
    this.pendingRequests = new Map(); // Request deduplication
    this.debounceTimers = new Map(); // Debouncing timers
    this.requestControllers = new Map(); // AbortControllers for cancellation
    this.DEBOUNCE_DELAY = 300; // 300ms debounce delay
    this.MAX_CONCURRENT_REQUESTS = 5; // Maximum concurrent requests
  }

  /**
   * Debounced API call to prevent excessive requests
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that makes the API request
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Promise} - Debounced request promise
   */
  debouncedRequest(key, requestFn, delay = this.DEBOUNCE_DELAY) {
    // Cancel existing timer for this key
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          this.debounceTimers.delete(key);
          const result = await this.deduplicatedRequest(key, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Deduplicated request to prevent identical concurrent calls
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that makes the API request
   * @returns {Promise} - Request promise (shared if duplicate)
   */
  deduplicatedRequest(key, requestFn) {
    // Return existing promise if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create new request with cancellation support
    const controller = new AbortController();
    this.requestControllers.set(key, controller);

    const requestPromise = this.executeWithCancellation(key, requestFn, controller)
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
        this.requestControllers.delete(key);
      });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Execute request with cancellation support
   * @param {string} key - Request key for logging
   * @param {Function} requestFn - Function that makes the API request
   * @param {AbortController} controller - Abort controller for cancellation
   * @returns {Promise} - Request result
   */
  async executeWithCancellation(key, requestFn, controller) {
    try {
      // Check if we're at concurrent request limit
      if (this.pendingRequests.size > this.MAX_CONCURRENT_REQUESTS) {
        console.warn(`High concurrent request load (${this.pendingRequests.size}), request may be delayed: ${key}`);
      }

      const result = await requestFn(controller.signal);
      console.log(`Request completed successfully: ${key}`);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request cancelled: ${key}`);
        throw new Error(`Request cancelled: ${key}`);
      }
      console.error(`Request failed: ${key}`, error);
      throw error;
    }
  }

  /**
   * Cancel a specific request by key
   * @param {string} key - Request key to cancel
   */
  cancelRequest(key) {
    const controller = this.requestControllers.get(key);
    if (controller) {
      console.log(`Cancelling request: ${key}`);
      controller.abort();
      this.requestControllers.delete(key);
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    console.log(`Cancelling ${this.requestControllers.size} pending requests`);
    
    for (const [key, controller] of this.requestControllers.entries()) {
      controller.abort();
    }
    
    this.requestControllers.clear();
    this.pendingRequests.clear();
    
    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Get current request status for monitoring
   * @returns {Object} - Request status information
   */
  getRequestStatus() {
    return {
      pendingRequests: Array.from(this.pendingRequests.keys()),
      pendingCount: this.pendingRequests.size,
      debouncingCount: this.debounceTimers.size,
      maxConcurrent: this.MAX_CONCURRENT_REQUESTS
    };
  }

  /**
   * Makes HTTP requests with retry logic and error handling
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<Object>} - API response data
   */
  async makeRequest(endpoint, options = {}, signal = null) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      signal, // Add abort signal support
      ...options
    };

    return this.retryRequest(() => this.fetchWithTimeout(url, config), this.maxRetries);
  }

  /**
   * Fetch with timeout support
   * @param {string} url - Request URL
   * @param {Object} config - Fetch configuration
   * @returns {Promise<Response>} - Fetch response
   */
  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Implements exponential backoff retry logic
   * @param {Function} requestFn - Function that makes the request
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} - API response data
   */
  async retryRequest(requestFn, maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.validateResponse(data);
        return data;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Determines if an error should not be retried
   * @param {Error} error - The error to check
   * @returns {boolean} - True if error should not be retried
   */
  isNonRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Don't retry client errors (4xx) except for 408 (timeout) and 429 (rate limit)
    if (message.includes('http 4')) {
      return !message.includes('408') && !message.includes('429');
    }
    
    // Don't retry on JSON parsing errors
    if (message.includes('json') || message.includes('parse')) {
      return true;
    }
    
    return false;
  }

  /**
   * Validates API response structure and content
   * @param {Object} data - Response data to validate
   * @throws {Error} - If response is invalid
   */
  validateResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Expected JSON object');
    }
    
    if (data.success === false) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    // Additional validation for expected response structure
    if (data.data === undefined && data.success === undefined) {
      console.warn('Response missing expected structure (data or success field)');
    }
  }

  /**
   * Get all available recipes from the backend (with optimization)
   * @param {boolean} useDebouncing - Whether to use debouncing (default: true)
   * @returns {Promise<Object>} - All recipes data
   */
  async getAllRecipes(useDebouncing = true) {
    const requestKey = 'getAllRecipes';
    
    const requestFn = async (signal) => {
      try {
        return await this.makeRequest('/api/recipes', {}, signal);
      } catch (error) {
        console.error('Failed to fetch all recipes:', error);
        throw new Error(`Failed to load recipes: ${error.message}`);
      }
    };

    if (useDebouncing) {
      return this.debouncedRequest(requestKey, requestFn);
    } else {
      return this.deduplicatedRequest(requestKey, requestFn);
    }
  }

  /**
   * Get a specific recipe by ID (with optimization)
   * @param {string} recipeId - Recipe identifier
   * @param {boolean} useDebouncing - Whether to use debouncing (default: false)
   * @returns {Promise<Object>} - Recipe data
   */
  async getRecipeById(recipeId, useDebouncing = false) {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    const requestKey = `getRecipeById_${recipeId}`;
    
    const requestFn = async (signal) => {
      try {
        return await this.makeRequest(`/api/recipes/${recipeId}`, {}, signal);
      } catch (error) {
        console.error(`Failed to fetch recipe ${recipeId}:`, error);
        throw new Error(`Failed to load recipe: ${error.message}`);
      }
    };

    if (useDebouncing) {
      return this.debouncedRequest(requestKey, requestFn);
    } else {
      return this.deduplicatedRequest(requestKey, requestFn);
    }
  }

  /**
   * Filter recipes by budget and servings (with optimization)
   * @param {number} budget - Budget amount in PHP
   * @param {number} servings - Number of servings (default: 4)
   * @param {boolean} useDebouncing - Whether to use debouncing (default: true)
   * @returns {Promise<Object>} - Filtered recipes data
   */
  async filterRecipes(budget, servings = 4, useDebouncing = true) {
    if (!budget || budget <= 0) {
      throw new Error('Valid budget amount is required');
    }

    if (!servings || servings <= 0) {
      throw new Error('Valid serving size is required');
    }

    const requestKey = `filterRecipes_${budget}_${servings}`;
    
    const requestFn = async (signal) => {
      try {
        const endpoint = `/api/recipes/filter?budget=${budget}&servings=${servings}`;
        return await this.makeRequest(endpoint, {}, signal);
      } catch (error) {
        console.error(`Failed to filter recipes (budget: ${budget}, servings: ${servings}):`, error);
        throw new Error(`Failed to filter recipes: ${error.message}`);
      }
    };

    if (useDebouncing) {
      return this.debouncedRequest(requestKey, requestFn);
    } else {
      return this.deduplicatedRequest(requestKey, requestFn);
    }
  }

  /**
   * Get scaled recipe details for specific servings (with optimization)
   * @param {string} recipeId - Recipe identifier
   * @param {number} servings - Target number of servings
   * @param {boolean} useDebouncing - Whether to use debouncing (default: false)
   * @returns {Promise<Object>} - Scaled recipe data
   */
  async getScaledRecipe(recipeId, servings, useDebouncing = false) {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    if (!servings || servings <= 0) {
      throw new Error('Valid serving size is required');
    }

    const requestKey = `getScaledRecipe_${recipeId}_${servings}`;
    
    const requestFn = async (signal) => {
      try {
        const endpoint = `/api/recipes/${recipeId}/servings/${servings}`;
        return await this.makeRequest(endpoint, {}, signal);
      } catch (error) {
        console.error(`Failed to fetch scaled recipe ${recipeId} for ${servings} servings:`, error);
        throw new Error(`Failed to load recipe details: ${error.message}`);
      }
    };

    if (useDebouncing) {
      return this.debouncedRequest(requestKey, requestFn);
    } else {
      return this.deduplicatedRequest(requestKey, requestFn);
    }
  }

  /**
   * Health check endpoint to verify backend connectivity (with optimization)
   * @param {boolean} useDebouncing - Whether to use debouncing (default: false)
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck(useDebouncing = false) {
    const requestKey = 'healthCheck';
    
    const requestFn = async (signal) => {
      try {
        return await this.makeRequest('/health', {}, signal);
      } catch (error) {
        console.error('Health check failed:', error);
        throw new Error(`Backend health check failed: ${error.message}`);
      }
    };

    if (useDebouncing) {
      return this.debouncedRequest(requestKey, requestFn);
    } else {
      return this.deduplicatedRequest(requestKey, requestFn);
    }
  }

  /**
   * Test connectivity to the backend server (with optimization)
   * @returns {Promise<boolean>} - True if backend is reachable
   */
  async testConnectivity() {
    try {
      await this.healthCheck(false); // Don't debounce connectivity tests
      return true;
    } catch (error) {
      console.warn('Backend connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Cleanup method to cancel all requests and clear timers
   * Should be called when the service is no longer needed
   */
  cleanup() {
    console.log('Cleaning up API service...');
    this.cancelAllRequests();
  }
}

// Export singleton instance
export default new ApiService();