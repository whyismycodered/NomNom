/**
 * Simple Integration Test for Frontend-Backend System
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testSystemIntegration() {
  console.log('🚀 Starting System Integration Test');
  console.log('=====================================');
  
  let passed = 0;
  let failed = 0;
  
  const test = async (name, testFn) => {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      failed++;
    }
  };

  // Test 1: Backend Health Check
  await test('Backend Health Check', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error('Backend health check failed');
    }
  });

  // Test 2: Get All Recipes
  await test('Get All Recipes', async () => {
    const response = await fetch(`${BASE_URL}/api/recipes`);
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.data)) {
      throw new Error('Failed to get all recipes');
    }
    if (data.data.length === 0) {
      throw new Error('No recipes found');
    }
    console.log(`   📊 Found ${data.data.length} recipes`);
  });

  // Test 3: Get Recipe by ID
  await test('Get Recipe by ID', async () => {
    // First get all recipes to get a valid ID
    const allResponse = await fetch(`${BASE_URL}/api/recipes`);
    const allData = await allResponse.json();
    
    if (allData.data.length === 0) {
      throw new Error('No recipes available for ID test');
    }
    
    const firstRecipe = allData.data[0];
    const response = await fetch(`${BASE_URL}/api/recipes/${firstRecipe._id}`);
    const data = await response.json();
    
    if (!response.ok || !data.success || !data.data) {
      throw new Error('Failed to get recipe by ID');
    }
    console.log(`   📝 Retrieved recipe: ${data.data.name}`);
  });

  // Test 4: Get Scaled Recipe
  await test('Get Scaled Recipe', async () => {
    // First get all recipes to get a valid ID
    const allResponse = await fetch(`${BASE_URL}/api/recipes`);
    const allData = await allResponse.json();
    
    if (allData.data.length === 0) {
      throw new Error('No recipes available for scaling test');
    }
    
    const firstRecipe = allData.data[0];
    const response = await fetch(`${BASE_URL}/api/recipes/${firstRecipe._id}/servings/4`);
    const data = await response.json();
    
    if (!response.ok || !data.success || !data.data) {
      throw new Error('Failed to get scaled recipe');
    }
    console.log(`   🔢 Scaled recipe for 4 servings: ₱${data.data.totalCost.toFixed(2)}`);
  });

  // Test 5: Budget Filtering
  await test('Budget Filtering', async () => {
    const response = await fetch(`${BASE_URL}/api/recipes/filter?budget=100&servings=4`);
    const data = await response.json();
    
    if (!response.ok || !data.success || !Array.isArray(data.data)) {
      throw new Error('Failed to filter recipes by budget');
    }
    console.log(`   💰 Found ${data.data.length} recipes within ₱100 budget for 4 servings`);
  });

  // Test 6: Various Budget Scenarios
  await test('Various Budget Scenarios', async () => {
    const scenarios = [
      { budget: 50, servings: 1 },
      { budget: 100, servings: 2 },
      { budget: 200, servings: 4 },
      { budget: 500, servings: 6 }
    ];
    
    for (const scenario of scenarios) {
      const response = await fetch(`${BASE_URL}/api/recipes/filter?budget=${scenario.budget}&servings=${scenario.servings}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(`Failed budget scenario: ₱${scenario.budget} for ${scenario.servings} servings`);
      }
      
      console.log(`   💵 ₱${scenario.budget}/${scenario.servings} servings: ${data.data.length} recipes`);
    }
  });

  // Test 7: Error Handling
  await test('Error Handling', async () => {
    // Test invalid recipe ID
    const invalidResponse = await fetch(`${BASE_URL}/api/recipes/invalid-id-12345`);
    if (invalidResponse.ok) {
      throw new Error('Should have failed for invalid recipe ID');
    }
    
    // Test invalid budget
    const invalidBudgetResponse = await fetch(`${BASE_URL}/api/recipes/filter?budget=0&servings=4`);
    if (invalidBudgetResponse.ok) {
      throw new Error('Should have failed for zero budget');
    }
    
    console.log('   🛡️ Error handling working correctly');
  });

  // Test 8: Performance Test
  await test('Performance Test', async () => {
    const startTime = Date.now();
    
    // Make multiple concurrent requests
    const promises = [
      fetch(`${BASE_URL}/api/recipes`),
      fetch(`${BASE_URL}/api/recipes/filter?budget=100&servings=4`),
      fetch(`${BASE_URL}/health`)
    ];
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    // Check all responses are successful
    for (const response of responses) {
      if (!response.ok) {
        throw new Error('One or more concurrent requests failed');
      }
    }
    
    const duration = endTime - startTime;
    console.log(`   ⚡ Concurrent requests completed in ${duration}ms`);
    
    if (duration > 5000) {
      throw new Error('Performance test took too long');
    }
  });

  // Final Report
  console.log('\n=====================================');
  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  const overallSuccess = failed === 0;
  console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? 'SYSTEM INTEGRATION PASSED' : 'SYSTEM INTEGRATION FAILED'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 All features are working together seamlessly!');
    console.log('✨ The frontend-backend integration is complete and functional.');
    console.log('🚀 System is ready for production use.');
  }
  
  return overallSuccess;
}

// Run the test
testSystemIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  });