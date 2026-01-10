# Implementation Plan: Recipe API Backend

## Overview

This implementation plan converts the Recipe API Backend design into discrete coding tasks. Each task builds incrementally toward a complete Node.js/Express API with MongoDB integration, following MVC architecture patterns. The tasks focus on core functionality first, with optional testing tasks for comprehensive validation.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create server directory and package.json with required dependencies
  - Set up basic folder structure (models, routes, controllers, middleware, utils)
  - Configure environment variables and basic server entry point
  - _Requirements: 5.5_

- [x] 2. Set up database connection and Recipe model
  - [x] 2.1 Create MongoDB connection configuration
    - Implement database.js with connection handling and error management
    - _Requirements: 6.1_

  - [x] 2.2 Implement Recipe Mongoose model with validation
    - Create Recipe.js with ingredient schema and validation rules
    - Include all required fields: name, description, ingredients array, pricing
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 2.3 Write property test for Recipe model data persistence

    - **Property 1: Recipe data round-trip consistency**
    - **Validates: Requirements 1.3, 4.3**

- [x] 3. Implement core recipe API endpoints
  - [x] 3.1 Create recipe controller with CRUD operations
    - Implement getAllRecipes, getRecipeById, createRecipe functions
    - Add proper error handling and response formatting
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.2 Set up recipe routes with Express router
    - Define GET /api/recipes and GET /api/recipes/:id endpoints
    - Wire routes to controller functions
    - _Requirements: 1.1, 1.2_

  - [ ]* 3.3 Write property test for API response consistency
    - **Property 2: Recipe API response structure consistency**
    - **Validates: Requirements 1.5, 6.2**

  - [ ]* 3.4 Write unit tests for recipe controller edge cases
    - Test invalid IDs, empty database, malformed requests
    - _Requirements: 1.4, 6.2_

- [x] 4. Implement recipe filtering and scaling functionality with PHP currency
  - [x] 4.1 Create recipe scaling utility class with PHP cost calculations
    - Implement RecipeScaler with filtering and scaling algorithms using PHP amounts
    - Handle proportional ingredient scaling based on serving size with PHP cost precision
    - Add cost per serving calculations and budget filtering logic in PHP
    - Ensure all monetary calculations maintain PHP decimal precision (2 decimal places)
    - _Requirements: 2.1, 2.2, 2.5, 3.2, 3.3, 3.5_

  - [x] 4.2 Update recipe controller with filtering and scaling endpoints for PHP currency
    - Implement GET /api/recipes/filter endpoint with PHP budget and serving parameters
    - Add GET /api/recipes/:id/servings/:servings endpoint for scaled recipe details with PHP costs
    - Add input validation for PHP budget amounts and serving parameters
    - Format all cost responses in PHP with proper decimal precision
    - _Requirements: 2.3, 2.4, 3.1, 3.4_

  - [ ]* 4.3 Write property test for recipe filtering accuracy with PHP amounts
    - **Property 3: Recipe filtering accuracy by budget and servings**
    - Test with realistic PHP budget ranges (₱50-1000)
    - **Validates: Requirements 2.1, 2.2, 2.5**

  - [ ]* 4.4 Write property test for recipe scaling mathematical correctness with PHP currency
    - **Property 4: Recipe scaling mathematical correctness**
    - Verify PHP cost calculations maintain proper decimal precision
    - **Validates: Requirements 3.2, 3.3, 3.5**

- [ ] 5. Configure CORS and mobile client support
  - [ ] 5.1 Implement CORS middleware for Android emulator
    - Create cors.js with emulator IP support (10.0.2.2)
    - Handle preflight requests and multiple origins
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write unit tests for CORS configuration
    - Test emulator IP access, preflight requests, origin handling
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 6. Implement comprehensive error handling
  - [ ] 6.1 Create global error handling middleware
    - Implement errorHandler.js with logging and sanitized responses
    - Handle Mongoose errors, validation errors, and server exceptions
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ]* 6.2 Write property test for input validation consistency
    - **Property 5: Input validation consistency**
    - **Validates: Requirements 1.4, 4.1, 4.2, 4.4, 6.2**

  - [ ]* 6.3 Write property test for error handling consistency
    - **Property 7: Error handling consistency**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 7. Complete server setup and integration
  - [ ] 7.1 Finalize server.js with all middleware and routes
    - Integrate CORS, error handling, and route mounting
    - Configure server binding for emulator access (0.0.0.0)
    - Add startup logging with access URLs
    - _Requirements: 3.2, 3.3_

  - [ ] 7.2 Add health check endpoint for monitoring
    - Create simple health check route for system status
    - _Requirements: 6.5_

  - [ ]* 7.3 Write integration tests for complete API flow
    - Test end-to-end recipe creation, retrieval, and budget optimization
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 8. Checkpoint - Ensure all tests pass and API is functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create sample data and documentation
  - [ ] 9.1 Create sample recipe data for testing
    - Add seed script with Filipino recipes matching the mobile app
    - Include realistic ingredient pricing and quantities
    - _Requirements: 1.1, 1.2_

  - [ ]* 9.2 Write property test for recipe ID uniqueness
    - **Property 8: Recipe ID uniqueness**
    - **Validates: Requirements 4.5**

- [ ] 10. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality
- Server binding to 0.0.0.0 enables Android emulator access via 10.0.2.2