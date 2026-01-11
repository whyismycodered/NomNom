/**
 * Recipe Data Transformer Utility
 * Converts backend recipe data to frontend component format
 * Handles image key mapping, ingredient/procedure formatting, and cost calculations
 * 
 * Requirements: 2.3, 4.2, 4.3
 */

export class RecipeTransformer {
  /**
   * Transform all recipes from backend format to frontend MealCard format
   * @param {Object} backendData - Backend API response with recipes array
   * @param {number} targetServings - Target serving size for cost calculations (default: 4)
   * @returns {Array} - Array of transformed recipes for MealCard components
   */
  static transformAllRecipes(backendData, targetServings = 4) {
    if (!backendData?.data || !Array.isArray(backendData.data)) {
      console.warn('Invalid backend data structure for transformAllRecipes');
      return [];
    }

    return backendData.data.map(recipe => {
      try {
        // Calculate cost for target servings
        const originalServings = this.parseServings(recipe.servings);
        const scaleFactor = targetServings / originalServings;
        const scaledTotalCost = recipe.totalCost * scaleFactor;
        const costPerServing = scaledTotalCost / targetServings;

        return {
          id: recipe._id || recipe.id || `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: recipe.name,
          desc: recipe.description,
          totalCost: Math.round(scaledTotalCost * 100) / 100,
          costPerServing: Math.round(costPerServing * 100) / 100,
          price: Math.round(scaledTotalCost * 100) / 100, // Legacy field for MealCard compatibility
          servings: targetServings,
          originalServings: originalServings,
          scaleFactor: Math.round(scaleFactor * 100) / 100,
          // Map to existing image system
          imgKey: this.generateImageKey(recipe.name),
          img: this.getImageSource(recipe.name, recipe.imageUrl),
          // Transform ingredients for MealView compatibility
          ingredients: this.transformIngredients(recipe.ingredients, scaleFactor),
          procedures: this.transformProcedures(recipe.instructions)
        };
      } catch (error) {
        console.error(`Error transforming recipe ${recipe.name}:`, error);
        // Return a basic transformed recipe to prevent complete failure
        return {
          id: recipe._id || recipe.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: recipe.name || 'Unknown Recipe',
          desc: recipe.description || 'No description available',
          totalCost: recipe.totalCost || 0,
          costPerServing: 0,
          price: recipe.totalCost || 0,
          servings: targetServings,
          originalServings: 4,
          scaleFactor: 1,
          imgKey: 'default-recipe',
          img: require('../assets/images/chicken-afritada.png'), // Fallback image
          ingredients: [],
          procedures: []
        };
      }
    });
  }

  /**
   * Transform filtered recipes from backend budget filter endpoint
   * @param {Object} backendData - Backend API response with filtered recipes
   * @returns {Array} - Array of transformed recipes with budget information
   */
  static transformFilteredRecipes(backendData) {
    if (!backendData?.data || !Array.isArray(backendData.data)) {
      console.warn('Invalid backend data structure for transformFilteredRecipes');
      return [];
    }

    return backendData.data.map(recipe => {
      try {
        return {
          id: recipe._id || recipe.id || `filtered-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: recipe.name,
          desc: recipe.description,
          price: recipe.scaledTotalCost || recipe.totalCost,
          totalCost: recipe.scaledTotalCost || recipe.totalCost,
          costPerServing: recipe.costPerServing,
          servings: recipe.targetServings || this.parseServings(recipe.servings),
          originalServings: this.parseServings(recipe.servings),
          scaleFactor: recipe.scaleFactor || 1,
          // Map to existing image system
          imgKey: this.generateImageKey(recipe.name),
          img: this.getImageSource(recipe.name, recipe.imageUrl),
          // Transform ingredients for MealView compatibility
          ingredients: this.transformIngredients(recipe.ingredients, recipe.scaleFactor || 1),
          procedures: this.transformProcedures(recipe.instructions),
          // Budget-specific fields
          isWithinBudget: recipe.isWithinBudget || false,
          formattedTotalCost: recipe.formattedTotalCost,
          formattedCostPerServing: recipe.formattedCostPerServing
        };
      } catch (error) {
        console.error(`Error transforming filtered recipe ${recipe.name}:`, error);
        return this.createFallbackRecipe(recipe);
      }
    });
  }

  /**
   * Transform scaled recipe details from backend scaling endpoint
   * @param {Object} backendData - Backend API response with scaled recipe
   * @returns {Object|null} - Transformed recipe details for MealView
   */
  static transformScaledRecipe(backendData) {
    if (!backendData?.data) {
      console.warn('Invalid backend data structure for transformScaledRecipe');
      return null;
    }

    const recipe = backendData.data;
    
    try {
      return {
        id: recipe._id || recipe.id || `scaled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: recipe.name,
        desc: recipe.description,
        totalCost: recipe.totalCost,
        costPerServing: recipe.costPerServing,
        servings: recipe.servings,
        originalServings: this.parseServings(recipe.servings),
        scaleFactor: recipe.scaleFactor,
        imgKey: this.generateImageKey(recipe.name),
        img: recipe.imageUrl || null,
        // Transform ingredients with detailed cost information
        ingredients: this.transformScaledIngredients(recipe.ingredients),
        procedures: this.transformDetailedProcedures(recipe.instructions),
        // Additional cost breakdown information
        formattedTotalCost: recipe.formattedTotalCost,
        formattedCostPerServing: recipe.formattedCostPerServing,
        costBreakdown: recipe.costBreakdown
      };
    } catch (error) {
      console.error(`Error transforming scaled recipe ${recipe.name}:`, error);
      return null;
    }
  }

  /**
   * Parse servings string to extract numeric value
   * @param {string|number} servings - Servings value from backend
   * @returns {number} - Numeric serving count
   */
  static parseServings(servings) {
    if (typeof servings === 'number') {
      return servings;
    }
    
    if (typeof servings === 'string') {
      // Extract first number from string like "4 servings" or "serves 4"
      const match = servings.match(/\d+/);
      return match ? parseInt(match[0]) : 4;
    }
    
    return 4; // Default fallback
  }

  /**
   * Generate image key for existing frontend asset mapping
   * @param {string} recipeName - Recipe name
   * @returns {string} - Image key for asset mapping
   */
  static generateImageKey(recipeName) {
    if (!recipeName || typeof recipeName !== 'string') {
      return 'chicken-afritada';
    }

    // Map recipe names to existing image keys - COMPLETE MAPPING
    const nameMap = {
      // Exact matches from backend data
      'salmon sinigang': 'Sinigang-salmon',
      'filipino pancit bihon': 'Pancit-Bihon',
      'lumpia shanghai': 'Shanghai',
      'filipino chicken adobo': 'Chicken-adobo',
      'sinangag (filipino garlic fried rice)': 'Sinangag',
      'ginataan na sugpo (prawns with coconut milk)': 'Ginataan-sugpo',
      'mechado (filipino beef stew)': 'Mechado',
      'filipino chicken inasal': 'Chicken-inasal',
      'bola-bola (filipino meatballs)': 'Bola-Bola',
      'filipino spaghetti': 'Spaghetti',
      'filipino beef short ribs adobo': 'Beef-Short-Ribs',
      'lumpiang sariwa (fresh lumpia)': 'Lumpiang_sariwa',
      'sinigang (pork ribs)': 'sinigang-pork-ribs',
      'picadillo': 'Picadillo',
      'bistek (beef marinated with calamansi, soy and onions)': 'Bistek',
      
      // Alternative name variations
      'chicken adobo': 'Chicken-adobo',
      'adobo': 'Adobo',
      'pancit bihon': 'Pancit-Bihon',
      'pancit': 'Pancit-Bihon',
      'lumpia': 'Shanghai',
      'shanghai': 'Shanghai',
      'lumpiang shanghai': 'Shanghai',
      'sinangag': 'Sinangag',
      'fried rice': 'Sinangag',
      'garlic fried rice': 'Sinangag',
      'sinigang': 'Sinigang-salmon',
      'salmon sinigang': 'Sinigang-salmon',
      'pork sinigang': 'sinigang-pork-ribs',
      'sinigang pork ribs': 'sinigang-pork-ribs',
      'prawns with coconut milk': 'Ginataan-sugpo',
      'ginataan': 'Ginataan-sugpo',
      'ginataan na sugpo': 'Ginataan-sugpo',
      'mechado': 'Mechado',
      'beef stew': 'Mechado',
      'chicken inasal': 'Chicken-inasal',
      'inasal': 'Chicken-inasal',
      'bola bola': 'Bola-Bola',
      'meatballs': 'Bola-Bola',
      'filipino meatballs': 'Bola-Bola',
      'spaghetti': 'Spaghetti',
      'filipino spaghetti': 'Spaghetti',
      'beef short ribs': 'Beef-Short-Ribs',
      'short ribs adobo': 'Beef-Short-Ribs',
      'beef short ribs adobo': 'Beef-Short-Ribs',
      'lumpiang sariwa': 'Lumpiang_sariwa',
      'fresh lumpia': 'Lumpiang_sariwa',
      'bistek': 'Bistek',
      'beef steak': 'Bistek',
      'filipino beef steak': 'Bistek',
      
      // Legacy mappings for backward compatibility
      'chicken afritada': 'chicken-afritada',
      'fried bangus': 'fried-bangus',
      'pork adobo': 'pork-adobo',
      'beef mechado': 'beef-mechado'
    };

    const key = recipeName.toLowerCase().trim();
    return nameMap[key] || 'chicken-afritada'; // Default to chicken-afritada
  }

  /**
   * Get image source for recipe (local asset or remote URL)
   * @param {string} recipeName - Recipe name
   * @param {string} imageUrl - Optional remote image URL
   * @returns {Object|string} - Image source for React Native Image component
   */
  static getImageSource(recipeName, imageUrl) {
    // If remote URL is provided and valid, use it
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }

    // Map to local assets based on recipe name
    // In testing environment, return a mock path
    if (typeof require === 'undefined') {
      return `../assets/images/${this.generateImageKey(recipeName)}.png`;
    }

    const imageMap = {
      // New recipe images
      'Sinigang-salmon': require('../assets/images/Sinigang-salmon.png'),
      'Pancit-Bihon': require('../assets/images/Pancit-Bihon.png'),
      'Shanghai': require('../assets/images/Shanghai.png'),
      'Chicken-adobo': require('../assets/images/Chicken-adobo.png'),
      'Adobo': require('../assets/images/Adobo.png'),
      'Sinangag': require('../assets/images/Sinangag.png'),
      'Ginataan-sugpo': require('../assets/images/Ginataan-sugpo.png'),
      'Mechado': require('../assets/images/Mechado.png'),
      'Bistek': require('../assets/images/Bistek.png'),
      'Beef-Short-Ribs': require('../assets/images/Beef-Short-Ribs.png'),
      'Bola-Bola': require('../assets/images/Bola-Bola.png'),
      'Chicken-inasal': require('../assets/images/Chicken-inasal.png'),
      'Lumpiang_sariwa': require('../assets/images/Lumpiang_sariwa.png'),
      'Picadillo': require('../assets/images/Picadillo.png'),
      'Spaghetti': require('../assets/images/Spaghetti.png'),
      'sinigang-pork-ribs': require('../assets/images/sinigang-pork-ribs.png'),
      
      // Legacy images
      'chicken-afritada': require('../assets/images/chicken-afritada.png'),
      'fried-bangus': require('../assets/images/fried-bangus.png'),
      'pork-adobo': require('../assets/images/pork-adobo.png'),
      'beef-mechado': require('../assets/images/beef-mechado.png'),
      'lumpiang-shanghai': require('../assets/images/lumpiang-shanghai.png'),
    };

    const imgKey = this.generateImageKey(recipeName);
    return imageMap[imgKey] || imageMap['chicken-afritada']; // Default fallback
  }

  /**
   * Transform ingredients array for MealView display
   * @param {Array} ingredients - Backend ingredients array
   * @param {number} scaleFactor - Scaling factor for quantities
   * @returns {Array} - Array of formatted ingredient strings
   */
  static transformIngredients(ingredients, scaleFactor = 1) {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    return ingredients.map(ingredient => {
      try {
        const scaledQuantity = ingredient.quantity * scaleFactor;
        const roundedQuantity = Math.round(scaledQuantity * 100) / 100;
        
        // Format quantity to avoid unnecessary decimals
        const formattedQuantity = roundedQuantity % 1 === 0 
          ? roundedQuantity.toString() 
          : roundedQuantity.toFixed(2).replace(/\.?0+$/, '');

        return `${formattedQuantity} ${ingredient.unit} ${ingredient.name}`;
      } catch (error) {
        console.error('Error transforming ingredient:', ingredient, error);
        return `${ingredient.name || 'Unknown ingredient'}`;
      }
    });
  }

  /**
   * Transform scaled ingredients with detailed cost information
   * @param {Array} ingredients - Backend scaled ingredients array
   * @returns {Array} - Array of detailed ingredient objects
   */
  static transformScaledIngredients(ingredients) {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    return ingredients.map((ingredient, index) => {
      try {
        const roundedQuantity = Math.round(ingredient.quantity * 100) / 100;
        const formattedQuantity = roundedQuantity % 1 === 0 
          ? roundedQuantity.toString() 
          : roundedQuantity.toFixed(2).replace(/\.?0+$/, '');

        return {
          name: ingredient.name,
          quantity: roundedQuantity,
          unit: ingredient.unit,
          cost: ingredient.totalCost,
          costPerUnit: ingredient.costPerUnit,
          displayText: `${formattedQuantity} ${ingredient.unit} ${ingredient.name} - ₱${ingredient.totalCost.toFixed(2)}`,
          formattedCost: ingredient.formattedTotalCost || `₱${ingredient.totalCost.toFixed(2)}`
        };
      } catch (error) {
        console.error('Error transforming scaled ingredient:', ingredient, error);
        return {
          name: ingredient.name || 'Unknown ingredient',
          quantity: 0,
          unit: '',
          cost: 0,
          displayText: ingredient.name || 'Unknown ingredient',
          formattedCost: '₱0.00'
        };
      }
    });
  }

  /**
   * Transform instructions array for MealView display
   * @param {Array} instructions - Backend instructions array
   * @returns {Array} - Array of procedure strings
   */
  static transformProcedures(instructions) {
    if (!Array.isArray(instructions)) {
      return [];
    }

    return instructions
      .sort((a, b) => (a.step || 0) - (b.step || 0)) // Sort by step number
      .map(instruction => instruction.description || instruction.toString());
  }

  /**
   * Transform instructions with detailed step information
   * @param {Array} instructions - Backend instructions array
   * @returns {Array} - Array of detailed procedure objects
   */
  static transformDetailedProcedures(instructions) {
    if (!Array.isArray(instructions)) {
      return [];
    }

    return instructions
      .sort((a, b) => (a.step || 0) - (b.step || 0))
      .map((instruction, index) => ({
        step: instruction.step || (index + 1),
        description: instruction.description || instruction.toString()
      }));
  }

  /**
   * Create a fallback recipe object when transformation fails
   * @param {Object} recipe - Original recipe data
   * @returns {Object} - Basic fallback recipe
   */
  static createFallbackRecipe(recipe) {
    return {
      id: recipe._id || recipe.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: recipe.name || 'Unknown Recipe',
      desc: recipe.description || 'No description available',
      totalCost: recipe.totalCost || 0,
      costPerServing: 0,
      price: recipe.totalCost || 0,
      servings: 4,
      originalServings: 4,
      scaleFactor: 1,
      imgKey: 'chicken-afritada',
      img: typeof require !== 'undefined' 
        ? require('../assets/images/chicken-afritada.png')
        : '../assets/images/chicken-afritada.png',
      ingredients: [],
      procedures: [],
      isWithinBudget: false,
      formattedTotalCost: '₱0.00',
      formattedCostPerServing: '₱0.00'
    };
  }

  /**
   * Validate transformed recipe data structure
   * @param {Object} recipe - Transformed recipe object
   * @returns {boolean} - True if recipe has required fields
   */
  static validateTransformedRecipe(recipe) {
    const requiredFields = ['id', 'name', 'desc', 'totalCost', 'costPerServing', 'servings'];
    
    return requiredFields.every(field => {
      const hasField = recipe.hasOwnProperty(field) && recipe[field] !== undefined;
      if (!hasField) {
        console.warn(`Transformed recipe missing required field: ${field}`);
      }
      return hasField;
    });
  }

  /**
   * Format PHP currency value
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  static formatPHP(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₱0.00';
    }
    
    return `₱${amount.toFixed(2)}`;
  }

  /**
   * Round to PHP currency precision (2 decimal places)
   * @param {number} amount - Amount to round
   * @returns {number} - Rounded amount
   */
  static roundToPHP(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 0;
    }
    
    return Math.round(amount * 100) / 100;
  }
}

export default RecipeTransformer;