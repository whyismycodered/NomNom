/**
 * Recipe Scaling Utility Class
 * Implements Requirements 2.1, 2.2, 2.5, 3.2, 3.3, 3.5
 * 
 * Handles recipe filtering by budget and serving size with PHP currency precision.
 * All monetary calculations maintain PHP decimal precision (2 decimal places).
 */

class RecipeScaler {
  /**
   * Filter recipes that fit within budget and serving constraints
   * @param {Array} recipes - Array of recipe objects
   * @param {number} budget - User's budget in PHP
   * @param {number} targetServings - Target number of servings
   * @returns {Array} Filtered and sorted recipes with cost calculations
   * Requirements: 2.1, 2.2, 2.5
   */
  static filterRecipesByBudgetAndServings(recipes, budget, targetServings) {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return [];
    }

    if (!budget || budget <= 0 || !targetServings || targetServings <= 0) {
      return [];
    }

    const filteredRecipes = recipes
      .map(recipe => {
        const originalServings = this.parseServings(recipe.servings);
        const scaleFactor = targetServings / originalServings;
        const scaledTotalCost = this.roundToPHP(recipe.totalCost * scaleFactor);
        const costPerServing = this.roundToPHP(scaledTotalCost / targetServings);
        
        return {
          ...recipe.toObject ? recipe.toObject() : recipe,
          scaledTotalCost,
          costPerServing,
          scaleFactor: this.roundToPHP(scaleFactor),
          targetServings,
          originalServings,
          fitsInBudget: scaledTotalCost <= budget
        };
      })
      .filter(recipe => recipe.fitsInBudget)
      .sort((a, b) => a.costPerServing - b.costPerServing); // Sort by cost efficiency
    
    return filteredRecipes;
  }
  
  /**
   * Scale a recipe to target serving size with PHP cost precision
   * @param {Object} recipe - Recipe object
   * @param {number} targetServings - Target number of servings
   * @returns {Object} Scaled recipe with adjusted ingredients and costs
   * Requirements: 3.2, 3.3, 3.5
   */
  static scaleRecipeToServings(recipe, targetServings) {
    if (!recipe || !targetServings || targetServings <= 0) {
      throw new Error('Invalid recipe or target servings');
    }

    const originalServings = this.parseServings(recipe.servings);
    
    if (originalServings === targetServings) {
      return {
        ...recipe.toObject ? recipe.toObject() : recipe,
        scaleFactor: 1,
        costPerServing: this.roundToPHP(recipe.totalCost / originalServings),
        originalServings
      };
    }
    
    const scaleFactor = targetServings / originalServings;
    
    // Scale ingredients with PHP precision
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: this.roundToPHP(ingredient.quantity * scaleFactor),
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      totalCost: this.roundToPHP(ingredient.totalCost * scaleFactor)
    }));
    
    const scaledTotalCost = this.roundToPHP(recipe.totalCost * scaleFactor);
    const costPerServing = this.roundToPHP(scaledTotalCost / targetServings);
    
    return {
      ...recipe.toObject ? recipe.toObject() : recipe,
      ingredients: scaledIngredients,
      totalCost: scaledTotalCost,
      servings: targetServings.toString(),
      scaleFactor: this.roundToPHP(scaleFactor),
      costPerServing,
      originalServings,
      targetServings
    };
  }
  
  /**
   * Parse servings string to extract numeric value
   * @param {string|number} servingsString - Servings description (e.g., "4 people", "6", "4 to 6")
   * @returns {number} Numeric serving count
   */
  static parseServings(servingsString) {
    if (typeof servingsString === 'number') {
      return servingsString;
    }
    
    if (!servingsString) {
      return 1;
    }
    
    // Handle ranges like "4 to 6" - take the first number
    const match = servingsString.toString().match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }
  
  /**
   * Calculate cost per serving for a recipe with PHP precision
   * @param {Object} recipe - Recipe object
   * @param {number} servings - Number of servings (optional, uses recipe default)
   * @returns {number} Cost per serving in PHP
   */
  static calculateCostPerServing(recipe, servings = null) {
    if (!recipe || !recipe.totalCost) {
      return 0;
    }
    
    const actualServings = servings || this.parseServings(recipe.servings);
    if (actualServings <= 0) {
      return 0;
    }
    
    return this.roundToPHP(recipe.totalCost / actualServings);
  }

  /**
   * Filter recipes by budget range with optional serving adjustment
   * @param {Array} recipes - Array of recipe objects
   * @param {number} minBudget - Minimum budget in PHP
   * @param {number} maxBudget - Maximum budget in PHP
   * @param {number} targetServings - Optional target servings for scaling
   * @returns {Array} Filtered recipes within budget range
   * Requirements: 2.1, 2.2
   */
  static filterRecipesByBudgetRange(recipes, minBudget, maxBudget, targetServings = null) {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return [];
    }

    return recipes
      .map(recipe => {
        if (targetServings) {
          const originalServings = this.parseServings(recipe.servings);
          const scaleFactor = targetServings / originalServings;
          const scaledTotalCost = this.roundToPHP(recipe.totalCost * scaleFactor);
          
          return {
            ...recipe.toObject ? recipe.toObject() : recipe,
            scaledTotalCost,
            costPerServing: this.roundToPHP(scaledTotalCost / targetServings),
            scaleFactor: this.roundToPHP(scaleFactor),
            targetServings,
            originalServings
          };
        }
        
        return {
          ...recipe.toObject ? recipe.toObject() : recipe,
          costPerServing: this.calculateCostPerServing(recipe)
        };
      })
      .filter(recipe => {
        const cost = recipe.scaledTotalCost || recipe.totalCost;
        return cost >= (minBudget || 0) && cost <= (maxBudget || Number.MAX_SAFE_INTEGER);
      })
      .sort((a, b) => (a.scaledTotalCost || a.totalCost) - (b.scaledTotalCost || b.totalCost));
  }

  /**
   * Get recipes that fit exactly within a budget for target servings
   * @param {Array} recipes - Array of recipe objects
   * @param {number} exactBudget - Exact budget amount in PHP
   * @param {number} targetServings - Target number of servings
   * @param {number} tolerance - Budget tolerance (default: 5 PHP)
   * @returns {Array} Recipes that fit within budget tolerance
   * Requirements: 2.1, 2.5
   */
  static getRecipesForExactBudget(recipes, exactBudget, targetServings, tolerance = 5) {
    if (!Array.isArray(recipes) || !exactBudget || !targetServings) {
      return [];
    }

    const minBudget = Math.max(0, exactBudget - tolerance);
    const maxBudget = exactBudget + tolerance;

    return this.filterRecipesByBudgetRange(recipes, minBudget, maxBudget, targetServings);
  }

  /**
   * Calculate ingredient cost breakdown for scaled recipe
   * @param {Object} recipe - Recipe object
   * @param {number} targetServings - Target servings
   * @returns {Object} Cost breakdown with ingredient details
   * Requirements: 3.2, 3.3
   */
  static getIngredientCostBreakdown(recipe, targetServings) {
    if (!recipe || !targetServings) {
      return null;
    }

    const originalServings = this.parseServings(recipe.servings);
    const scaleFactor = targetServings / originalServings;

    const ingredientBreakdown = recipe.ingredients.map(ingredient => {
      const scaledQuantity = this.roundToPHP(ingredient.quantity * scaleFactor);
      const scaledTotalCost = this.roundToPHP(ingredient.totalCost * scaleFactor);
      
      return {
        name: ingredient.name,
        originalQuantity: ingredient.quantity,
        scaledQuantity,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
        originalTotalCost: ingredient.totalCost,
        scaledTotalCost,
        percentageOfTotal: this.roundToPHP((scaledTotalCost / (recipe.totalCost * scaleFactor)) * 100)
      };
    });

    return {
      originalServings,
      targetServings,
      scaleFactor: this.roundToPHP(scaleFactor),
      originalTotalCost: recipe.totalCost,
      scaledTotalCost: this.roundToPHP(recipe.totalCost * scaleFactor),
      costPerServing: this.roundToPHP((recipe.totalCost * scaleFactor) / targetServings),
      ingredients: ingredientBreakdown
    };
  }

  /**
   * Round number to PHP currency precision (2 decimal places)
   * @param {number} amount - Amount to round
   * @returns {number} Rounded amount with 2 decimal places
   */
  static roundToPHP(amount) {
    if (typeof amount !== 'number' || !isFinite(amount)) {
      return 0;
    }
    return Math.round(amount * 100) / 100;
  }

  /**
   * Validate budget and serving parameters
   * @param {number} budget - Budget amount
   * @param {number} servings - Number of servings
   * @returns {Object} Validation result with errors if any
   */
  static validateParameters(budget, servings) {
    const errors = [];

    if (budget !== undefined && budget !== null) {
      if (typeof budget !== 'number' || !isFinite(budget)) {
        errors.push('Budget must be a valid number');
      } else if (budget < 0) {
        errors.push('Budget cannot be negative');
      } else if (budget > 100000) {
        errors.push('Budget cannot exceed ₱100,000');
      }
    }

    if (servings !== undefined && servings !== null) {
      if (typeof servings !== 'number' || !Number.isInteger(servings)) {
        errors.push('Servings must be a valid integer');
      } else if (servings < 1) {
        errors.push('Servings must be at least 1');
      } else if (servings > 100) {
        errors.push('Servings cannot exceed 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format PHP currency for display
   * @param {number} amount - Amount in PHP
   * @returns {string} Formatted currency string
   */
  static formatPHP(amount) {
    if (typeof amount !== 'number' || !isFinite(amount)) {
      return '₱0.00';
    }
    return `₱${amount.toFixed(2)}`;
  }
}

module.exports = RecipeScaler;