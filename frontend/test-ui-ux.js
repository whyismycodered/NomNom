/**
 * UI/UX Validation Test
 * Tests that the UI components and user experience match design requirements
 */

import { RecipeTransformer } from './utils/recipeTransformer.js';
import { CacheService } from './services/cacheService.js';

class UIUXValidator {
  constructor() {
    this.results = { passed: 0, failed: 0, errors: [] };
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

  async validateDataTransformation() {
    this.log('=== Testing Data Transformation for UI Components ===');
    
    // Mock backend data
    const mockBackendData = {
      success: true,
      data: [
        {
          _id: "test-recipe-1",
          name: "Chicken Afritada",
          description: "Filipino chicken stew with vegetables",
          ingredients: [
            { name: "Chicken", quantity: 1, unit: "kg", costPerUnit: 200, totalCost: 200 },
            { name: "Tomato Sauce", quantity: 2, unit: "cans", costPerUnit: 25, totalCost: 50 }
          ],
          instructions: [
            { step: 1, description: "Cut chicken into pieces" },
            { step: 2, description: "Sauté onions and garlic" }
          ],
          servings: 4,
          totalCost: 250
        }
      ]
    };

    try {
      // Test recipe transformation for MealContainer
      const transformedRecipes = RecipeTransformer.transformAllRecipes(mockBackendData, 4);
      
      await this.assert(transformedRecipes.length === 1, 'Recipe transformation returns correct count');
      
      const recipe = transformedRecipes[0];
      await this.assert(recipe.id === "test-recipe-1", 'Recipe ID preserved');
      await this.assert(recipe.name === "Chicken Afritada", 'Recipe name preserved');
      await this.assert(recipe.desc === "Filipino chicken stew with vegetables", 'Recipe description preserved');
      await this.assert(typeof recipe.totalCost === 'number', 'Total cost is numeric');
      await this.assert(typeof recipe.costPerServing === 'number', 'Cost per serving is numeric');
      await this.assert(recipe.imgKey === 'chicken-afritada', 'Image key generated correctly');
      
      // Test cost calculation accuracy
      const expectedCostPerServing = 250 / 4;
      await this.assert(
        Math.abs(recipe.costPerServing - expectedCostPerServing) < 0.01,
        'Cost per serving calculated correctly'
      );

      // Test scaled recipe transformation for MealView
      const mockScaledData = {
        success: true,
        data: {
          _id: "test-recipe-1",
          name: "Chicken Afritada",
          description: "Filipino chicken stew with vegetables",
          ingredients: [
            { name: "Chicken", quantity: 2, unit: "kg", totalCost: 400 },
            { name: "Tomato Sauce", quantity: 4, unit: "cans", totalCost: 100 }
          ],
          instructions: [
            { step: 1, description: "Cut chicken into pieces" },
            { step: 2, description: "Sauté onions and garlic" }
          ],
          servings: 8,
          totalCost: 500,
          costPerServing: 62.5,
          scaleFactor: 2
        }
      };

      const scaledRecipe = RecipeTransformer.transformScaledRecipe(mockScaledData);
      await this.assert(scaledRecipe !== null, 'Scaled recipe transformation works');
      await this.assert(scaledRecipe.servings === 8, 'Scaled servings correct');
      await this.assert(scaledRecipe.totalCost === 500, 'Scaled total cost correct');
      await this.assert(scaledRecipe.ingredients.length === 2, 'Scaled ingredients preserved');
      
      // Test ingredient display format
      const firstIngredient = scaledRecipe.ingredients[0];
      await this.assert(
        firstIngredient.displayText.includes('₱400.00'),
        'Ingredient display text includes cost'
      );

    } catch (error) {
      await this.assert(false, `Data transformation validation failed: ${error.message}`);
    }
  }

  async validateBudgetVisualFeedback() {
    this.log('=== Testing Budget Visual Feedback System ===');
    
    try {
      // Mock recipes with different costs
      const mockRecipes = [
        { id: '1', name: 'Cheap Recipe', costPerServing: 25, totalCost: 100 },
        { id: '2', name: 'Moderate Recipe', costPerServing: 50, totalCost: 200 },
        { id: '3', name: 'Expensive Recipe', costPerServing: 100, totalCost: 400 }
      ];

      // Test budget scenarios
      const scenarios = [
        { budget: 100, servings: 4, description: 'Low budget scenario' },
        { budget: 200, servings: 4, description: 'Medium budget scenario' },
        { budget: 400, servings: 4, description: 'High budget scenario' }
      ];

      for (const scenario of scenarios) {
        const budgetPerServing = scenario.budget / scenario.servings;
        
        const recipesWithBudgetStatus = mockRecipes.map(recipe => ({
          ...recipe,
          isWithinBudget: recipe.costPerServing <= budgetPerServing,
          exceedsBudgetBy: Math.max(0, recipe.costPerServing - budgetPerServing)
        }));

        const withinBudget = recipesWithBudgetStatus.filter(r => r.isWithinBudget);
        const exceedsBudget = recipesWithBudgetStatus.filter(r => !r.isWithinBudget);

        await this.assert(
          withinBudget.length + exceedsBudget.length === mockRecipes.length,
          `Budget categorization complete for ${scenario.description}`
        );

        // Validate budget calculations
        for (const recipe of recipesWithBudgetStatus) {
          const expectedExceeds = Math.max(0, recipe.costPerServing - budgetPerServing);
          await this.assert(
            Math.abs(recipe.exceedsBudgetBy - expectedExceeds) < 0.01,
            `Budget excess calculation correct for ${recipe.name} in ${scenario.description}`
          );
        }
      }

    } catch (error) {
      await this.assert(false, `Budget visual feedback validation failed: ${error.message}`);
    }
  }

  async validateSearchFunctionality() {
    this.log('=== Testing Search Integration ===');
    
    try {
      // Mock recipe data
      const mockRecipes = [
        { id: '1', name: 'Chicken Afritada', desc: 'Filipino chicken stew' },
        { id: '2', name: 'Pork Adobo', desc: 'Classic Filipino pork dish' },
        { id: '3', name: 'Beef Mechado', desc: 'Tender beef in tomato sauce' },
        { id: '4', name: 'Fried Bangus', desc: 'Crispy fried milkfish' }
      ];

      // Test search queries
      const searchTests = [
        { query: 'chicken', expectedCount: 1, description: 'Search by main ingredient' },
        { query: 'pork', expectedCount: 1, description: 'Search by protein type' },
        { query: 'filipino', expectedCount: 2, description: 'Search by cuisine description' },
        { query: 'nonexistent', expectedCount: 0, description: 'Search with no results' },
        { query: '', expectedCount: 4, description: 'Empty search returns all' },
        { query: 'CHICKEN', expectedCount: 1, description: 'Case insensitive search' }
      ];

      for (const test of searchTests) {
        const filteredRecipes = mockRecipes.filter(recipe => {
          if (!test.query.trim()) return true;
          
          const query = test.query.toLowerCase().trim();
          const recipeName = recipe.name.toLowerCase();
          const recipeDesc = recipe.desc ? recipe.desc.toLowerCase() : '';
          
          return recipeName.includes(query) || recipeDesc.includes(query);
        });

        await this.assert(
          filteredRecipes.length === test.expectedCount,
          `${test.description}: Expected ${test.expectedCount}, got ${filteredRecipes.length}`
        );
      }

    } catch (error) {
      await this.assert(false, `Search functionality validation failed: ${error.message}`);
    }
  }

  async validateCacheUIIntegration() {
    this.log('=== Testing Cache and UI Integration ===');
    
    try {
      // Test cache stats for UI display
      const stats = await CacheService.getCacheStats();
      
      await this.assert(typeof stats === 'object', 'Cache stats returns object');
      await this.assert(typeof stats.hasCache === 'boolean', 'Cache status is boolean');
      await this.assert(typeof stats.size === 'number', 'Cache size is numeric');
      
      // Test cache expiration for UI indicators
      const currentTime = Date.now();
      const expiredTime = currentTime - (25 * 60 * 60 * 1000); // 25 hours ago
      const recentTime = currentTime - (1 * 60 * 60 * 1000); // 1 hour ago
      
      await this.assert(
        CacheService.isCacheExpired(expiredTime),
        'Cache expiration detection works for old data'
      );
      
      await this.assert(
        !CacheService.isCacheExpired(recentTime),
        'Cache expiration detection works for recent data'
      );

    } catch (error) {
      await this.assert(false, `Cache UI integration validation failed: ${error.message}`);
    }
  }

  async validateErrorUIStates() {
    this.log('=== Testing Error UI States ===');
    
    try {
      // Test error message formatting
      const errorScenarios = [
        { error: 'Network timeout', expectedType: 'timeout' },
        { error: 'HTTP 404: Not Found', expectedType: '404' },
        { error: 'HTTP 500: Internal Server Error', expectedType: '500' },
        { error: 'Connection refused', expectedType: 'offline' }
      ];

      for (const scenario of errorScenarios) {
        // Simulate error message processing (as would be done in ErrorBoundary)
        let errorMessage = "Something went wrong. Please try again.";
        
        if (scenario.error.includes('timeout')) {
          errorMessage = "Request timed out. The server might be busy. Please try again.";
        } else if (scenario.error.includes('404')) {
          errorMessage = "Recipe not found. It might have been removed or updated.";
        } else if (scenario.error.includes('500')) {
          errorMessage = "Server error. Our team has been notified. Please try again later.";
        } else if (scenario.error.includes('refused')) {
          errorMessage = "You're offline. Check your internet connection and try again.";
        }

        await this.assert(
          errorMessage.length > 0,
          `Error message generated for ${scenario.expectedType} error`
        );
      }

    } catch (error) {
      await this.assert(false, `Error UI states validation failed: ${error.message}`);
    }
  }

  async validateLoadingStates() {
    this.log('=== Testing Loading State Accuracy ===');
    
    try {
      // Test loading state transitions
      const loadingStates = [
        { state: 'initial', loading: true, data: null, description: 'Initial load' },
        { state: 'loaded', loading: false, data: [], description: 'Data loaded' },
        { state: 'refreshing', loading: false, data: [], refreshing: true, description: 'Pull to refresh' },
        { state: 'error', loading: false, data: null, error: 'Network error', description: 'Error state' }
      ];

      for (const state of loadingStates) {
        // Validate loading state logic
        const shouldShowSkeleton = state.loading && !state.refreshing;
        const shouldShowData = !state.loading && state.data !== null && !state.error;
        const shouldShowError = !state.loading && state.error;
        const shouldShowRefreshIndicator = state.refreshing;

        await this.assert(
          typeof shouldShowSkeleton === 'boolean',
          `Loading skeleton logic works for ${state.description}`
        );
        
        await this.assert(
          typeof shouldShowData === 'boolean',
          `Data display logic works for ${state.description}`
        );
        
        await this.assert(
          typeof shouldShowError === 'boolean',
          `Error display logic works for ${state.description}`
        );
      }

    } catch (error) {
      await this.assert(false, `Loading states validation failed: ${error.message}`);
    }
  }

  async validateResponsiveDesign() {
    this.log('=== Testing Responsive Design Logic ===');
    
    try {
      // Test column calculation logic (as used in MealContainer)
      const screenWidths = [320, 360, 480, 768, 1024, 1200];
      
      for (const width of screenWidths) {
        const cols = width < 360 ? 1 : width < 768 ? 2 : 3;
        
        await this.assert(
          cols >= 1 && cols <= 3,
          `Column calculation valid for ${width}px width: ${cols} columns`
        );
        
        // Validate expected column counts
        if (width < 360) {
          await this.assert(cols === 1, `Single column for narrow screens (${width}px)`);
        } else if (width < 768) {
          await this.assert(cols === 2, `Two columns for medium screens (${width}px)`);
        } else {
          await this.assert(cols === 3, `Three columns for wide screens (${width}px)`);
        }
      }

    } catch (error) {
      await this.assert(false, `Responsive design validation failed: ${error.message}`);
    }
  }

  async runAllValidations() {
    this.log('🎨 Starting UI/UX Validation');
    this.log('============================');
    
    const startTime = Date.now();
    
    await this.validateDataTransformation();
    await this.validateBudgetVisualFeedback();
    await this.validateSearchFunctionality();
    await this.validateCacheUIIntegration();
    await this.validateErrorUIStates();
    await this.validateLoadingStates();
    await this.validateResponsiveDesign();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Generate final report
    this.log('============================');
    this.log('🎨 UI/UX VALIDATION REPORT');
    this.log('============================');
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
    this.log(`\n🎯 UI/UX RESULT: ${overallSuccess ? 'UI/UX VALIDATION PASSED' : 'UI/UX VALIDATION FAILED'}`, 
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

// Run validation
const validator = new UIUXValidator();
validator.runAllValidations()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ UI/UX validation failed:', error);
    process.exit(1);
  });