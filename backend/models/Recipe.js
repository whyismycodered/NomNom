const mongoose = require('mongoose');

/**
 * Ingredient schema for recipe ingredients with validation
 * Implements Requirements 4.1, 4.2: Data schema validation for ingredients
 */
const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    minlength: [1, 'Ingredient name cannot be empty'],
    maxlength: [100, 'Ingredient name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Ingredient quantity is required'],
    min: [0, 'Ingredient quantity cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Ingredient quantity must be a valid positive number'
    }
  },
  unit: {
    type: String,
    required: [true, 'Ingredient unit is required'],
    enum: {
      values: ['cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves', 'ml', 'liters', 'cup', 'large', 'clove', 'scallion', 'pc', 'bunch', 'pack', 'head', 'stalk', 'sprigs'],
      message: 'Invalid unit. Allowed units: cups, tbsp, tsp, lbs, oz, grams, kg, pieces, cloves, ml, liters, cup, large, clove, scallion, pc, bunch, pack, head, stalk, sprigs'
    }
  },
  costPerUnit: {
    type: Number,
    required: [true, 'Cost per unit is required'],
    min: [0, 'Cost per unit cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Cost per unit must be a valid positive number'
    }
  },
  totalCost: {
    type: Number,
    default: function() {
      return Math.round((this.quantity * this.costPerUnit) * 100) / 100;
    },
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Total cost must be a valid positive number'
    }
  }
}, {
  _id: false // Prevent automatic _id generation for subdocuments
});

/**
 * Instruction step schema for recipe instructions
 */
const instructionSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: [true, 'Step number is required'],
    min: [1, 'Step number must be at least 1']
  },
  description: {
    type: String,
    required: [true, 'Step description is required'],
    trim: true,
    minlength: [1, 'Step description cannot be empty'],
    maxlength: [500, 'Step description cannot exceed 500 characters']
  }
}, {
  _id: false
});

/**
 * Recipe schema with comprehensive validation
 * Implements Requirements 4.1, 4.2, 4.3, 4.5: Recipe data structure and validation
 */
const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    minlength: [1, 'Recipe name cannot be empty'],
    maxlength: [200, 'Recipe name cannot exceed 200 characters'],
    index: true // Index for faster searches
  },
  description: {
    type: String,
    required: [true, 'Recipe description is required'],
    trim: true,
    minlength: [1, 'Recipe description cannot be empty'],
    maxlength: [1000, 'Recipe description cannot exceed 1000 characters']
  },
  ingredients: {
    type: [ingredientSchema],
    required: [true, 'Recipe must have at least one ingredient'],
    validate: {
      validator: function(ingredients) {
        return Array.isArray(ingredients) && ingredients.length > 0;
      },
      message: 'Recipe must have at least one ingredient'
    }
  },
  instructions: {
    type: [instructionSchema],
    default: [],
    validate: {
      validator: function(instructions) {
        if (!Array.isArray(instructions)) return false;
        
        // Check for duplicate step numbers
        const stepNumbers = instructions.map(inst => inst.step);
        const uniqueSteps = new Set(stepNumbers);
        return stepNumbers.length === uniqueSteps.size;
      },
      message: 'Instruction steps must have unique step numbers'
    }
  },
  servings: {
    type: String,
    required: [true, 'Number of servings is required'],
    trim: true,
    minlength: [1, 'Servings cannot be empty'],
    maxlength: [20, 'Servings description cannot exceed 20 characters']
  },
  totalCost: {
    type: Number,
    default: function() {
      if (!this.ingredients || !Array.isArray(this.ingredients)) return 0;
      const total = this.ingredients.reduce((sum, ingredient) => {
        const ingredientCost = ingredient.totalCost || (ingredient.quantity * ingredient.costPerUnit);
        return sum + ingredientCost;
      }, 0);
      return Math.round(total * 100) / 100;
    },
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Total cost must be a valid positive number'
    }
  },
  prepTime: {
    type: Number,
    min: [0, 'Preparation time cannot be negative'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || (Number.isInteger(value) && value >= 0);
      },
      message: 'Preparation time must be a non-negative integer (minutes)'
    }
  },
  cookTime: {
    type: Number,
    min: [0, 'Cooking time cannot be negative'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || (Number.isInteger(value) && value >= 0);
      },
      message: 'Cooking time must be a non-negative integer (minutes)'
    }
  },
  difficulty: {
    type: String,
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: 'Difficulty must be Easy, Medium, or Hard'
    },
    default: 'Medium'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  cuisine: {
    type: String,
    trim: true,
    maxlength: [50, 'Cuisine cannot exceed 50 characters']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return Array.isArray(tags) && tags.every(tag => 
          typeof tag === 'string' && tag.trim().length > 0 && tag.length <= 30
        );
      },
      message: 'Tags must be non-empty strings with maximum 30 characters each'
    }
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

/**
 * Virtual for total cooking time (prep + cook)
 */
recipeSchema.virtual('totalTime').get(function() {
  const prep = this.prepTime || 0;
  const cook = this.cookTime || 0;
  return prep + cook;
});

/**
 * Virtual for cost per serving
 */
recipeSchema.virtual('costPerServing').get(function() {
  if (!this.servings) return 0;
  
  // Try to extract numeric value from servings string
  const numericServings = parseInt(this.servings.toString().match(/\d+/)?.[0] || '1');
  if (numericServings === 0) return 0;
  
  return Math.round((this.totalCost / numericServings) * 100) / 100;
});

/**
 * Pre-save middleware to recalculate costs
 * Ensures data consistency before saving
 */
recipeSchema.pre('save', function(next) {
  try {
    // Recalculate ingredient total costs
    if (this.ingredients && Array.isArray(this.ingredients)) {
      this.ingredients.forEach(ingredient => {
        if (ingredient.quantity !== undefined && ingredient.costPerUnit !== undefined) {
          ingredient.totalCost = Math.round((ingredient.quantity * ingredient.costPerUnit) * 100) / 100;
        }
      });
      
      // Recalculate recipe total cost
      this.totalCost = this.ingredients.reduce((sum, ingredient) => {
        return sum + (ingredient.totalCost || 0);
      }, 0);
      this.totalCost = Math.round(this.totalCost * 100) / 100;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Static method to find recipes within budget range
 * @param {number} minBudget - Minimum budget
 * @param {number} maxBudget - Maximum budget
 * @returns {Promise<Array>} Array of recipes within budget
 */
recipeSchema.statics.findByBudgetRange = function(minBudget, maxBudget) {
  return this.find({
    totalCost: {
      $gte: minBudget || 0,
      $lte: maxBudget || Number.MAX_SAFE_INTEGER
    }
  }).sort({ totalCost: 1 });
};

/**
 * Instance method to check if recipe fits within budget
 * @param {number} budget - Target budget
 * @returns {boolean} True if recipe fits within budget
 */
recipeSchema.methods.fitsWithinBudget = function(budget) {
  return this.totalCost <= budget;
};

/**
 * Instance method to get recipe summary
 * @returns {Object} Recipe summary with key information
 */
recipeSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    servings: this.servings,
    totalCost: this.totalCost,
    costPerServing: this.costPerServing,
    totalTime: this.totalTime,
    difficulty: this.difficulty,
    ingredientCount: this.ingredients ? this.ingredients.length : 0
  };
};

// Create indexes for better query performance
recipeSchema.index({ name: 'text', description: 'text' }); // Text search
recipeSchema.index({ totalCost: 1 }); // Budget queries
recipeSchema.index({ difficulty: 1 }); // Filter by difficulty
recipeSchema.index({ createdAt: -1 }); // Sort by creation date

// Ensure unique recipe names (Requirements 4.5)
recipeSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);