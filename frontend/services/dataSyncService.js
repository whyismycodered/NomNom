/**
 * Data Synchronization Service
 * Handles local database synchronization, cache refresh logic, and smart cache invalidation
 * Optimized for local MongoDB backend communication without internet dependency
 * 
 * Requirements: 7.4, 9.2, 9.3
 */

import { AppState } from 'react-native';
import CacheService from './cacheService';
import apiService from './apiService';
import { RecipeTransformer } from '../utils/recipeTransformer';

class DataSyncService {
  constructor() {
    this.isLocalBackendAvailable = true;
    this.appState = AppState.currentState;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncListeners = new Set();
    this.backendListeners = new Set();
    this.pendingRequests = new Map(); // Track concurrent requests
    
    // Configuration for local backend
    this.BACKGROUND_SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes for local backend
    this.STALE_DATA_THRESHOLD = 10 * 60 * 1000; // 10 minutes for local data
    this.MAX_CONCURRENT_REQUESTS = 3;
    this.REQUEST_DEBOUNCE_TIME = 500; // 500ms debounce
    
    this.initialize();
  }

  /**
   * Initialize app state listeners for local backend communication
   */
  initialize() {
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', nextAppState => {
      const wasBackground = this.appState === 'background';
      const isActive = nextAppState === 'active';
      
      console.log(`App state changed: ${this.appState} -> ${nextAppState}`);
      
      this.appState = nextAppState;
      
      // Handle app coming to foreground - check local backend
      if (wasBackground && isActive) {
        this.handleAppForeground();
      }
    });

    // Start background sync timer for local backend
    this.startBackgroundSync();
    
    // Initial backend connectivity check
    this.checkLocalBackendConnectivity();
  }

  /**
   * Clean up listeners and timers
   */
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }
    
    // Cancel any pending requests
    this.pendingRequests.clear();
    
    this.syncListeners.clear();
    this.backendListeners.clear();
  }

  /**
   * Check local backend connectivity
   */
  async checkLocalBackendConnectivity() {
    try {
      const isAvailable = await apiService.testConnectivity();
      const wasAvailable = this.isLocalBackendAvailable;
      
      this.isLocalBackendAvailable = isAvailable;
      
      console.log(`Local backend connectivity: ${wasAvailable ? 'available' : 'unavailable'} -> ${isAvailable ? 'available' : 'unavailable'}`);
      
      // Handle backend availability transitions
      if (!wasAvailable && isAvailable) {
        this.handleBackendAvailable();
      } else if (wasAvailable && !isAvailable) {
        this.handleBackendUnavailable();
      }
      
      // Notify listeners
      this.notifyBackendListeners(isAvailable);
      
    } catch (error) {
      console.warn('Error checking local backend connectivity:', error);
      this.isLocalBackendAvailable = false;
      this.notifyBackendListeners(false);
    }
  }

  /**
   * Handle local backend becoming available
   */
  async handleBackendAvailable() {
    console.log('Local backend became available - checking for stale data');
    
    try {
      // Check if cached data is stale
      const cacheStats = await CacheService.getCacheStats();
      
      if (cacheStats.hasCache && this.isCacheStale(cacheStats.lastUpdate)) {
        console.log('Cached data is stale, triggering background sync');
        await this.performBackgroundSync();
      }
    } catch (error) {
      console.warn('Error during backend available handling:', error);
    }
  }

  /**
   * Handle local backend becoming unavailable
   */
  handleBackendUnavailable() {
    console.log('Local backend became unavailable - using cached data only');
    
    // Cancel any pending requests
    this.pendingRequests.clear();
    
    // Stop background sync when backend is unavailable
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
  }

  /**
   * Handle app coming to foreground
   */
  async handleAppForeground() {
    console.log('App came to foreground - checking local backend and data freshness');
    
    // First check backend connectivity
    await this.checkLocalBackendConnectivity();
    
    if (!this.isLocalBackendAvailable) {
      console.log('Local backend unavailable, using cached data');
      return;
    }
    
    try {
      const cacheStats = await CacheService.getCacheStats();
      
      // If data is stale or we haven't synced recently, perform sync
      if (!cacheStats.hasCache || 
          this.isCacheStale(cacheStats.lastUpdate) || 
          this.shouldPerformForegroundSync()) {
        
        console.log('Performing foreground data sync with local backend');
        await this.performBackgroundSync();
      }
    } catch (error) {
      console.warn('Error during app foreground handling:', error);
    }
  }

  /**
   * Start background sync timer for local backend
   */
  startBackgroundSync() {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }
    
    this.backgroundSyncTimer = setInterval(() => {
      if (this.isLocalBackendAvailable && this.appState === 'active') {
        this.performBackgroundSync();
      }
    }, this.BACKGROUND_SYNC_INTERVAL);
  }

  /**
   * Perform background data synchronization with local backend
   */
  async performBackgroundSync(forceSync = false) {
    if (this.syncInProgress && !forceSync) {
      console.log('Sync already in progress, skipping');
      return;
    }
    
    if (!this.isLocalBackendAvailable) {
      console.log('Local backend unavailable, skipping background sync');
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Starting background data sync with local backend');
      
      // Get current cache stats
      const cacheStats = await CacheService.getCacheStats();
      
      // Only sync if data is stale or force sync is requested
      if (!forceSync && cacheStats.hasCache && !this.isCacheStale(cacheStats.lastUpdate)) {
        console.log('Local data is fresh, skipping sync');
        return;
      }
      
      // Fetch fresh data from local backend
      const response = await apiService.getAllRecipes();
      
      // Use cached servings or default to 4
      const servings = cacheStats.servings || 4;
      const budget = cacheStats.budget || 500; // Default budget
      
      // Transform the data
      const transformedRecipes = RecipeTransformer.transformAllRecipes(response, servings);
      
      // Update cache
      await CacheService.cacheRecipes(transformedRecipes, budget, servings);
      
      this.lastSyncTime = Date.now();
      
      console.log(`Background sync completed - updated ${transformedRecipes.length} recipes from local backend`);
      
      // Notify listeners about successful sync
      this.notifySyncListeners({
        success: true,
        timestamp: this.lastSyncTime,
        recipeCount: transformedRecipes.length,
        type: 'background',
        source: 'local_backend'
      });
      
    } catch (error) {
      console.warn('Background sync with local backend failed:', error);
      
      // Check if backend became unavailable
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        this.isLocalBackendAvailable = false;
        this.notifyBackendListeners(false);
      }
      
      // Notify listeners about sync failure
      this.notifySyncListeners({
        success: false,
        error: error.message,
        timestamp: Date.now(),
        type: 'background',
        source: 'local_backend'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle concurrent API requests to prevent inconsistencies
   */
  async handleConcurrentRequest(requestKey, requestFn) {
    // Check if request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`Request ${requestKey} already pending, waiting for completion`);
      return await this.pendingRequests.get(requestKey);
    }
    
    // Check concurrent request limit
    if (this.pendingRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
      console.warn(`Too many concurrent requests (${this.pendingRequests.size}), queuing request`);
      await this.waitForRequestSlot();
    }
    
    // Create and track the request
    const requestPromise = this.executeRequest(requestKey, requestFn);
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Execute a request with proper error handling
   */
  async executeRequest(requestKey, requestFn) {
    try {
      console.log(`Executing request: ${requestKey}`);
      const result = await requestFn();
      console.log(`Request completed: ${requestKey}`);
      return result;
    } catch (error) {
      console.error(`Request failed: ${requestKey}`, error);
      
      // Check if it's a backend connectivity issue
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        this.isLocalBackendAvailable = false;
        this.notifyBackendListeners(false);
      }
      
      throw error;
    }
  }

  /**
   * Wait for a request slot to become available
   */
  async waitForRequestSlot() {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.pendingRequests.size < this.MAX_CONCURRENT_REQUESTS) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  /**
   * Debounced request execution to prevent excessive API calls
   */
  debounceRequest(key, requestFn, delay = this.REQUEST_DEBOUNCE_TIME) {
    if (this.debounceTimers && this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
    }
    
    if (!this.debounceTimers) {
      this.debounceTimers = {};
    }
    
    return new Promise((resolve, reject) => {
      this.debounceTimers[key] = setTimeout(async () => {
        try {
          const result = await this.handleConcurrentRequest(key, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          delete this.debounceTimers[key];
        }
      }, delay);
    });
  }

  /**
   * Check if cached data is stale based on timestamp
   */
  isCacheStale(lastUpdateString) {
    if (!lastUpdateString) return true;
    
    try {
      const lastUpdate = new Date(lastUpdateString).getTime();
      const now = Date.now();
      const age = now - lastUpdate;
      
      return age > this.STALE_DATA_THRESHOLD;
    } catch (error) {
      console.warn('Error checking cache staleness:', error);
      return true;
    }
  }

  /**
   * Determine if foreground sync should be performed
   */
  shouldPerformForegroundSync() {
    if (!this.lastSyncTime) return true;
    
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    return timeSinceLastSync > this.BACKGROUND_SYNC_INTERVAL;
  }

  /**
   * Manually trigger data sync with local backend
   */
  async triggerSync(options = {}) {
    const { force = false, type = 'manual' } = options;
    
    console.log(`Triggering ${type} sync with local backend (force: ${force})`);
    
    try {
      await this.performBackgroundSync(force);
      
      return {
        success: true,
        timestamp: Date.now(),
        type,
        source: 'local_backend'
      };
    } catch (error) {
      console.error(`${type} sync failed:`, error);
      
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        type,
        source: 'local_backend'
      };
    }
  }

  /**
   * Add listener for sync events
   */
  addSyncListener(listener) {
    this.syncListeners.add(listener);
    
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Add listener for backend availability changes
   */
  addBackendListener(listener) {
    this.backendListeners.add(listener);
    
    return () => {
      this.backendListeners.delete(listener);
    };
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners(event) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Error in sync listener:', error);
      }
    });
  }

  /**
   * Notify backend availability listeners
   */
  notifyBackendListeners(isAvailable) {
    this.backendListeners.forEach(listener => {
      try {
        listener(isAvailable);
      } catch (error) {
        console.warn('Error in backend listener:', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      isLocalBackendAvailable: this.isLocalBackendAvailable,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      appState: this.appState,
      pendingRequestCount: this.pendingRequests.size
    };
  }

  /**
   * Invalidate cache based on user activity patterns
   */
  async invalidateCacheIfNeeded(activityType, metadata = {}) {
    console.log(`Cache invalidation check for activity: ${activityType}`, metadata);
    
    try {
      const cacheStats = await CacheService.getCacheStats();
      
      let shouldInvalidate = false;
      
      switch (activityType) {
        case 'budget_change':
          // Invalidate if budget changed significantly
          const budgetChange = Math.abs((metadata.newBudget || 0) - (cacheStats.budget || 0));
          shouldInvalidate = budgetChange > (cacheStats.budget || 0) * 0.2; // 20% change
          break;
          
        case 'serving_change':
          // Invalidate if serving size changed
          shouldInvalidate = metadata.newServings !== cacheStats.servings;
          break;
          
        case 'recipe_view':
          // Don't invalidate for recipe views, but could trigger background refresh
          if (this.isLocalBackendAvailable && !this.syncInProgress) {
            setTimeout(() => this.performBackgroundSync(), 1000);
          }
          break;
          
        case 'search_activity':
          // Don't invalidate for search, but track usage patterns
          break;
          
        default:
          console.log(`Unknown activity type: ${activityType}`);
      }
      
      if (shouldInvalidate) {
        console.log(`Invalidating cache due to ${activityType}`);
        await CacheService.clearCache();
        
        // Trigger immediate sync if backend is available
        if (this.isLocalBackendAvailable) {
          await this.performBackgroundSync(true);
        }
      }
      
    } catch (error) {
      console.warn('Error during cache invalidation check:', error);
    }
  }

  /**
   * Smooth UI update handling when new data arrives
   */
  async handleDataUpdate(newData, updateType = 'background') {
    console.log(`Handling data update: ${updateType}`);
    
    try {
      // Ensure UI updates are smooth by batching changes
      if (updateType === 'background' && this.appState === 'active') {
        // Delay background updates slightly to avoid interrupting user interactions
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Update cache with new data
      if (newData && newData.length > 0) {
        const cacheStats = await CacheService.getCacheStats();
        const servings = cacheStats.servings || 4;
        const budget = cacheStats.budget || 500;
        
        await CacheService.cacheRecipes(newData, budget, servings);
        
        // Notify listeners about the update
        this.notifySyncListeners({
          success: true,
          timestamp: Date.now(),
          recipeCount: newData.length,
          type: updateType,
          source: 'local_backend',
          smooth: true
        });
      }
      
    } catch (error) {
      console.warn('Error handling data update:', error);
    }
  }

  /**
   * Get debounced API call function for specific operations
   */
  getDebouncedApiCall(operation) {
    const debouncedCalls = {
      getAllRecipes: () => this.debounceRequest('getAllRecipes', () => apiService.getAllRecipes()),
      getScaledRecipe: (recipeId, servings) => 
        this.debounceRequest(`getScaledRecipe_${recipeId}_${servings}`, () => apiService.getScaledRecipe(recipeId, servings)),
      filterRecipes: (budget, servings) => 
        this.debounceRequest(`filterRecipes_${budget}_${servings}`, () => apiService.filterRecipes(budget, servings))
    };
    
    return debouncedCalls[operation] || null;
  }
}

// Export singleton instance
export default new DataSyncService();