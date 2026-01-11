# Design Document: Recipe API Backend

## Overview

The Recipe API Backend is a Node.js/Express REST API that serves recipe data to a React Native mobile application. The system implements a clean MVC architecture with MongoDB for data persistence, providing endpoints for recipe browsing and budget-based ingredient optimization. The design prioritizes mobile client compatibility, particularly Android emulator connectivity, while maintaining scalable and maintainable code structure.

## Architecture

### System Architecture

The backend follows a layered MVC architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Client │────│   Express API   │────│   MongoDB       │
│   (React Native)│    │   (Controllers) │    │   (Models)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Business      │
                       │   Logic Layer   │
                       └─────────────────┘
```

### Directory Structure

```
server/
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── config/
│   └── database.js           # MongoDB connection configuration
├── models/
│   └── Recipe.js             # Mongoose recipe schema
├── routes/
│   ├── recipeRoutes.js       # Recipe CRUD endpoints
│   └── budgetRoutes.js       # Budget optimization endpoints
├── controllers/
│   ├── recipeController.js   # Recipe business logic
│   └── budgetController.js   # Budget optimization logic
├── middleware/
│   ├── cors.js               # CORS configuration
│   └── errorHandler.js       # Global error handling
└── utils/
    └── budgetOptimizer.js    # Budget calculation utilities
```

## Components and Interfaces

### Express Server Configuration

The main server configuration handles CORS, middleware setup, and route registration:

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for Android emulator
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://10.0.2.2:3000',  // Android emulator
    'http://192.168.1.*',    // Local network
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe-app')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Android emulator can access via: http://10.0.2.2:${PORT}`);
});
```

### Recipe Model Schema

The Recipe model defines the data structure with detailed ingredient information:

```javascript
// models/Recipe.js
const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves']
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.quantity * this.costPerUnit;
    }
  }
});

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [ingredientSchema],
  instructions: [{
    step: Number,
    description: String
  }],
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    }
  },
  prepTime: Number, // minutes
  cookTime: Number, // minutes
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
```

### Route Definitions

Recipe routes handle CRUD operations and filtering:

```javascript
// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// GET /api/recipes - Fetch all recipes
router.get('/', recipeController.getAllRecipes);

// GET /api/recipes/filter?budget=20&servings=4 - Filter recipes by budget and servings
router.get('/filter', recipeController.getRecipesByBudgetAndServings);

// GET /api/recipes/:id - Fetch single recipe (original servings)
router.get('/:id', recipeController.getRecipeById);

// GET /api/recipes/:id/servings/:servings - Fetch recipe scaled to target servings
router.get('/:id/servings/:servings', recipeController.getRecipeByIdWithServings);

// POST /api/recipes - Create new recipe (for admin/seeding)
router.post('/', recipeController.createRecipe);

// PUT /api/recipes/:id - Update recipe
router.put('/:id', recipeController.updateRecipe);

// DELETE /api/recipes/:id - Delete recipe
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;
```

## Recipe Filtering and Scaling Logic

### Budget and Serving Size Filtering

The system uses mathematical calculations to filter recipes based on user budget and serving requirements, and scales recipe details when displaying individual recipes.

```javascript
// utils/recipeScaler.js
class RecipeScaler {
  /**
   * Filter recipes that fit within budget and serving constraints
   * @param {Array} recipes - Array of recipe objects
   * @param {number} budget - User's budget
   * @param {number} targetServings - Target number of servings
   * @returns {Array} Filtered and sorted recipes with cost calculations
   */
  static filterRecipesByBudgetAndServings(recipes, budget, targetServings) {
    const filteredRecipes = recipes
      .map(recipe => {
        const originalServings = this.parseServings(recipe.servings);
        const scaleFactor = targetServings / originalServings;
        const scaledTotalCost = recipe.totalCost * scaleFactor;
        const costPerServing = scaledTotalCost / targetServings;
        
        return {
          ...recipe.toObject(),
          scaledTotalCost: Math.round(scaledTotalCost * 100) / 100,
          costPerServing: Math.round(costPerServing * 100) / 100,
          scaleFactor,
          targetServings,
          fitsInBudget: scaledTotalCost <= budget
        };
      })
      .filter(recipe => recipe.fitsInBudget)
      .sort((a, b) => a.costPerServing - b.costPerServing); // Sort by cost efficiency
    
    return filteredRecipes;
  }
  
  /**
   * Scale a recipe to target serving size
   * @param {Object} recipe - Recipe object
   * @param {number} targetServings - Target number of servings
   * @returns {Object} Scaled recipe with adjusted ingredients and costs
   */
  static scaleRecipeToServings(recipe, targetServings) {
    const originalServings = this.parseServings(recipe.servings);
    
    if (originalServings === targetServings) {
      return {
        ...recipe.toObject(),
        scaleFactor: 1,
        costPerServing: Math.round((recipe.totalCost / originalServings) * 100) / 100
      };
    }
    
    const scaleFactor = targetServings / originalServings;
    
    // Scale ingredients
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: Math.round((ingredient.quantity * scaleFactor) * 100) / 100,
      totalCost: Math.round((ingredient.totalCost * scaleFactor) * 100) / 100
    }));
    
    const scaledTotalCost = Math.round((recipe.totalCost * scaleFactor) * 100) / 100;
    const costPerServing = Math.round((scaledTotalCost / targetServings) * 100) / 100;
    
    return {
      ...recipe.toObject(),
      ingredients: scaledIngredients,
      totalCost: scaledTotalCost,
      servings: targetServings.toString(),
      scaleFactor: Math.round(scaleFactor * 100) / 100,
      costPerServing,
      originalServings
    };
  }
  
  /**
   * Parse servings string to extract numeric value
   * @param {string} servingsString - Servings description (e.g., "4 people", "6")
   * @returns {number} Numeric serving count
   */
  static parseServings(servingsString) {
    const match = servingsString.toString().match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }
  
  /**
   * Calculate cost per serving for a recipe
   * @param {Object} recipe - Recipe object
   * @param {number} servings - Number of servings (optional, uses recipe default)
   * @returns {number} Cost per serving
   */
  static calculateCostPerServing(recipe, servings = null) {
    const actualServings = servings || this.parseServings(recipe.servings);
    return Math.round((recipe.totalCost / actualServings) * 100) / 100;
  }
}

module.exports = RecipeScaler;
```

## Currency and Pricing

### Philippine Peso (PHP) Implementation

All monetary values in the system are stored and calculated in Philippine Peso (PHP):

**Database Storage:**
- All `costPerUnit` and `totalCost` fields store PHP amounts as decimal numbers
- No currency symbols stored in database (just numeric values)
- Example: `costPerUnit: 203.57` represents ₱203.57

**API Responses:**
- All cost calculations return PHP amounts
- Frontend should format with ₱ symbol for display
- Budget filtering uses PHP amounts directly

**Example Recipe Costs (PHP):**
```javascript
{
  "name": "Sinangag (Filipino Garlic Fried Rice)",
  "totalCost": 32.53,           // ₱32.53 total
  "costPerServing": 8.13,       // ₱8.13 per person
  "ingredients": [
    {
      "name": "garlic",
      "costPerUnit": 327.48,     // ₱327.48 per kg
      "totalCost": 13.10         // ₱13.10 for this recipe
    }
  ]
}
```

**Budget Examples:**
- Low budget: ₱50-100 per meal
- Medium budget: ₱200-400 per meal  
- High budget: ₱500+ per meal

**Cost Per Serving Ranges:**
- Very affordable: ₱10-25 per person
- Moderate: ₱50-100 per person
- Premium: ₱150+ per person

Now I need to analyze the acceptance criteria for testability before writing the Correctness Properties section:

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated to eliminate redundancy:
- Recipe data persistence and retrieval properties can be combined into round-trip properties
- CORS and network configuration properties focus on specific examples rather than universal rules
- Budget optimization properties can be grouped by mathematical correctness vs. API behavior
- Error handling properties can be unified around consistent error response patterns

### Core Properties

**Property 1: Recipe data round-trip consistency**
*For any* valid recipe object, storing it in the database and then retrieving it should return equivalent data with all ingredient details preserved
**Validates: Requirements 1.3, 4.3**

**Property 2: Recipe API response structure consistency**
*For any* API endpoint request, the response should be valid JSON with consistent field structure and proper HTTP status codes
**Validates: Requirements 1.5, 6.2**

**Property 3: Recipe filtering accuracy by budget and servings**
*For any* set of recipes, budget amount, and target servings, the filtering algorithm should return only recipes that can be prepared within the budget when scaled to the target servings, sorted by cost efficiency
**Validates: Requirements 2.1, 2.2, 2.5**

**Property 4: Recipe scaling mathematical correctness**
*For any* recipe and target serving size, the scaling algorithm should proportionally adjust all ingredient quantities and costs while maintaining ingredient ratios and calculating accurate totals
**Validates: Requirements 3.2, 3.3, 3.5**

**Property 5: Input validation consistency**
*For any* invalid input data (missing fields, wrong types, negative values), the API should reject the request with descriptive error messages and appropriate HTTP status codes
**Validates: Requirements 1.4, 4.1, 4.2, 4.4, 6.2**

**Property 6: CORS header compliance**
*For any* cross-origin request from allowed origins, the server should include proper CORS headers in the response
**Validates: Requirements 3.4, 3.5**

**Property 7: Error handling consistency**
*For any* server error or exception, the system should log detailed information while returning sanitized error messages to clients with appropriate HTTP status codes
**Validates: Requirements 6.1, 6.3, 6.4**

**Property 8: Recipe ID uniqueness**
*For any* recipe creation or update operation, the system should ensure unique identifiers are maintained without conflicts
**Validates: Requirements 4.5**

## Error Handling

### Global Error Middleware

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Recipe not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### Controller Error Patterns

```javascript
// controllers/recipeController.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getAllRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.find().select('-__v');
  
  res.status(200).json({
    success: true,
    count: recipes.length,
    data: recipes
  });
});

const getRecipeById = asyncHandler(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);
  
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
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific API endpoint examples with known inputs/outputs
- Edge cases like empty databases, invalid IDs, network timeouts
- Integration points between Express routes and MongoDB
- CORS configuration with specific origin examples
- Error conditions and exception handling

**Property-Based Tests:**
- Universal properties across all recipe data (round-trip consistency)
- Budget optimization mathematical correctness across random inputs
- API response structure consistency across all endpoints
- Input validation behavior across all possible invalid inputs
- Error handling patterns across different error types

### Property-Based Testing Configuration

Using **fast-check** for JavaScript property-based testing:
- Minimum 100 iterations per property test
- Custom generators for recipe objects, ingredient arrays, and budget values
- Each test tagged with: **Feature: recipe-api-backend, Property {number}: {property_text}**

### Test Organization

```
server/
├── __tests__/
│   ├── unit/
│   │   ├── models/
│   │   │   └── Recipe.test.js
│   │   ├── controllers/
│   │   │   ├── recipeController.test.js
│   │   │   └── budgetController.test.js
│   │   └── utils/
│   │       └── budgetOptimizer.test.js
│   ├── integration/
│   │   ├── recipeRoutes.test.js
│   │   └── budgetRoutes.test.js
│   └── properties/
│       ├── recipeProperties.test.js
│       ├── budgetProperties.test.js
│       └── apiProperties.test.js
└── jest.config.js
```

### Testing Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "fast-check": "^3.0.0",
    "mongodb-memory-server": "^8.0.0"
  }
}
```

Property tests will validate universal correctness while unit tests handle specific examples and integration scenarios, ensuring both mathematical accuracy and API reliability.