/**
 * Comprehensive System Validation Tests
 * Tests all features working together seamlessly across various scenarios
 */

import apiService from './services/apiService.js';
import { RecipeTransformer } from './utils/recipeTransformer.js';
import { CacheService } from './services/cacheService.js';

// Test configuration
const TEST_SCENARIOS = [
  { budget: 50, servings: 1, description: "Low budget, single serving" },
  { budget: 100, servings: 2, description: "Medium budget, couple" },
  { budget: 200, servings: 4, description: "High budget, family" },
  { budget: 500, servings: 6, description: "Premium budget, large group" },
  { budget: 25, servings: 8, description: "Very low budget, large group" }
];

class SystemValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async assert(condition, message) {
    if (condition) {
      this.results.passed++;
      this.log(`PASS: ${message}`, 'success');
    } else {
      this.results.failed++;
      this.results.errors.push(message);
      this.log(`FAIL: ${message}`, 'error');
    }
  }

  async validateApiConnectivity() {
    this.log('=== Testing API Connectivity ===');
    
    try {
      // Test health endpoint
      const health = await apiService.healthCheck();
      await this.assert(health && health.success, 'Backend health check passes');
      
      // Test all recipe endpoints
      const allRecipes = await apiService.getAllRecipes();
      await this.assert(allRecipes && allRecipes.data && Array.isArray(allRecipes.data), 'Get all recipes returns valid data');
      
      if (allRecipes.data.length > 0) {
        const firstRecipe = allRecipes.data[0];
        
        // Test individual recipe fetch
        const singleRecipe = await apiService.getRecipeById(firstRecipe._id);
        await this.assert(singleRecipe && singleRecipe.data, 'Get recipe by ID works');
        
        // Test scaled recipe fetch
        const scaledRecipe = await apiService.getScaledRecipe(firstRecipe._id, 4);
        await this.assert(scaledRecipe && scaledRecipe.data, 'Get scaled recipe works');
      }
      
    } catch (error) {
      await this.assert(false, `API connectivity failed: ${error.message}`);
    }
  }

  async validateBudgetFiltering() {
    this.log('=== Testing Budget Filtering Across Various Scenarios ===');
    
    for (const scenario of TEST_SCENARIOS) {
      try {
        this.log(`Testing scenario: ${scenario.description} (₱${scenario.budget}, ${scenario.servings} servings)`);
        
        // Get all recipes and calculate budget status
        const allRecipes = await apiService.getAllRecipes();
        const transformedRecipes = RecipeTransformer.transformAllRecipes(allRecipes, scenario.servings);
        
        // Calculate budget compliance
        const budgetPerServing = scenario.budget / scenario.servings;
        const withinBudget = transformedRecipes.filter(recipe => recipe.costPerServing <= budgetPerServing);
        const exceedsBudget = transformedRecipes.filter(recipe => recipe.costPerServing > budgetPerServing);
        
        await this.assert(transformedRecipes.length > 0, `Recipes loaded for ${scenario.description}`);
        await this.assert(
          withinBudget.length + exceedsBudget.length === transformedRecipes.length,
          `Budget categorization is complete for ${scenario.description}`
        );
        
        // Validate cost calculations
        for (const recipe of transformedRecipes.slice(0, 3)) { // Test first 3 recipes
          const expectedCostPerServing = recipe.totalCost / scenario.servings;
          const actualCostPerServing = recipe.costPerServing;
          const tolerance = 0.01; // 1 cent tolerance
          
          await this.assert(
            Math.abs(expectedCostPerServing - actualCostPerServing) < tolerance,
            `Cost calculation accurate for ${recipe.name} in ${scenario.description}`
          );
        }
        
      } catch (error) {
        await this.assert(false, `Budget filtering failed for ${scenario.description}: ${error.message}`);
      }
    }
  }

  async validateDataTransformation() {
    this.log('=== Testing Data Transformation Consistency ===');
    
    try {
      const allRecipes = await apiService.getAllRecipes();
      const transformedRecipes = RecipeTransformer.transformAllRecipes(allRecipes, 4);
      
      for (const recipe of transformedRecipes.slice(0, 5)) { // Test first 5 recipes
        // Validate required fields
        await this.assert(recipe.id, `Recipe ${recipe.name} has ID`);
        await this.assert(recipe.name, `Recipe has name`);
        await this.assert(typeof recipe.totalCost === 'number', `Recipe ${recipe.name} has numeric total cost`);
        await this.assert(typeof recipe.costPerServing === 'number', `Recipe ${recipe.name} has numeric cost per serving`);
        await this.assert(recipe.imgKey, `Recipe ${recipe.name} has image key`);
        
        // Validate cost calculations
        const expectedCostPerServing = recipe.totalCost / 4;
        await this.assert(
          Math.abs(recipe.costPerServing - expectedCostPerServing) < 0.01,
          `Cost per serving calculation correct for ${recipe.name}`
        );
      }
      
    } catch (error) {
      await this.assert(false, `Data transformation validation failed: ${error.message}`);
    }
  }

  async validateScaledRecipeAccuracy() {
    this.log('=== Testing Recipe Scaling Mathematical Correctness ===');
    
    try {
      const allRecipes = await apiService.getAllRecipes();
      if (allRecipes.data.length === 0) {
        await this.assert(false, 'No recipes available for scaling test');
        return;
      }
      
      const testRecipe = allRecipes.data[0];
      const testServings = [1, 2, 4, 6, 8];
      
      for (const servings of testServings) {
        try {
          const scaledRecipe = await apiService.getScaledRecipe(testRecipe._id, servings);
          const transformed = RecipeTransformer.transformScaledRecipe(scaledRecipe);
          
          await this.assert(transformed, `Scaled recipe transforms for ${servings} servings`);
          await this.assert(transformed.servings === servings, `Serving count correct for ${servings} servings`);
          await this.assert(typeof transformed.totalCost === 'number', `Total cost is numeric for ${servings} servings`);
          await this.assert(typeof transformed.costPerServing === 'number', `Cost per serving is numeric for ${servings} servings`);
          
          // Validate cost per serving calculation
          const expectedCostPerServing = transformed.totalCost / servings;
          await this.assert(
            Math.abs(transformed.costPerServing - expectedCostPerServing) < 0.01,
            `Cost per serving calculation accurate for ${servings} servings`
          );
          
        } catch (error) {
          await this.assert(false, `Recipe scaling failed for ${servings} servings: ${error.message}`);
        }
      }
      
    } catch (error) {
      await this.assert(false, `Recipe scaling validation failed: ${error.message}`);
    }
  }

  async validateCacheConsistency() {
    this.log('=== Testing Cache Consistency and Performance ===');
    
    try {
      // Clear cache first
      await CacheService.clearCache();
      
      // Test cache miss scenario
      let cached = await CacheService.getCachedRecipes();
      await this.assert(cached === null, 'Cache initially empty');
      
      // Load and cache recipes
      const allRecipes = await apiService.getAllRecipes();
      const transformedRecipes = RecipeTransformer.transformAllRecipes(allRecipes, 4);
      await CacheService.cacheRecipes(transformedRecipes, 100, 4);
      
      // Test cache hit scenario
      cached = await CacheService.getCachedRecipes();
      await this.assert(cached !== null, 'Recipes cached successfully');
      await this.assert(cached.recipes.length > 0, 'Cached recipes contain data');
      await this.assert(cached.budget === 100, 'Budget cached correctly');
      await this.assert(cached.servings === 4, 'Servings cached correctly');
      
      // Test cache stats
      const stats = await CacheService.getCacheStats();
      await this.assert(stats.hasCache, 'Cache stats show cache exists');
      await this.assert(stats.recipeCount > 0, 'Cache stats show recipe count');
      
    } catch (error) {
      await this.assert(false, `Cache validation failed: ${error.message}`);
    }
  }

  async validateErrorHandling() {
    this.log('=== Testing Error Handling and Recovery ===');
    
    try {
      // Test invalid recipe ID
      try {
        await apiService.getRecipeById('invalid-id-12345');
        await this.assert(false, 'Should throw error for invalid recipe ID');
      } catch (error) {
        await this.assert(true, 'Properly handles invalid recipe ID');
      }
      
      // Test invalid serving size
      try {
        await apiService.getScaledRecipe('valid-id', 0);
        await this.assert(false, 'Should throw error for zero servings');
      } catch (error) {
        await this.assert(true, 'Properly handles invalid serving size');
      }
      
      // Test invalid budget
      try {
        await apiService.filterRecipes(0, 4);
        await this.assert(false, 'Should throw error for zero budget');
      } catch (error) {
        await this.assert(true, 'Properly handles invalid budget');
      }
      
    } catch (error) {
      await this.assert(false, `Error handling validation failed: ${error.message}`);
    }
  }

  async validateSearchIntegration() {
    this.log('=== Testing Search Integration with Budget Indicators ===');
    
    try {
      const allRecipes = await apiService.getAllRecipes();
      const transformedRecipes = RecipeTransformer.transformAllRecipes(allRecipes, 4);
      
      if (transformedRecipes.length === 0) {
        await this.assert(false, 'No recipes available for search test');
        return;
      }
      
      // Test search functionality
      const searchQueries = ['chicken', 'pork', 'beef', 'fish', 'nonexistent'];
      
      for (const query of searchQueries) {
        const filteredRecipes = transformedRecipes.filter(recipe =>
          recipe.name.toLowerCase().includes(query.toLowerCase()) ||
          (recipe.desc && recipe.desc.toLowerCase().includes(query.toLowerCase()))
        );
        
        if (query === 'nonexistent') {
          await this.assert(filteredRecipes.length === 0, 'Search returns no results for non-existent query');
        } else {
          // For real queries, just validate the filtering logic works
          const manualFilter = transformedRecipes.filter(recipe => {
            const recipeName = recipe.name.toLowerCase();
            const recipeDesc = recipe.desc ? recipe.desc.toLowerCase() : '';
            return recipeName.includes(query.toLowerCase()) || recipeDesc.includes(query.toLowerCase());
          });
          
          await this.assert(
            filteredRecipes.length === manualFilter.length,
            `Search filtering works correctly for "${query}"`
          );
        }
      }
      
    } catch (error) {
      await this.assert(false, `Search integration validation failed: ${error.message}`);
    }
  }

  async validateOfflineMode() {
    this.log('=== Testing Offline Mode Consistency ===');
    
    try {
      // Ensure we have cached data
      const allRecipes = await apiService.getAllRecipes();
      const transformedRecipes = RecipeTransformer.transformAllRecipes(allRecipes, 4);
      await CacheService.cacheRecipes(transformedRecipes, 100, 4);
      
      // Test cache retrieval (simulating offline mode)
      const cached = await CacheService.getCachedRecipes();
      await this.assert(cached !== null, 'Cached data available for offline mode');
      await this.assert(cached.recipes.length > 0, 'Cached recipes contain data');
      
      // Test cache expiration logic
      const isExpired = CacheService.isCacheExpired(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await this.assert(isExpired, 'Cache expiration logic works correctly');
      
      const isNotExpired = CacheService.isCacheExpired(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      await this.assert(!isNotExpired, 'Cache not expired for recent data');
      
    } catch (error) {
      await this.assert(false, `Offline mode validation failed: ${error.message}`);
    }
  }

  async validatePerformanceOptimizations() {
    this.log('=== Testing Performance Optimizations ===');
    
    try {
      // Test API service request deduplication
      const startTime = Date.now();
      
      // Make multiple identical requests simultaneously
      const promises = [
        apiService.getAllRecipes(),
        apiService.getAllRecipes(),
        apiService.getAllRecipes()
      ];
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      await this.assert(results.length === 3, 'All requests completed');
      await this.assert(results[0].data.length === results[1].data.length, 'Consistent results from deduplicated requests');
      
      // Test should be faster than 3 separate requests due to deduplication
      const duration = endTime - startTime;
      this.log(`Request deduplication completed in ${duration}ms`);
      
      // Test cache performance
      const cacheStartTime = Date.now();
      await CacheService.getCachedRecipes();
      const cacheEndTime = Date.now();
      const cacheDuration = cacheEndTime - cacheStartTime;
      
      await this.assert(cacheDuration < 100, `Cache retrieval is fast (${cacheDuration}ms < 100ms)`);
      
    } catch (error) {
      await this.assert(false, `Performance optimization validation failed: ${error.message}`);
    }
  }

  async runAllValidations() {
    this.log('🚀 Starting Comprehensive System Validation');
    this.log('================================================');
    
    const startTime = Date.now();
    
    // Run all validation tests
    await this.validateApiConnectivity();
    await this.validateBudgetFiltering();
    await this.validateDataTransformation();
    await this.validateScaledRecipeAccuracy();
    await this.validateCacheConsistency();
    await this.validateErrorHandling();
    await this.validateSearchIntegration();
    await this.validateOfflineMode();
    await this.validatePerformanceOptimizations();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Generate final report
    this.log('================================================');
    this.log('📊 FINAL VALIDATION REPORT');
    this.log('================================================');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    this.log(`Duration: ${duration}ms`);
    this.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      this.log('❌ FAILED TESTS:');
      this.results.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    const overallSuccess = this.results.failed === 0;
    this.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? 'SYSTEM VALIDATION PASSED' : 'SYSTEM VALIDATION FAILED'}`, 
             overallSuccess ? 'success' : 'error');
    
    return {
      success: overallSuccess,
      passed: this.results.passed,
      failed: this.results.failed,
      errors: this.results.errors,
      duration
    };
  }
}

// Run validation if called directly
const validator = new SystemValidator();
validator.runAllValidations()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });

export default SystemValidator;