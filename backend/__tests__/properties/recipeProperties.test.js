const fc = require('fast-check');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Recipe = require('../../models/Recipe');

/**
 * Property-based tests for Recipe model data persistence
 * Feature: recipe-api-backend, Property 1: Recipe data round-trip consistency
 * Validates: Requirements 1.3, 4.3
 */

describe('Recipe Model Property Tests', () => {
  let mongoServer;
  let mongoUri;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Clear any existing data
    await Recipe.deleteMany({});
  });

  afterEach(async () => {
    // Disconnect after each test
    await mongoose.disconnect();
  });

  /**
   * Property 1: Recipe data round-trip consistency
   * For any valid recipe object, storing it in the database and then retrieving it 
   * should return equivalent data with all ingredient details preserved
   * Validates: Requirements 1.3, 4.3
   */
  test('Property 1: Recipe data round-trip consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid recipe data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          ingredients: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              unit: fc.constantFrom('cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves', 'ml', 'liters'),
              costPerUnit: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          servings: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          prepTime: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
          cookTime: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
          difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
          category: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
          cuisine: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
          tags: fc.option(
            fc.array(
              fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
              { maxLength: 5 }
            ),
            { nil: undefined }
          )
        }),
        async (recipeData) => {
          // Round numeric values to avoid floating point precision issues
          const normalizedData = {
            ...recipeData,
            ingredients: recipeData.ingredients.map(ing => ({
              ...ing,
              quantity: Math.round(ing.quantity * 100) / 100,
              costPerUnit: Math.round(ing.costPerUnit * 100) / 100
            }))
          };

          // Create and save recipe
          const originalRecipe = new Recipe(normalizedData);
          const savedRecipe = await originalRecipe.save();

          // Retrieve recipe from database
          const retrievedRecipe = await Recipe.findById(savedRecipe._id);

          // Verify recipe was retrieved successfully
          expect(retrievedRecipe).not.toBeNull();

          // Verify core fields are preserved
          expect(retrievedRecipe.name).toBe(normalizedData.name);
          expect(retrievedRecipe.description).toBe(normalizedData.description);
          expect(retrievedRecipe.servings).toBe(normalizedData.servings);
          expect(retrievedRecipe.difficulty).toBe(normalizedData.difficulty);

          // Verify optional fields are preserved
          if (normalizedData.prepTime !== undefined) {
            expect(retrievedRecipe.prepTime).toBe(normalizedData.prepTime);
          }
          if (normalizedData.cookTime !== undefined) {
            expect(retrievedRecipe.cookTime).toBe(normalizedData.cookTime);
          }
          if (normalizedData.category !== undefined) {
            expect(retrievedRecipe.category).toBe(normalizedData.category);
          }
          if (normalizedData.cuisine !== undefined) {
            expect(retrievedRecipe.cuisine).toBe(normalizedData.cuisine);
          }
          if (normalizedData.tags !== undefined) {
            expect(retrievedRecipe.tags).toEqual(normalizedData.tags);
          }

          // Verify ingredients array length
          expect(retrievedRecipe.ingredients).toHaveLength(normalizedData.ingredients.length);

          // Verify each ingredient is preserved with calculated totalCost
          normalizedData.ingredients.forEach((originalIng, index) => {
            const retrievedIng = retrievedRecipe.ingredients[index];
            
            expect(retrievedIng.name).toBe(originalIng.name);
            expect(retrievedIng.quantity).toBe(originalIng.quantity);
            expect(retrievedIng.unit).toBe(originalIng.unit);
            expect(retrievedIng.costPerUnit).toBe(originalIng.costPerUnit);
            
            // Verify totalCost is calculated correctly
            const expectedTotalCost = Math.round((originalIng.quantity * originalIng.costPerUnit) * 100) / 100;
            expect(retrievedIng.totalCost).toBe(expectedTotalCost);
          });

          // Verify recipe totalCost is calculated correctly
          const expectedRecipeTotalCost = normalizedData.ingredients.reduce((sum, ing) => {
            return sum + Math.round((ing.quantity * ing.costPerUnit) * 100) / 100;
          }, 0);
          expect(retrievedRecipe.totalCost).toBe(Math.round(expectedRecipeTotalCost * 100) / 100);

          // Verify timestamps are added
          expect(retrievedRecipe.createdAt).toBeDefined();
          expect(retrievedRecipe.updatedAt).toBeDefined();
          expect(retrievedRecipe.createdAt).toBeInstanceOf(Date);
          expect(retrievedRecipe.updatedAt).toBeInstanceOf(Date);

          // Clean up - remove the test recipe
          await Recipe.findByIdAndDelete(savedRecipe._id);
        }
      ),
      { 
        numRuns: 100,
        timeout: 30000,
        verbose: true
      }
    );
  }, 60000); // Increase test timeout for database operations
});