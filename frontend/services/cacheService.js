/**
 * Recipe Cache Service
 * Manages offline storage and data synchronization using AsyncStorage
 * Implements cache expiration and storage space optimization
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class CacheService {
  static CACHE_KEYS = {
    RECIPES: 'cached_recipes',
    LAST_UPDATE: 'cache_last_update',
    USER_PREFERENCES: 'user_preferences',
    RECIPE_ACCESS_LOG: 'recipe_access_log',
    CACHE_INDEX: 'cache_index'
  };

  static CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  static MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB max cache size
  static MAX_RECIPES_CACHE = 200; // Maximum number of recipes to cache
  static ACCESS_LOG_LIMIT = 100; // Maximum access log entries
  static PRIORITY_THRESHOLD = 3; // Minimum access count for priority

  /**
   * Cache recipes data with timestamp, metadata, and size optimization
   * @param {Array} recipes - Array of recipe objects
   * @param {number} budget - Current budget setting
   * @param {number} servings - Current serving size
   */
  static async cacheRecipes(recipes, budget, servings) {
    try {
      // Check cache size before storing
      const currentSize = await this.getCurrentCacheSize();
      const newDataSize = this.estimateDataSize({ recipes, budget, servings });
      
      // If adding new data would exceed limit, perform cleanup
      if (currentSize + newDataSize > this.MAX_CACHE_SIZE) {
        console.log('Cache size limit approaching, performing cleanup...');
        await this.performCacheCleanup();
      }

      // Limit number of recipes if necessary
      let recipesToCache = recipes;
      if (recipes.length > this.MAX_RECIPES_CACHE) {
        console.log(`Limiting cached recipes from ${recipes.length} to ${this.MAX_RECIPES_CACHE}`);
        recipesToCache = await this.prioritizeRecipesForCache(recipes);
      }

      const cacheData = {
        recipes: recipesToCache,
        budget,
        servings,
        timestamp: Date.now(),
        version: '1.1',
        recipeCount: recipesToCache.length,
        originalCount: recipes.length
      };

      await AsyncStorage.setItem(
        this.CACHE_KEYS.RECIPES, 
        JSON.stringify(cacheData)
      );
      
      await AsyncStorage.setItem(
        this.CACHE_KEYS.LAST_UPDATE, 
        Date.now().toString()
      );

      // Update cache index for efficient lookup
      await this.updateCacheIndex(recipesToCache);

      console.log(`Cached ${recipesToCache.length}/${recipes.length} recipes for budget ${budget} and ${servings} servings`);
    } catch (error) {
      console.warn('Failed to cache recipes:', error);
    }
  }

  /**
   * Prioritize recipes for caching based on access patterns
   * @param {Array} recipes - All recipes to consider
   * @returns {Array} - Prioritized subset of recipes
   */
  static async prioritizeRecipesForCache(recipes) {
    try {
      const accessLog = await this.getRecipeAccessLog();
      const priorityRecipes = [];
      const regularRecipes = [];

      // Separate recipes by access frequency
      recipes.forEach(recipe => {
        const accessCount = accessLog[recipe.id] || 0;
        if (accessCount >= this.PRIORITY_THRESHOLD) {
          priorityRecipes.push({ ...recipe, accessCount });
        } else {
          regularRecipes.push(recipe);
        }
      });

      // Sort priority recipes by access count (descending)
      priorityRecipes.sort((a, b) => b.accessCount - a.accessCount);

      // Calculate how many regular recipes we can include
      const priorityCount = Math.min(priorityRecipes.length, Math.floor(this.MAX_RECIPES_CACHE * 0.7));
      const regularCount = this.MAX_RECIPES_CACHE - priorityCount;

      // Combine priority and regular recipes
      const result = [
        ...priorityRecipes.slice(0, priorityCount),
        ...regularRecipes.slice(0, regularCount)
      ];

      console.log(`Prioritized cache: ${priorityCount} priority + ${Math.min(regularCount, regularRecipes.length)} regular recipes`);
      return result;
    } catch (error) {
      console.warn('Failed to prioritize recipes, using first N recipes:', error);
      return recipes.slice(0, this.MAX_RECIPES_CACHE);
    }
  }

  /**
   * Update cache index for efficient recipe lookup
   * @param {Array} recipes - Recipes to index
   */
  static async updateCacheIndex(recipes) {
    try {
      const index = {
        recipeIds: recipes.map(r => r.id),
        nameIndex: {},
        costIndex: {},
        timestamp: Date.now()
      };

      // Build name index for fast search
      recipes.forEach(recipe => {
        const nameKey = recipe.name.toLowerCase();
        if (!index.nameIndex[nameKey]) {
          index.nameIndex[nameKey] = [];
        }
        index.nameIndex[nameKey].push(recipe.id);
      });

      // Build cost index for budget filtering
      recipes.forEach(recipe => {
        const costRange = this.getCostRange(recipe.costPerServing);
        if (!index.costIndex[costRange]) {
          index.costIndex[costRange] = [];
        }
        index.costIndex[costRange].push(recipe.id);
      });

      await AsyncStorage.setItem(
        this.CACHE_KEYS.CACHE_INDEX,
        JSON.stringify(index)
      );
    } catch (error) {
      console.warn('Failed to update cache index:', error);
    }
  }

  /**
   * Get cost range category for indexing
   * @param {number} cost - Cost per serving
   * @returns {string} - Cost range category
   */
  static getCostRange(cost) {
    if (cost < 50) return 'low';
    if (cost < 100) return 'medium';
    if (cost < 200) return 'high';
    return 'premium';
  }

  /**
   * Efficient recipe lookup by ID
   * @param {string} recipeId - Recipe ID to find
   * @returns {Object|null} - Recipe object or null
   */
  static async getRecipeById(recipeId) {
    try {
      const cached = await this.getCachedRecipes();
      if (!cached || !cached.recipes) return null;

      // Use find for direct lookup (optimized for small arrays)
      const recipe = cached.recipes.find(r => r.id === recipeId);
      
      if (recipe) {
        // Track access for prioritization
        await this.trackRecipeAccess(recipeId);
      }

      return recipe;
    } catch (error) {
      console.warn('Failed to get recipe by ID:', error);
      return null;
    }
  }

  /**
   * Efficient recipe search by name
   * @param {string} searchQuery - Search query
   * @returns {Array} - Matching recipes
   */
  static async searchRecipesByName(searchQuery) {
    try {
      const cached = await this.getCachedRecipes();
      if (!cached || !cached.recipes) return [];

      const query = searchQuery.toLowerCase().trim();
      if (!query) return cached.recipes;

      // Use the name index for faster search if available
      const index = await this.getCacheIndex();
      if (index && index.nameIndex) {
        const matchingIds = new Set();
        
        // Find exact matches first
        Object.keys(index.nameIndex).forEach(nameKey => {
          if (nameKey.includes(query)) {
            index.nameIndex[nameKey].forEach(id => matchingIds.add(id));
          }
        });

        // Return recipes matching the IDs
        return cached.recipes.filter(recipe => matchingIds.has(recipe.id));
      }

      // Fallback to linear search
      return cached.recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(query) ||
        (recipe.desc && recipe.desc.toLowerCase().includes(query))
      );
    } catch (error) {
      console.warn('Failed to search recipes by name:', error);
      return [];
    }
  }

  /**
   * Get cache index for efficient lookups
   * @returns {Object|null} - Cache index or null
   */
  static async getCacheIndex() {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_KEYS.CACHE_INDEX);
      return indexData ? JSON.parse(indexData) : null;
    } catch (error) {
      console.warn('Failed to get cache index:', error);
      return null;
    }
  }

  /**
   * Track recipe access for prioritization
   * @param {string} recipeId - Recipe ID that was accessed
   */
  static async trackRecipeAccess(recipeId) {
    try {
      const accessLog = await this.getRecipeAccessLog();
      
      // Increment access count
      accessLog[recipeId] = (accessLog[recipeId] || 0) + 1;
      
      // Limit log size to prevent unbounded growth
      const entries = Object.entries(accessLog);
      if (entries.length > this.ACCESS_LOG_LIMIT) {
        // Keep only the most accessed recipes
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        const limited = Object.fromEntries(sorted.slice(0, this.ACCESS_LOG_LIMIT));
        await this.saveRecipeAccessLog(limited);
      } else {
        await this.saveRecipeAccessLog(accessLog);
      }
    } catch (error) {
      console.warn('Failed to track recipe access:', error);
    }
  }

  /**
   * Get recipe access log for prioritization
   * @returns {Object} - Access log object
   */
  static async getRecipeAccessLog() {
    try {
      const logData = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPE_ACCESS_LOG);
      return logData ? JSON.parse(logData) : {};
    } catch (error) {
      console.warn('Failed to get recipe access log:', error);
      return {};
    }
  }

  /**
   * Save recipe access log
   * @param {Object} accessLog - Access log to save
   */
  static async saveRecipeAccessLog(accessLog) {
    try {
      await AsyncStorage.setItem(
        this.CACHE_KEYS.RECIPE_ACCESS_LOG,
        JSON.stringify(accessLog)
      );
    } catch (error) {
      console.warn('Failed to save recipe access log:', error);
    }
  }

  /**
   * Perform cache cleanup to free space
   */
  static async performCacheCleanup() {
    try {
      console.log('Performing cache cleanup...');
      
      // Get current cache stats
      const stats = await this.getCacheStats();
      console.log('Cache stats before cleanup:', stats);

      // Remove expired cache entries
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (this.isCacheExpired(cacheData.timestamp)) {
          await this.clearCache();
          console.log('Removed expired cache data');
          return;
        }
      }

      // If cache is not expired but still too large, reduce recipe count
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (cacheData.recipes && cacheData.recipes.length > this.MAX_RECIPES_CACHE * 0.8) {
          const prioritizedRecipes = await this.prioritizeRecipesForCache(cacheData.recipes);
          const reducedCount = Math.floor(this.MAX_RECIPES_CACHE * 0.7);
          
          cacheData.recipes = prioritizedRecipes.slice(0, reducedCount);
          cacheData.recipeCount = cacheData.recipes.length;
          
          await AsyncStorage.setItem(
            this.CACHE_KEYS.RECIPES,
            JSON.stringify(cacheData)
          );
          
          await this.updateCacheIndex(cacheData.recipes);
          console.log(`Reduced cache from ${prioritizedRecipes.length} to ${reducedCount} recipes`);
        }
      }

      // Clean up old access log entries
      const accessLog = await this.getRecipeAccessLog();
      const entries = Object.entries(accessLog);
      if (entries.length > this.ACCESS_LOG_LIMIT * 0.8) {
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        const cleaned = Object.fromEntries(sorted.slice(0, Math.floor(this.ACCESS_LOG_LIMIT * 0.7)));
        await this.saveRecipeAccessLog(cleaned);
        console.log(`Cleaned access log from ${entries.length} to ${Object.keys(cleaned).length} entries`);
      }

    } catch (error) {
      console.warn('Failed to perform cache cleanup:', error);
    }
  }

  /**
   * Get current cache size in bytes
   * @returns {number} - Cache size in bytes
   */
  static async getCurrentCacheSize() {
    try {
      let totalSize = 0;
      
      for (const key of Object.values(this.CACHE_KEYS)) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('Failed to get current cache size:', error);
      return 0;
    }
  }

  /**
   * Estimate data size for cache planning
   * @param {Object} data - Data to estimate size for
   * @returns {number} - Estimated size in bytes
   */
  static estimateDataSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      console.warn('Failed to estimate data size:', error);
      return 0;
    }
  }

  /**
   * Retrieve cached recipes if available and not expired
   * @returns {Object|null} - Cached recipe data or null if not available/expired
   */
  static async getCachedRecipes() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      if (!cached) {
        console.log('No cached recipes found');
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (this.isCacheExpired(cacheData.timestamp)) {
        console.log('Cache expired, clearing old data');
        await this.clearCache();
        return null;
      }

      console.log(`Retrieved ${cacheData.recipes?.length || 0} cached recipes`);
      return cacheData;
    } catch (error) {
      console.warn('Failed to get cached recipes:', error);
      return null;
    }
  }

  /**
   * Check if cache timestamp is expired
   * @param {number} timestamp - Cache timestamp
   * @returns {boolean} - True if cache is expired
   */
  static isCacheExpired(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') {
      return true;
    }
    
    return Date.now() - timestamp > this.CACHE_EXPIRY;
  }

  /**
   * Clear all cached recipe data and related indexes
   */
  static async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        this.CACHE_KEYS.RECIPES,
        this.CACHE_KEYS.LAST_UPDATE,
        this.CACHE_KEYS.CACHE_INDEX
      ]);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear only access log data (for privacy/reset)
   */
  static async clearAccessLog() {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEYS.RECIPE_ACCESS_LOG);
      console.log('Access log cleared successfully');
    } catch (error) {
      console.warn('Failed to clear access log:', error);
    }
  }

  /**
   * Check if local backend is available
   * @returns {Promise<boolean>} - True if backend is available
   */
  static async isLocalBackendAvailable() {
    try {
      // Simple connectivity check using fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

      const response = await fetch('http://10.0.2.2:3000/health', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Connectivity check failed:', error.message);
      return false;
    }
  }

  /**
   * Check if cache needs refresh based on staleness threshold
   * @param {number} stalenessThreshold - Threshold in milliseconds (default: 30 minutes)
   * @returns {Promise<boolean>} - True if cache needs refresh
   */
  static async needsRefresh(stalenessThreshold = 30 * 60 * 1000) {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      if (!cached) return true;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      
      return age > stalenessThreshold;
    } catch (error) {
      console.warn('Failed to check cache refresh needs:', error);
      return true;
    }
  }

  /**
   * Update cache metadata without changing recipe data
   * @param {Object} metadata - Metadata to update
   */
  static async updateCacheMetadata(metadata) {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      if (!cached) return;

      const cacheData = JSON.parse(cached);
      const updatedData = {
        ...cacheData,
        ...metadata,
        lastAccessed: Date.now()
      };

      await AsyncStorage.setItem(
        this.CACHE_KEYS.RECIPES, 
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.warn('Failed to update cache metadata:', error);
    }
  }

  /**
   * Get comprehensive cache statistics for debugging and monitoring
   * @returns {Promise<Object>} - Cache statistics
   */
  static async getCacheStats() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      const lastUpdate = await AsyncStorage.getItem(this.CACHE_KEYS.LAST_UPDATE);
      const index = await AsyncStorage.getItem(this.CACHE_KEYS.CACHE_INDEX);
      const accessLog = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPE_ACCESS_LOG);
      
      if (!cached) {
        return { 
          hasCache: false, 
          size: 0, 
          lastUpdate: null, 
          expired: true,
          totalCacheSize: await this.getCurrentCacheSize()
        };
      }

      const cacheData = JSON.parse(cached);
      const size = JSON.stringify(cacheData).length;
      const expired = this.isCacheExpired(cacheData.timestamp);
      const totalCacheSize = await this.getCurrentCacheSize();

      // Access log stats
      const accessLogData = accessLog ? JSON.parse(accessLog) : {};
      const accessLogStats = {
        totalEntries: Object.keys(accessLogData).length,
        topAccessed: Object.entries(accessLogData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => ({ recipeId: id, accessCount: count }))
      };

      // Index stats
      const indexStats = index ? {
        hasIndex: true,
        indexedRecipes: JSON.parse(index).recipeIds?.length || 0,
        nameIndexSize: Object.keys(JSON.parse(index).nameIndex || {}).length,
        costIndexSize: Object.keys(JSON.parse(index).costIndex || {}).length
      } : { hasIndex: false };

      return {
        hasCache: true,
        size,
        totalCacheSize,
        maxCacheSize: this.MAX_CACHE_SIZE,
        cacheUtilization: (totalCacheSize / this.MAX_CACHE_SIZE * 100).toFixed(1) + '%',
        lastUpdate: new Date(cacheData.timestamp).toISOString(),
        expired,
        recipeCount: cacheData.recipes?.length || 0,
        originalCount: cacheData.originalCount || cacheData.recipes?.length || 0,
        budget: cacheData.budget,
        servings: cacheData.servings,
        version: cacheData.version || '1.0',
        accessLogStats,
        indexStats,
        performance: {
          maxRecipesCache: this.MAX_RECIPES_CACHE,
          accessLogLimit: this.ACCESS_LOG_LIMIT,
          priorityThreshold: this.PRIORITY_THRESHOLD
        }
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { 
        hasCache: false, 
        size: 0, 
        lastUpdate: null, 
        expired: true,
        error: error.message
      };
    }
  }
}

export default CacheService;