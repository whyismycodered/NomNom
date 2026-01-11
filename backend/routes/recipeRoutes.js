const express = require('express');
const router = express.Router();
const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
  getRecipesByBudgetAndServings,
  getRecipeByIdWithServings
} = require('../controllers/recipeController');

/**
 * Recipe Routes
 * Implements Requirements 1.1, 1.2: Recipe data management endpoints
 */

// @route   GET /api/recipes/search
// @desc    Search recipes by name, ingredients, or other fields
// @access  Public
// @query   ?q=searchterm&budget=amount&servings=number
router.get('/search', searchRecipes);

// @route   GET /api/recipes/filter
// @desc    Filter recipes by budget and serving size with PHP currency
// @access  Public
// @query   ?budget=amount&servings=number&minBudget=amount&maxBudget=amount
router.get('/filter', getRecipesByBudgetAndServings);

// @route   GET /api/recipes
// @desc    Get all recipes with optional filtering
// @access  Public
// @query   ?search=query&budget=amount&servings=number
router.get('/', getAllRecipes);

// @route   GET /api/recipes/:id/servings/:servings
// @desc    Get recipe scaled to specific serving size with PHP costs
// @access  Public
router.get('/:id/servings/:servings', getRecipeByIdWithServings);

// @route   GET /api/recipes/:id
// @desc    Get single recipe by ID
// @access  Public
router.get('/:id', getRecipeById);

// @route   POST /api/recipes
// @desc    Create new recipe
// @access  Public (for seeding/admin purposes)
router.post('/', createRecipe);

// @route   PUT /api/recipes/:id
// @desc    Update recipe
// @access  Public (for admin purposes)
router.put('/:id', updateRecipe);

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
// @access  Public (for admin purposes)
router.delete('/:id', deleteRecipe);

module.exports = router;