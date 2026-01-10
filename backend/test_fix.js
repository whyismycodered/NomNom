/**
 * Quick test to verify the ingredient fix works with API endpoints
 */

const http = require('http');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

async function testFix() {
  console.log('🧪 Testing ingredient fix...\n');
  
  // Start server
  const { spawn } = require('child_process');
  const server = spawn('node', ['server.js'], { cwd: __dirname });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Get recipes to find an ID
    const recipesResponse = await makeRequest('/api/recipes');
    if (recipesResponse && recipesResponse.data && recipesResponse.data.length > 0) {
      const recipeId = recipesResponse.data[0]._id;
      
      // Test scaling endpoint
      console.log('🔄 Testing recipe scaling endpoint...');
      const scaledResponse = await makeRequest(`/api/recipes/${recipeId}/servings/6`);
      
      if (scaledResponse && scaledResponse.data) {
        const recipe = scaledResponse.data;
        console.log(`✅ Recipe: ${recipe.name}`);
        console.log(`✅ Servings: ${recipe.servings} (scale factor: ${recipe.scaleFactor}x)`);
        console.log(`✅ Total cost: ₱${recipe.totalCost}`);
        console.log(`✅ Cost per serving: ₱${recipe.costPerServing}`);
        
        console.log('\n🥕 First 3 ingredients:');
        recipe.ingredients.slice(0, 3).forEach((ingredient, index) => {
          console.log(`  ${index + 1}. ${ingredient.name || 'UNDEFINED NAME'}`);
          console.log(`     ${ingredient.quantity} ${ingredient.unit || 'UNDEFINED UNIT'}`);
          console.log(`     ₱${ingredient.totalCost}`);
        });
        
        if (recipe.ingredients[0].name && recipe.ingredients[0].unit) {
          console.log('\n🎉 SUCCESS: Ingredient names and units are now properly displayed!');
        } else {
          console.log('\n❌ ISSUE: Ingredient names or units are still undefined');
        }
      } else {
        console.log('❌ Failed to get scaled recipe response');
      }
    } else {
      console.log('❌ Failed to get recipes');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    // Stop server
    server.kill();
    console.log('\n✅ Test completed');
  }
}

testFix();