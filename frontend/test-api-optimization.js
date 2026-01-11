/**
 * Simple test to verify API service optimizations work correctly
 */

import apiService from './services/apiService.js';

async function testApiOptimizations() {
  console.log('Testing API service optimizations...');
  
  try {
    // Test 1: Debouncing - multiple rapid calls should be debounced
    console.log('\n1. Testing debouncing...');
    const start1 = Date.now();
    
    const promises1 = [
      apiService.getAllRecipes(true), // with debouncing
      apiService.getAllRecipes(true), // should be debounced
      apiService.getAllRecipes(true), // should be debounced
    ];
    
    const results1 = await Promise.all(promises1);
    const end1 = Date.now();
    
    console.log(`Debounced requests completed in ${end1 - start1}ms`);
    console.log(`All results identical: ${JSON.stringify(results1[0]) === JSON.stringify(results1[1])}`);
    
    // Test 2: Deduplication - identical concurrent calls should be deduplicated
    console.log('\n2. Testing deduplication...');
    const start2 = Date.now();
    
    const promises2 = [
      apiService.getAllRecipes(false), // without debouncing, should deduplicate
      apiService.getAllRecipes(false), // should return same promise
      apiService.getAllRecipes(false), // should return same promise
    ];
    
    const results2 = await Promise.all(promises2);
    const end2 = Date.now();
    
    console.log(`Deduplicated requests completed in ${end2 - start2}ms`);
    console.log(`All results identical: ${JSON.stringify(results2[0]) === JSON.stringify(results2[1])}`);
    
    // Test 3: Request status monitoring
    console.log('\n3. Testing request status monitoring...');
    const status = apiService.getRequestStatus();
    console.log('Request status:', status);
    
    // Test 4: Request cancellation
    console.log('\n4. Testing request cancellation...');
    const cancelPromise = apiService.getAllRecipes(true);
    
    // Cancel after a short delay
    setTimeout(() => {
      apiService.cancelRequest('getAllRecipes');
    }, 100);
    
    try {
      await cancelPromise;
      console.log('Request completed (not cancelled)');
    } catch (error) {
      if (error.message.includes('cancelled')) {
        console.log('Request successfully cancelled');
      } else {
        console.log('Request failed with error:', error.message);
      }
    }
    
    console.log('\nAPI optimization tests completed successfully!');
    
  } catch (error) {
    console.error('API optimization test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testApiOptimizations();
}

export { testApiOptimizations };