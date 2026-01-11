const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const dbConnection = require('../config/database');
const recipes = require('../data/recipes.json'); // Direct import - much cleaner!
require('dotenv').config();

/**
 * Clean and simple database seeding utility
 * Reads directly from recipes.json and populates MongoDB
 */

/**
 * Prepare recipes with default values for any missing fields
 */
function prepareRecipes() {
  return recipes.map(recipe => ({
    ...recipe,
    cuisine: recipe.cuisine || "Filipino",
    category: recipe.category || "Main Dish",
    tags: recipe.tags || ["filipino"]
  }));
}

/**
 * Seed the database with recipe data from recipes.json
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await dbConnection.connect();
    
    // Prepare recipes from JSON
    const recipesToSeed = prepareRecipes();
    console.log(`📋 Found ${recipesToSeed.length} recipes to seed`);
    
    // Clear existing recipes (optional - remove this line to keep existing data)
    console.log('🗑️  Clearing existing recipes...');
    await Recipe.deleteMany({});
    
    // Insert new recipes
    console.log('📝 Inserting recipe data...');
    const insertedRecipes = await Recipe.insertMany(recipesToSeed);
    
    console.log(`✅ Successfully inserted ${insertedRecipes.length} recipes`);
    
    // Display summary
    console.log('\n📊 Recipe Summary:');
    insertedRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.name}`);
      console.log(`   💰 Cost: ₱${recipe.totalCost} (₱${recipe.costPerServing}/serving)`);
      console.log(`   🍽️  Servings: ${recipe.servings} | ⏱️  Time: ${recipe.totalTime} mins`);
      console.log(`   📊 Ingredients: ${recipe.ingredients.length} items`);
      console.log('');
    });
    
    // Cost statistics
    const totalCosts = insertedRecipes.map(r => r.totalCost);
    const avgCost = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
    const minCost = Math.min(...totalCosts);
    const maxCost = Math.max(...totalCosts);
    
    console.log('💹 Cost Statistics:');
    console.log(`   Average: ₱${avgCost.toFixed(2)}`);
    console.log(`   Range: ₱${minCost} - ₱${maxCost}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await dbConnection.disconnect();
    console.log('👋 Database seeding completed');
  }
}

/**
 * Add a single recipe to the database
 */
async function addSingleRecipe(recipeData) {
  try {
    await dbConnection.connect();
    const recipe = new Recipe(recipeData);
    const savedRecipe = await recipe.save();
    console.log(`✅ Recipe "${savedRecipe.name}" added successfully`);
    return savedRecipe;
  } catch (error) {
    console.error('❌ Error adding recipe:', error.message);
    throw error;
  } finally {
    await dbConnection.disconnect();
  }
}

/**
 * Validate recipe data before inserting
 */
function validateRecipeData(recipeData) {
  const recipe = new Recipe(recipeData);
  const validationError = recipe.validateSync();
  
  if (validationError) {
    console.error('❌ Recipe validation failed:');
    Object.keys(validationError.errors).forEach(key => {
      console.error(`  - ${key}: ${validationError.errors[key].message}`);
    });
    return false;
  }
  
  console.log('✅ Recipe data is valid');
  return true;
}

// Export functions
module.exports = {
  seedDatabase,
  addSingleRecipe,
  validateRecipeData,
  prepareRecipes
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}