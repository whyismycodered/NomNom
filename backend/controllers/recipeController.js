const Recipe = require('../models/Recipe');
const RecipeScaler = require('../utils/recipeScaler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all recipes with optional search and filtering
 * @route   GET /api/recipes
 * @access  Public
 * @query   ?search=query&budget=amount&servings=number
 * Requirements: 1.1, 1.5
 */
const getAllRecipes = asyncHandler(async (req, res) => {
  const { search, budget, servings } = req.query;
  
  // Build query object
  let query = {};
  
  // Add text search if provided
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { 'ingredients.name': { $regex: search.trim(), $options: 'i' } }
    ];
  }
  
  // Execute query
  let recipes = await Recipe.find(query)
    .select('-__v')
    .sort({ createdAt: -1 });
  
  // Apply budget filtering if provided
  if (budget && !isNaN(budget)) {
    const budgetAmount = parseFloat(budget);
    const targetServings = servings && !isNaN(servings) ? parseInt(servings) : null;
    
    recipes = recipes.filter(recipe => {
      if (targetServings) {
        // Calculate cost per serving for target servings
        const originalServings = parseInt(recipe.servings.toString().match(/\d+/)?.[0] || '1');
        const scaleFactor = targetServings / originalServings;
        const scaledTotalCost = recipe.totalCost * scaleFactor;
        return scaledTotalCost <= budgetAmount;
      } else {
        // Use original recipe cost
        return recipe.totalCost <= budgetAmount;
      }
    });
    
    // Sort by cost efficiency (lowest cost per serving first)
    recipes.sort((a, b) => {
      const aServings = parseInt(a.servings.toString().match(/\d+/)?.[0] || '1');
      const bServings = parseInt(b.servings.toString().match(/\d+/)?.[0] || '1');
      const aCostPerServing = a.totalCost / aServings;
      const bCostPerServing = b.totalCost / bServings;
      return aCostPerServing - bCostPerServing;
    });
  }
  
  res.status(200).json({
    success: true,
    count: recipes.length,
    data: recipes
  });
});

/**
 * @desc    Get single recipe by ID
 * @route   GET /api/recipes/:id
 * @access  Public
 * Requirements: 1.2, 1.4, 1.5
 */
const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).select('-__v');
  
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: 'Recipe not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: recipe
  });
});

/**
 * @desc    Create new recipe
 * @route   POST /api/recipes
 * @access  Public (for seeding/admin purposes)
 * Requirements: 1.4, 1.5
 */
const createRecipe = asyncHandler(async (req, res) => {
  // Validate required fields
  const { name, description, ingredients, servings } = req.body;
  
  if (!name || !description || !ingredients || !servings) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, description, ingredients, and servings'
    });
  }
  
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Recipe must have at least one ingredient'
    });
  }
  
  // Validate each ingredient has required fields
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    if (!ingredient.name || ingredient.quantity === undefined || !ingredient.unit || ingredient.costPerUnit === undefined) {
      return res.status(400).json({
        success: false,
        error: `Ingredient ${i + 1} is missing required fields (name, quantity, unit, costPerUnit)`
      });
    }
    
    if (ingredient.quantity < 0 || ingredient.costPerUnit < 0) {
      return res.status(400).json({
        success: false,
        error: `Ingredient ${i + 1} cannot have negative quantity or cost`
      });
    }
  }
  
  try {
    const recipe = await Recipe.create(req.body);
    
    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    // Handle duplicate name error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Recipe with this name already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    throw error;
  }
});

/**
 * @desc    Update recipe
 * @route   PUT /api/recipes/:id
 * @access  Public (for admin purposes)
 * Requirements: 1.4, 1.5
 */
const updateRecipe = asyncHandler(async (req, res) => {
  let recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: 'Recipe not found'
    });
  }
  
  try {
    recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');
    
    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    // Handle duplicate name error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Recipe with this name already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    throw error;
  }
});

/**
 * @desc    Delete recipe
 * @route   DELETE /api/recipes/:id
 * @access  Public (for admin purposes)
 * Requirements: 1.4, 1.5
 */
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: 'Recipe not found'
    });
  }
  
  await Recipe.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {},
    message: 'Recipe deleted successfully'
  });
});

/**
 * @desc    Search recipes by name or ingredients
 * @route   GET /api/recipes/search
 * @access  Public
 * Requirements: 1.1, 1.5
 */
const searchRecipes = asyncHandler(async (req, res) => {
  const { q: query, budget, servings } = req.query;
  
  if (!query || !query.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  // Build search query
  const searchQuery = {
    $or: [
      { name: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } },
      { 'ingredients.name': { $regex: query.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(query.trim(), 'i')] } },
      { category: { $regex: query.trim(), $options: 'i' } },
      { cuisine: { $regex: query.trim(), $options: 'i' } }
    ]
  };
  
  let recipes = await Recipe.find(searchQuery)
    .select('-__v')
    .sort({ createdAt: -1 });
  
  // Apply budget filtering if provided
  if (budget && !isNaN(budget)) {
    const budgetAmount = parseFloat(budget);
    const targetServings = servings && !isNaN(servings) ? parseInt(servings) : null;
    
    recipes = recipes.filter(recipe => {
      if (targetServings) {
        const originalServings = parseInt(recipe.servings.toString().match(/\d+/)?.[0] || '1');
        const scaleFactor = targetServings / originalServings;
        const scaledTotalCost = recipe.totalCost * scaleFactor;
        return scaledTotalCost <= budgetAmount;
      } else {
        return recipe.totalCost <= budgetAmount;
      }
    });
    
    // Sort by cost efficiency
    recipes.sort((a, b) => {
      const aServings = parseInt(a.servings.toString().match(/\d+/)?.[0] || '1');
      const bServings = parseInt(b.servings.toString().match(/\d+/)?.[0] || '1');
      const aCostPerServing = a.totalCost / aServings;
      const bCostPerServing = b.totalCost / bServings;
      return aCostPerServing - bCostPerServing;
    });
  }
  
  res.status(200).json({
    success: true,
    count: recipes.length,
    query: query.trim(),
    data: recipes
  });
});

/**
 * @desc    Filter recipes by budget and serving size with PHP currency
 * @route   GET /api/recipes/filter
 * @access  Public
 * @query   ?budget=amount&servings=number&minBudget=amount&maxBudget=amount
 * Requirements: 2.3, 2.4, 3.1, 3.4
 */
const getRecipesByBudgetAndServings = asyncHandler(async (req, res) => {
  const { budget, servings, minBudget, maxBudget } = req.query;
  
  // Validate parameters
  const budgetAmount = budget ? parseFloat(budget) : null;
  const targetServings = servings ? parseInt(servings) : null;
  const minBudgetAmount = minBudget ? parseFloat(minBudget) : null;
  const maxBudgetAmount = maxBudget ? parseFloat(maxBudget) : null;
  
  // Validate budget and servings using RecipeScaler
  if (budgetAmount !== null || targetServings !== null) {
    const validation = RecipeScaler.validateParameters(budgetAmount, targetServings);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }
  }
  
  // Validate budget range parameters
  if (minBudgetAmount !== null && (typeof minBudgetAmount !== 'number' || minBudgetAmount < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Minimum budget must be a positive number'
    });
  }
  
  if (maxBudgetAmount !== null && (typeof maxBudgetAmount !== 'number' || maxBudgetAmount < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Maximum budget must be a positive number'
    });
  }
  
  if (minBudgetAmount !== null && maxBudgetAmount !== null && minBudgetAmount > maxBudgetAmount) {
    return res.status(400).json({
      success: false,
      error: 'Minimum budget cannot be greater than maximum budget'
    });
  }
  
  try {
    // Get all recipes from database
    const recipes = await Recipe.find().select('-__v');
    
    let filteredRecipes;
    
    if (budgetAmount !== null && targetServings !== null) {
      // Filter by exact budget and servings
      filteredRecipes = RecipeScaler.filterRecipesByBudgetAndServings(
        recipes, 
        budgetAmount, 
        targetServings
      );
    } else if (minBudgetAmount !== null || maxBudgetAmount !== null) {
      // Filter by budget range
      filteredRecipes = RecipeScaler.filterRecipesByBudgetRange(
        recipes,
        minBudgetAmount,
        maxBudgetAmount,
        targetServings
      );
    } else {
      // No filtering, return all recipes with cost calculations
      filteredRecipes = recipes.map(recipe => ({
        ...recipe.toObject(),
        costPerServing: RecipeScaler.calculateCostPerServing(recipe, targetServings)
      }));
    }
    
    // Format response with PHP currency precision
    const formattedRecipes = filteredRecipes.map(recipe => ({
      ...recipe,
      totalCost: RecipeScaler.roundToPHP(recipe.scaledTotalCost || recipe.totalCost),
      costPerServing: RecipeScaler.roundToPHP(recipe.costPerServing),
      formattedTotalCost: RecipeScaler.formatPHP(recipe.scaledTotalCost || recipe.totalCost),
      formattedCostPerServing: RecipeScaler.formatPHP(recipe.costPerServing)
    }));
    
    res.status(200).json({
      success: true,
      count: formattedRecipes.length,
      filters: {
        budget: budgetAmount,
        servings: targetServings,
        minBudget: minBudgetAmount,
        maxBudget: maxBudgetAmount
      },
      data: formattedRecipes
    });
  } catch (error) {
    console.error('Error filtering recipes:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while filtering recipes'
    });
  }
});

/**
 * @desc    Get recipe scaled to specific serving size with PHP costs
 * @route   GET /api/recipes/:id/servings/:servings
 * @access  Public
 * Requirements: 2.3, 2.4, 3.1, 3.4
 */
const getRecipeByIdWithServings = asyncHandler(async (req, res) => {
  const { id, servings } = req.params;
  
  // Validate servings parameter
  const targetServings = parseInt(servings);
  const validation = RecipeScaler.validateParameters(null, targetServings);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.errors.join(', ')
    });
  }
  
  try {
    // Get recipe from database
    const recipe = await Recipe.findById(id).select('-__v');
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }
    
    // Scale recipe to target servings
    const scaledRecipe = RecipeScaler.scaleRecipeToServings(recipe, targetServings);
    
    // Get detailed cost breakdown
    const costBreakdown = RecipeScaler.getIngredientCostBreakdown(recipe, targetServings);
    
    // Format response with PHP currency
    const formattedRecipe = {
      ...scaledRecipe,
      totalCost: RecipeScaler.roundToPHP(scaledRecipe.totalCost),
      costPerServing: RecipeScaler.roundToPHP(scaledRecipe.costPerServing),
      formattedTotalCost: RecipeScaler.formatPHP(scaledRecipe.totalCost),
      formattedCostPerServing: RecipeScaler.formatPHP(scaledRecipe.costPerServing),
      ingredients: scaledRecipe.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: RecipeScaler.roundToPHP(ingredient.quantity),
        totalCost: RecipeScaler.roundToPHP(ingredient.totalCost),
        formattedTotalCost: RecipeScaler.formatPHP(ingredient.totalCost),
        formattedCostPerUnit: RecipeScaler.formatPHP(ingredient.costPerUnit)
      })),
      costBreakdown: {
        ...costBreakdown,
        scaledTotalCost: RecipeScaler.roundToPHP(costBreakdown.scaledTotalCost),
        costPerServing: RecipeScaler.roundToPHP(costBreakdown.costPerServing),
        formattedScaledTotalCost: RecipeScaler.formatPHP(costBreakdown.scaledTotalCost),
        formattedCostPerServing: RecipeScaler.formatPHP(costBreakdown.costPerServing),
        ingredients: costBreakdown.ingredients.map(ingredient => ({
          ...ingredient,
          scaledTotalCost: RecipeScaler.roundToPHP(ingredient.scaledTotalCost),
          formattedScaledTotalCost: RecipeScaler.formatPHP(ingredient.scaledTotalCost)
        }))
      }
    };
    
    res.status(200).json({
      success: true,
      data: formattedRecipe
    });
  } catch (error) {
    console.error('Error scaling recipe:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while scaling recipe'
    });
  }
});

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
  getRecipesByBudgetAndServings,
  getRecipeByIdWithServings
};