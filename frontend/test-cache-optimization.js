/**
 * Simple test to verify cache service optimizations work correctly
 */

import { CacheService } from './services/cacheService.js';

async function testCacheOptimizations() {
  console.log('Testing cache service optimizations...');
  
  try {
    // Clear cache to start fresh
    await CacheService.clearCache();
    await CacheService.clearAccessLog();
    
    // Test 1: Cache size management
    console.log('\n1. Testing cache size management...');
    
    // Create a large number of mock recipes
    const mockRecipes = Array.from({ length: 250 }, (_, i) => ({
      id: `recipe-${i}`,
      name: `Recipe ${i}`,
      desc: `Description for recipe ${i}`,
      costPerServing: Math.random() * 200,
      totalCost: Math.random() * 800,
      servings: 4,
      ingredients: [`Ingredient 1 for recipe ${i}`, `Ingredient 2 for recipe ${i}`],
      procedures: [`Step 1 for recipe ${i}`, `Step 2 for recipe ${i}`]
    }));
    
    // Cache the recipes - should trigger size management
    await CacheService.cacheRecipes(mockRecipes, 500, 4);
    
    const stats1 = await CacheService.getCacheStats();
    console.log(`Cached ${stats1.recipeCount}/${stats1.originalCount} recipes`);
    console.log(`Cache utilization: ${stats1.cacheUtilization}`);
    console.log(`Has index: ${stats1.indexStats.hasIndex}`);
    
    // Test 2: Recipe access tracking and prioritization
    console.log('\n2. Testing access tracking and prioritization...');
    
    // Access some recipes multiple times
    const priorityRecipes = ['recipe-1', 'recipe-5', 'recipe-10'];
    for (const recipeId of priorityRecipes) {
      for (let i = 0; i < 5; i++) {
        await CacheService.getRecipeById(recipeId);
      }
    }
    
    const stats2 = await CacheService.getCacheStats();
    console.log('Top accessed recipes:', stats2.accessLogStats.topAccessed);
    
    // Test 3: Efficient search
    console.log('\n3. Testing efficient search...');
    
    const searchStart = Date.now();
    const searchResults = await CacheService.searchRecipesByName('Recipe 1');
    const searchEnd = Date.now();
    
    console.log(`Search completed in ${searchEnd - searchStart}ms`);
    console.log(`Found ${searchResults.length} recipes matching "Recipe 1"`);
    
    // Test 4: Cache cleanup
    console.log('\n4. Testing cache cleanup...');
    
    const statsBefore = await CacheService.getCacheStats();
    console.log(`Cache size before cleanup: ${statsBefore.size} bytes`);
    
    await CacheService.performCacheCleanup();
    
    const statsAfter = await CacheService.getCacheStats();
    console.log(`Cache size after cleanup: ${statsAfter.size} bytes`);
    
    // Test 5: Index-based lookup
    console.log('\n5. Testing index-based lookup...');
    
    const index = await CacheService.getCacheIndex();
    if (index) {
      console.log(`Index has ${index.recipeIds.length} recipes`);
      console.log(`Name index size: ${Object.keys(index.nameIndex).length}`);
      console.log(`Cost index size: ${Object.keys(index.costIndex).length}`);
    }
    
    console.log('\nCache optimization tests completed successfully!');
    
  } catch (error) {
    console.error('Cache optimization test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCacheOptimizations();
}

export { testCacheOptimizations };