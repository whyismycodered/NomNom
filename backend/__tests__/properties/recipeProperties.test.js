const fc = require('fast-check');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Recipe = require('../../models/Recipe');
const RecipeScaler = require('../../utils/recipeScaler');

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
          name: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim()) && s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => /^[a-zA-Z0-9\s\-_.,!]+$/.test(s.trim()) && s.trim().length > 0),
          ingredients: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim()) && s.trim().length > 0),
              quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              unit: fc.constantFrom('cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves', 'ml', 'liters'),
              costPerUnit: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          servings: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim()) && s.trim().length > 0),
          prepTime: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
          cookTime: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
          difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
          category: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
          cuisine: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
          tags: fc.option(
            fc.array(
              fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim()) && s.trim().length > 0),
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

          // Verify core fields are preserved (account for MongoDB trimming)
          expect(retrievedRecipe.name).toBe(normalizedData.name.trim());
          expect(retrievedRecipe.description).toBe(normalizedData.description.trim());
          expect(retrievedRecipe.servings).toBe(normalizedData.servings.trim());
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
            
            // Note: MongoDB trims whitespace from ingredient names due to schema trim: true
            expect(retrievedIng.name).toBe(originalIng.name.trim());
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
        numRuns: 50,
        timeout: 30000,
        verbose: true
      }
    );
  }, 60000); // Increase test timeout for database operations

  /**
   * Property 3: Recipe filtering accuracy by budget and servings
   * For any set of recipes, budget amount, and target servings, the filtering algorithm 
   * should return only recipes that can be prepared within the budget when scaled to 
   * the target servings, sorted by cost efficiency
   * Validates: Requirements 2.1, 2.2, 2.5
   */
  test('Property 3: Recipe filtering accuracy by budget and servings', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for realistic PHP budget ranges (₱50-1000)
        fc.float({ min: 50, max: 1000, noNaN: true }),
        // Generator for target servings (1-10 people)
        fc.integer({ min: 1, max: 10 }),
        // Generator for array of recipes with realistic PHP costs
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
            description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9\s\-_.,!]+$/.test(s.trim())),
            ingredients: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
                quantity: fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true }),
                unit: fc.constantFrom('cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves'),
                costPerUnit: fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }) // PHP 1-500 per unit
              }),
              { minLength: 1, maxLength: 5 }
            ),
            servings: fc.oneof(
              fc.integer({ min: 1, max: 8 }).map(n => n.toString()),
              fc.integer({ min: 1, max: 8 }).map(n => `${n} people`),
              fc.integer({ min: 1, max: 8 }).map(n => `${n} to ${n + 1}`)
            ),
            difficulty: fc.constantFrom('Easy', 'Medium', 'Hard')
          }),
          { minLength: 2, maxLength: 8 }
        ),
        async (budget, targetServings, recipeDataArray) => {
          // Round budget to PHP precision and ensure minimum values
          const phpBudget = RecipeScaler.roundToPHP(Math.max(budget, 50));
          const validTargetServings = Math.max(targetServings, 1);
          
          // Skip if we have invalid data
          if (recipeDataArray.length === 0) {
            return true; // Vacuous truth for empty arrays
          }
          
          // Create recipe objects with calculated costs
          const recipes = recipeDataArray.map(recipeData => {
            const normalizedIngredients = recipeData.ingredients.map(ing => ({
              ...ing,
              quantity: RecipeScaler.roundToPHP(Math.max(ing.quantity, 0.1)),
              costPerUnit: RecipeScaler.roundToPHP(Math.max(ing.costPerUnit, 1)),
              totalCost: RecipeScaler.roundToPHP(Math.max(ing.quantity, 0.1) * Math.max(ing.costPerUnit, 1))
            }));

            const totalCost = normalizedIngredients.reduce((sum, ing) => sum + ing.totalCost, 0);

            return {
              ...recipeData,
              ingredients: normalizedIngredients,
              totalCost: RecipeScaler.roundToPHP(totalCost),
              toObject: function() { return this; } // Mock Mongoose toObject method
            };
          });

          // Apply filtering using RecipeScaler
          const filteredRecipes = RecipeScaler.filterRecipesByBudgetAndServings(
            recipes, 
            phpBudget, 
            validTargetServings
          );

          // Property 1: All returned recipes must fit within budget when scaled
          filteredRecipes.forEach(recipe => {
            expect(recipe.scaledTotalCost).toBeLessThanOrEqual(phpBudget + 0.05); // Allow 5 cents tolerance
            expect(recipe.fitsInBudget).toBe(true);
            
            // Verify scaling calculations are correct
            const originalServings = RecipeScaler.parseServings(recipe.servings);
            const expectedScaleFactor = validTargetServings / originalServings;
            const expectedScaledCost = RecipeScaler.roundToPHP(
              recipes.find(r => r.name === recipe.name).totalCost * expectedScaleFactor
            );
            
            expect(Math.abs(recipe.scaledTotalCost - expectedScaledCost)).toBeLessThanOrEqual(0.05);
            expect(Math.abs(recipe.scaleFactor - RecipeScaler.roundToPHP(expectedScaleFactor))).toBeLessThanOrEqual(0.05);
            expect(recipe.targetServings).toBe(validTargetServings);
          });

          // Property 2: Results should be sorted by cost efficiency (cost per serving)
          for (let i = 1; i < filteredRecipes.length; i++) {
            expect(filteredRecipes[i].costPerServing).toBeGreaterThanOrEqual(
              filteredRecipes[i - 1].costPerServing - 0.05 // Allow small tolerance for floating point
            );
          }

          // Property 3: Cost per serving calculation should be accurate
          filteredRecipes.forEach(recipe => {
            const expectedCostPerServing = RecipeScaler.roundToPHP(
              recipe.scaledTotalCost / validTargetServings
            );
            expect(Math.abs(recipe.costPerServing - expectedCostPerServing)).toBeLessThanOrEqual(0.05);
          });

          // Property 4: No recipe that exceeds budget should be included
          const allScaledRecipes = recipes.map(recipe => {
            const originalServings = RecipeScaler.parseServings(recipe.servings);
            const scaleFactor = validTargetServings / originalServings;
            const scaledTotalCost = RecipeScaler.roundToPHP(recipe.totalCost * scaleFactor);
            return { ...recipe, scaledTotalCost };
          });

          const recipesOverBudget = allScaledRecipes.filter(recipe => 
            recipe.scaledTotalCost > phpBudget + 0.05 // Allow 5 cents tolerance
          );

          recipesOverBudget.forEach(overBudgetRecipe => {
            const foundInFiltered = filteredRecipes.find(r => r.name === overBudgetRecipe.name);
            expect(foundInFiltered).toBeUndefined();
          });

          // Property 5: All recipes within budget should be included
          const recipesWithinBudget = allScaledRecipes.filter(recipe => 
            recipe.scaledTotalCost <= phpBudget + 0.05 // Allow 5 cents tolerance
          );

          expect(filteredRecipes).toHaveLength(recipesWithinBudget.length);

          recipesWithinBudget.forEach(withinBudgetRecipe => {
            const foundInFiltered = filteredRecipes.find(r => r.name === withinBudgetRecipe.name);
            expect(foundInFiltered).toBeDefined();
          });

          // Property 6: PHP precision should be maintained (2 decimal places)
          filteredRecipes.forEach(recipe => {
            expect(recipe.scaledTotalCost).toBe(RecipeScaler.roundToPHP(recipe.scaledTotalCost));
            expect(recipe.costPerServing).toBe(RecipeScaler.roundToPHP(recipe.costPerServing));
            expect(recipe.scaleFactor).toBe(RecipeScaler.roundToPHP(recipe.scaleFactor));
          });
        }
      ),
      { 
        numRuns: 50,
        timeout: 30000,
        verbose: true
      }
    );
  }, 60000); // Increase test timeout for complex calculations

  /**
   * Property 4: Recipe scaling mathematical correctness
   * For any recipe and target serving size, the scaling algorithm should proportionally 
   * adjust all ingredient quantities and costs while maintaining ingredient ratios and 
   * calculating accurate totals with PHP currency precision
   * Validates: Requirements 3.2, 3.3, 3.5
   */
  test('Property 4: Recipe scaling mathematical correctness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for recipe with realistic PHP costs
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
          description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9\s\-_.,!]+$/.test(s.trim())),
          ingredients: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
              quantity: fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
              unit: fc.constantFrom('cups', 'tbsp', 'tsp', 'lbs', 'oz', 'grams', 'kg', 'pieces', 'cloves'),
              costPerUnit: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }) // PHP 1-1000 per unit
            }),
            { minLength: 1, maxLength: 5 }
          ),
          servings: fc.oneof(
            fc.integer({ min: 1, max: 12 }).map(n => n.toString()),
            fc.integer({ min: 1, max: 12 }).map(n => `${n} people`),
            fc.integer({ min: 1, max: 12 }).map(n => `${n} to ${n + 1}`)
          ),
          difficulty: fc.constantFrom('Easy', 'Medium', 'Hard')
        }),
        // Generator for target servings (1-20 people)
        fc.integer({ min: 1, max: 20 }),
        async (recipeData, targetServings) => {
          // Ensure minimum valid values
          const validTargetServings = Math.max(targetServings, 1);
          
          // Create recipe object with PHP-rounded costs
          const normalizedIngredients = recipeData.ingredients.map(ing => ({
            ...ing,
            quantity: RecipeScaler.roundToPHP(Math.max(ing.quantity, 0.1)),
            costPerUnit: RecipeScaler.roundToPHP(Math.max(ing.costPerUnit, 1)),
            totalCost: RecipeScaler.roundToPHP(Math.max(ing.quantity, 0.1) * Math.max(ing.costPerUnit, 1))
          }));

          const totalCost = normalizedIngredients.reduce((sum, ing) => sum + ing.totalCost, 0);

          const recipe = {
            ...recipeData,
            ingredients: normalizedIngredients,
            totalCost: RecipeScaler.roundToPHP(totalCost),
            toObject: function() { return this; } // Mock Mongoose toObject method
          };

          // Scale the recipe
          const scaledRecipe = RecipeScaler.scaleRecipeToServings(recipe, validTargetServings);

          // Property 1: Original recipe data should be preserved in scaled recipe
          expect(scaledRecipe.name).toBe(recipe.name);
          expect(scaledRecipe.description).toBe(recipe.description);
          expect(scaledRecipe.difficulty).toBe(recipe.difficulty);

          // Property 2: Serving size should be updated correctly
          const originalServings = RecipeScaler.parseServings(recipe.servings);
          if (originalServings === validTargetServings) {
            // When servings are the same, original format is preserved
            expect(scaledRecipe.servings).toBe(recipe.servings);
          } else {
            // When servings are different, target servings format is used
            expect(scaledRecipe.servings).toBe(validTargetServings.toString());
            expect(scaledRecipe.targetServings).toBe(validTargetServings);
          }

          // Property 3: Scale factor should be calculated correctly
          const expectedScaleFactor = validTargetServings / originalServings;
          expect(Math.abs(scaledRecipe.scaleFactor - RecipeScaler.roundToPHP(expectedScaleFactor))).toBeLessThanOrEqual(0.05);
          expect(scaledRecipe.originalServings).toBe(originalServings);

          // Property 4: Ingredient quantities should be scaled proportionally
          expect(scaledRecipe.ingredients).toHaveLength(recipe.ingredients.length);
          
          recipe.ingredients.forEach((originalIng, index) => {
            const scaledIng = scaledRecipe.ingredients[index];
            
            // Name and unit should remain unchanged
            expect(scaledIng.name).toBe(originalIng.name);
            expect(scaledIng.unit).toBe(originalIng.unit);
            expect(scaledIng.costPerUnit).toBe(originalIng.costPerUnit);
            
            // Quantity should be scaled with PHP precision (allow small tolerance)
            const expectedScaledQuantity = RecipeScaler.roundToPHP(originalIng.quantity * expectedScaleFactor);
            expect(Math.abs(scaledIng.quantity - expectedScaledQuantity)).toBeLessThanOrEqual(0.05);
            
            // Total cost should be scaled with PHP precision (allow small tolerance)
            const expectedScaledTotalCost = RecipeScaler.roundToPHP(originalIng.totalCost * expectedScaleFactor);
            expect(Math.abs(scaledIng.totalCost - expectedScaledTotalCost)).toBeLessThanOrEqual(0.05);
          });

          // Property 5: Recipe total cost should be scaled correctly with PHP precision
          const expectedScaledTotalCost = RecipeScaler.roundToPHP(recipe.totalCost * expectedScaleFactor);
          expect(Math.abs(scaledRecipe.totalCost - expectedScaledTotalCost)).toBeLessThanOrEqual(0.05);

          // Property 6: Cost per serving should be calculated correctly
          const expectedCostPerServing = RecipeScaler.roundToPHP(scaledRecipe.totalCost / validTargetServings);
          expect(Math.abs(scaledRecipe.costPerServing - expectedCostPerServing)).toBeLessThanOrEqual(0.05);

          // Property 7: Sum of ingredient costs should equal recipe total cost (within tolerance)
          const sumOfIngredientCosts = scaledRecipe.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
          const roundedSum = RecipeScaler.roundToPHP(sumOfIngredientCosts);
          expect(Math.abs(scaledRecipe.totalCost - roundedSum)).toBeLessThanOrEqual(0.05); // Allow 5 cents tolerance

          // Property 8: PHP precision should be maintained (2 decimal places)
          expect(scaledRecipe.totalCost).toBe(RecipeScaler.roundToPHP(scaledRecipe.totalCost));
          expect(scaledRecipe.costPerServing).toBe(RecipeScaler.roundToPHP(scaledRecipe.costPerServing));
          expect(scaledRecipe.scaleFactor).toBe(RecipeScaler.roundToPHP(scaledRecipe.scaleFactor));
          
          scaledRecipe.ingredients.forEach(ing => {
            expect(ing.quantity).toBe(RecipeScaler.roundToPHP(ing.quantity));
            expect(ing.totalCost).toBe(RecipeScaler.roundToPHP(ing.totalCost));
            expect(ing.costPerUnit).toBe(RecipeScaler.roundToPHP(ing.costPerUnit));
          });

          // Property 9: Special case - when target servings equals original servings
          if (validTargetServings === originalServings) {
            expect(Math.abs(scaledRecipe.scaleFactor - 1)).toBeLessThanOrEqual(0.05);
            expect(Math.abs(scaledRecipe.totalCost - recipe.totalCost)).toBeLessThanOrEqual(0.05);
            
            recipe.ingredients.forEach((originalIng, index) => {
              const scaledIng = scaledRecipe.ingredients[index];
              expect(Math.abs(scaledIng.quantity - originalIng.quantity)).toBeLessThanOrEqual(0.05);
              expect(Math.abs(scaledIng.totalCost - originalIng.totalCost)).toBeLessThanOrEqual(0.05);
            });
          }
        }
      ),
      { 
        numRuns: 50,
        timeout: 30000,
        verbose: true
      }
    );
  }, 60000); // Increase test timeout for complex calculations
});