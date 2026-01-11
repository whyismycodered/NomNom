# Design Document: Frontend-Backend Integration

## Overview

The Frontend-Backend Integration connects the React Native mobile application to the existing Recipe API Backend, replacing static meal data with dynamic API calls. The system implements a robust API service layer, real-time budget filtering, offline caching, and comprehensive error handling while maintaining the existing UI/UX. The design prioritizes performance, user experience, and reliability through proper state management, loading states, and network resilience.

## Architecture

### System Architecture

The integration follows a layered architecture with clear separation between API services, data transformation, caching, and UI components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │────│   State Mgmt    │────│   API Service   │
│   (React Native)│    │   (React Hooks) │    │   (HTTP Client) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Loading/Error │    │   Recipe Cache  │    │   Backend API   │
│   States        │    │   (AsyncStorage)│    │   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Integration Flow

```
Home.js (Budget/Servings)
    │
    ▼
MealContainer.js (API Calls)
    │
    ├── API Service → Backend Filter Endpoint
    │
    ├── Recipe Transformer → Format Data
    │
    └── MealCard.js (Display)
            │
            ▼
        MealView.js (Recipe Details)
            │
            └── API Service → Backend Scaled Recipe Endpoint
```

## Components and Interfaces

### API Service Layer

The core API service handles all backend communication with proper error handling and retry logic:

```javascript
// services/apiService.js
class ApiService {
  constructor() {
    this.baseURL = 'http://10.0.2.2:3000'; // Android emulator IP
    this.timeout = 10000; // 10 second timeout
    this.maxRetries = 3;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    return this.retryRequest(() => fetch(url, config), this.maxRetries);
  }

  async retryRequest(requestFn, maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.validateResponse(data);
        return data;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  validateResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    if (data.success === false) {
      throw new Error(data.error || 'API request failed');
    }
  }

  // Recipe API Methods
  async filterRecipes(budget, servings = 4) {
    const endpoint = `/api/recipes/filter?budget=${budget}&servings=${servings}`;
    return this.makeRequest(endpoint);
  }

  async getScaledRecipe(recipeId, servings) {
    const endpoint = `/api/recipes/${recipeId}/servings/${servings}`;
    return this.makeRequest(endpoint);
  }

  async getAllRecipes() {
    return this.makeRequest('/api/recipes');
  }

  async getRecipeById(recipeId) {
    return this.makeRequest(`/api/recipes/${recipeId}`);
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export default new ApiService();
```

### Recipe Data Transformer

Converts backend recipe data to frontend component format:

```javascript
// utils/recipeTransformer.js
export class RecipeTransformer {
  static transformAllRecipes(backendData, targetServings = 4) {
    if (!backendData?.data || !Array.isArray(backendData.data)) {
      return [];
    }

    return backendData.data.map(recipe => {
      // Calculate cost for target servings
      const originalServings = this.parseServings(recipe.servings);
      const scaleFactor = targetServings / originalServings;
      const scaledTotalCost = recipe.totalCost * scaleFactor;
      const costPerServing = scaledTotalCost / targetServings;

      return {
        id: recipe._id,
        name: recipe.name,
        desc: recipe.description,
        totalCost: scaledTotalCost,
        costPerServing: Math.round(costPerServing * 100) / 100,
        servings: targetServings,
        originalServings: originalServings,
        scaleFactor: Math.round(scaleFactor * 100) / 100,
        // Map to existing image system
        imgKey: this.generateImageKey(recipe.name),
        img: recipe.imageUrl || null,
        // Transform ingredients for MealView
        ingredients: recipe.ingredients?.map(ing => 
          `${Math.round((ing.quantity * scaleFactor) * 100) / 100} ${ing.unit} ${ing.name}`
        ) || [],
        procedures: recipe.instructions?.map(inst => inst.description) || []
      };
    });
  }

  static transformFilteredRecipes(backendData) {
    if (!backendData?.data || !Array.isArray(backendData.data)) {
      return [];
    }

    return backendData.data.map(recipe => ({
      id: recipe._id,
      name: recipe.name,
      desc: recipe.description,
      price: recipe.scaledTotalCost || recipe.totalCost,
      costPerServing: recipe.costPerServing,
      servings: recipe.targetServings || recipe.servings,
      // Map to existing image system
      imgKey: this.generateImageKey(recipe.name),
      img: recipe.imageUrl || null,
      // Transform ingredients for MealView
      ingredients: recipe.ingredients?.map(ing => 
        `${ing.quantity} ${ing.unit} ${ing.name}`
      ) || [],
      procedures: recipe.instructions?.map(inst => inst.description) || []
    }));
  }

  static transformScaledRecipe(backendData) {
    if (!backendData?.data) {
      return null;
    }

    const recipe = backendData.data;
    return {
      id: recipe._id,
      name: recipe.name,
      desc: recipe.description,
      totalCost: recipe.totalCost,
      costPerServing: recipe.costPerServing,
      servings: recipe.servings,
      scaleFactor: recipe.scaleFactor,
      imgKey: this.generateImageKey(recipe.name),
      img: recipe.imageUrl || null,
      ingredients: recipe.ingredients?.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        cost: ing.totalCost,
        displayText: `${ing.quantity} ${ing.unit} ${ing.name} - ₱${ing.totalCost.toFixed(2)}`
      })) || [],
      procedures: recipe.instructions?.map((inst, index) => ({
        step: index + 1,
        description: inst.description
      })) || []
    };
  }

  static generateImageKey(recipeName) {
    // Map recipe names to existing image keys
    const nameMap = {
      'chicken afritada': 'chicken-afritada',
      'fried bangus': 'fried-bangus',
      'pork adobo': 'pork-adobo',
      'beef mechado': 'beef-mechado',
      'lumpiang shanghai': 'lumpiang-shanghai'
    };

    const key = recipeName.toLowerCase();
    return nameMap[key] || 'default-recipe';
  }
}
```

### Recipe Cache Service

Manages offline storage and data synchronization:

```javascript
// services/cacheService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export class CacheService {
  static CACHE_KEYS = {
    RECIPES: 'cached_recipes',
    LAST_UPDATE: 'cache_last_update',
    USER_PREFERENCES: 'user_preferences'
  };

  static CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  static async cacheRecipes(recipes, budget, servings) {
    try {
      const cacheData = {
        recipes,
        budget,
        servings,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(
        this.CACHE_KEYS.RECIPES, 
        JSON.stringify(cacheData)
      );
      
      await AsyncStorage.setItem(
        this.CACHE_KEYS.LAST_UPDATE, 
        Date.now().toString()
      );
    } catch (error) {
      console.warn('Failed to cache recipes:', error);
    }
  }

  static async getCachedRecipes() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.RECIPES);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (this.isCacheExpired(cacheData.timestamp)) {
        await this.clearCache();
        return null;
      }

      return cacheData;
    } catch (error) {
      console.warn('Failed to get cached recipes:', error);
      return null;
    }
  }

  static isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.CACHE_EXPIRY;
  }

  static async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        this.CACHE_KEYS.RECIPES,
        this.CACHE_KEYS.LAST_UPDATE
      ]);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static async isLocalBackendAvailable() {
    // Simple connectivity check - can be enhanced with NetInfo
    try {
      const response = await fetch('http://10.0.2.2:3000/health', {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Enhanced MealContainer with API Integration

Updated MealContainer component with API calls and visual budget feedback:

```javascript
// components/MealContainer.js
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, useWindowDimensions, Text, View, RefreshControl } from 'react-native';
import MealCard from './MealCard';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';
import apiService from '../services/apiService';
import { RecipeTransformer } from '../utils/recipeTransformer';
import { CacheService } from '../services/cacheService';
import { useTheme } from '../theme/ThemeProvider';

const MealContainer = ({ budget, searchQuery, servings = 4 }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { theme } = useTheme();

  // Load all recipes on mount and when servings change
  useEffect(() => {
    fetchAllRecipes(servings);
  }, [servings]);

  const fetchAllRecipes = useCallback(async (currentServings, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check if backend is available
      const backendAvailable = await CacheService.isLocalBackendAvailable();
      setIsOffline(!backendAvailable);

      let recipeData;

      if (online || forceRefresh) {
        // Fetch all recipes from API
        const response = await apiService.getAllRecipes();
        recipeData = RecipeTransformer.transformAllRecipes(response, currentServings);
        
        // Cache the results
        await CacheService.cacheRecipes(recipeData, currentServings);
      } else {
        // Load from cache
        const cached = await CacheService.getCachedRecipes();
        if (cached && cached.servings === currentServings) {
          recipeData = cached.recipes;
        } else {
          throw new Error('No cached data available for current serving size');
        }
      }

      setRecipes(recipeData);
    } catch (err) {
      setError(err.message);
      
      // Try to load cached data as fallback
      try {
        const cached = await CacheService.getCachedRecipes();
        if (cached) {
          setRecipes(cached.recipes);
          setIsOffline(true);
        }
      } catch (cacheErr) {
        console.warn('Failed to load cached data:', cacheErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllRecipes(servings, true);
  }, [servings, fetchAllRecipes]);

  const retryFetch = useCallback(() => {
    fetchAllRecipes(servings, true);
  }, [servings, fetchAllRecipes]);

  // Filter recipes by search query (client-side)
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate which recipes are within budget for visual feedback
  const recipesWithBudgetStatus = filteredRecipes.map(recipe => ({
    ...recipe,
    isWithinBudget: recipe.costPerServing <= (budget / servings),
    exceedsBudgetBy: Math.max(0, recipe.costPerServing - (budget / servings))
  }));

  // Determine number of columns based on screen width
  const { width } = useWindowDimensions();
  const cols = width < 360 ? 1 : width < 768 ? 2 : 3;

  if (loading && !refreshing) {
    return <LoadingSkeleton cols={cols} />;
  }

  if (error && recipes.length === 0) {
    return (
      <ErrorBoundary 
        error={error} 
        onRetry={retryFetch}
        isOffline={isOffline}
      />
    );
  }

  if (recipesWithBudgetStatus.length === 0 && !loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ 
          fontFamily: 'Montserrat-Medium', 
          fontSize: 16, 
          color: theme.subtext,
          textAlign: 'center'
        }}>
          {searchQuery 
            ? `No recipes found matching "${searchQuery}"`
            : 'No recipes available'
          }
        </Text>
      </View>
    );
  }

  const renderMeal = ({ item, index }) => (
    <MealCard
      item={item}
      index={index}
      budget={budget}
      servings={servings}
      cols={cols}
      isOffline={isOffline}
      isWithinBudget={item.isWithinBudget}
    />
  );

  return (
    <>
      {isOffline && (
        <View style={{ 
          backgroundColor: theme.warning || '#FFA500', 
          padding: 8, 
          marginBottom: 8,
          borderRadius: 4
        }}>
          <Text style={{ 
            color: 'white', 
            textAlign: 'center',
            fontFamily: 'Montserrat-Medium'
          }}>
            Offline Mode - Showing cached recipes
          </Text>
        </View>
      )}
      
      <FlatList
        data={recipesWithBudgetStatus}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id.toString()}
        numColumns={cols}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingBottom: 4,
        }}
        columnWrapperStyle={cols > 1 ? { justifyContent: 'flex-start', gap: 8 } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </>
  );
};

export default MealContainer;
```

### Enhanced MealView with API Integration

Updated MealView component to fetch scaled recipe details:

```javascript
// app/screens/MealView.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View, Image, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import IngredientsList from '../../components/IngredientsList';
import ProceduresCard from '../../components/ProceduresCard';
import VideoTutorial from '../../components/VideoTutorial';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorBoundary from '../../components/ErrorBoundary';
import apiService from '../../services/apiService';
import { RecipeTransformer } from '../../utils/recipeTransformer';

export default function MealView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract parameters
  const recipeId = params.id;
  const servings = parseInt(params.servings) || 4;
  const recipeName = params.name;
  const recipeDesc = params.desc;
  const imgKey = params.imgKey;

  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId, servings]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getScaledRecipe(recipeId, servings);
      const transformedRecipe = RecipeTransformer.transformScaledRecipe(response);
      
      setRecipeDetails(transformedRecipe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    fetchRecipeDetails();
  };

  // Map local image keys to static require paths
  const imageMap = {
    'chicken-afritada': require('../../assets/images/chicken-afritada.png'),
    'fried-bangus': require('../../assets/images/fried-bangus.png'),
    'pork-adobo': require('../../assets/images/pork-adobo.png'),
    'beef-mechado': require('../../assets/images/beef-mechado.png'),
    'lumpiang-shanghai': require('../../assets/images/lumpiang-shanghai.png'),
  };

  let imageSource;
  if (typeof imgKey === 'string' && imageMap[imgKey]) {
    imageSource = imageMap[imgKey];
  } else if (recipeDetails?.img && recipeDetails.img.startsWith('http')) {
    imageSource = { uri: recipeDetails.img };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            position: 'absolute', 
            top: 16, 
            left: 10, 
            zIndex: 1, 
            backgroundColor: 'rgba(81, 34, 91, 0.5)', 
            padding: 6, 
            borderRadius: 20 
          }}
        >
          <Ionicons name="chevron-back" size={24} color='white' />
        </TouchableOpacity>
        
        {imageSource && (
          <Image source={imageSource} style={{ width: "100%", height: 250 }} />
        )}
        
        <View style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: theme.card,
          marginTop: -20,
          paddingTop: 16,
          paddingBottom: 8,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
          overflow: 'hidden',
          width: '100%',
        }}>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={{ 
              fontFamily: 'Montserrat-Bold', 
              fontSize: 24, 
              marginBottom: 4, 
              color: theme.primary 
            }}>
              {recipeName}
            </Text>
            <Text style={{ 
              fontFamily: 'Montserrat-Medium', 
              fontSize: 13, 
              color: theme.subtext, 
              marginBottom: 8 
            }}>
              {recipeDesc}
            </Text>

            {/* Cost Information */}
            {recipeDetails && (
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginBottom: 16,
                padding: 12,
                backgroundColor: theme.surface || theme.background,
                borderRadius: 8
              }}>
                <View>
                  <Text style={{ 
                    fontFamily: 'Montserrat-SemiBold', 
                    fontSize: 16, 
                    color: theme.primary 
                  }}>
                    ₱{recipeDetails.totalCost?.toFixed(2)}
                  </Text>
                  <Text style={{ 
                    fontFamily: 'Montserrat-Regular', 
                    fontSize: 12, 
                    color: theme.subtext 
                  }}>
                    Total Cost
                  </Text>
                </View>
                <View>
                  <Text style={{ 
                    fontFamily: 'Montserrat-SemiBold', 
                    fontSize: 16, 
                    color: theme.primary 
                  }}>
                    ₱{recipeDetails.costPerServing?.toFixed(2)}
                  </Text>
                  <Text style={{ 
                    fontFamily: 'Montserrat-Regular', 
                    fontSize: 12, 
                    color: theme.subtext 
                  }}>
                    Per Serving
                  </Text>
                </View>
                <View>
                  <Text style={{ 
                    fontFamily: 'Montserrat-SemiBold', 
                    fontSize: 16, 
                    color: theme.text 
                  }}>
                    {servings}
                  </Text>
                  <Text style={{ 
                    fontFamily: 'Montserrat-Regular', 
                    fontSize: 12, 
                    color: theme.subtext 
                  }}>
                    Servings
                  </Text>
                </View>
              </View>
            )}
          </View>

          {loading ? (
            <LoadingSkeleton type="ingredients" />
          ) : error ? (
            <ErrorBoundary error={error} onRetry={retryFetch} />
          ) : recipeDetails ? (
            <>
              <Text style={{ 
                fontFamily: 'Montserrat-SemiBold', 
                fontSize: 18, 
                marginBottom: 8, 
                marginHorizontal: 16, 
                color: theme.text 
              }}>
                Ingredients{" "}
                <Text style={{ color: theme.primary }}>
                  ({recipeDetails.ingredients?.length || 0})
                </Text>
              </Text>
              <IngredientsList 
                ingredients={recipeDetails.ingredients?.map(ing => ing.displayText) || []} 
              />

              <Text style={{ 
                fontFamily: 'Montserrat-SemiBold', 
                fontSize: 18, 
                marginBottom: 8, 
                marginHorizontal: 16, 
                color: theme.text 
              }}>
                Procedures
              </Text>
              <ProceduresCard 
                procedures={recipeDetails.procedures?.map(proc => proc.description) || []} 
              />
            </>
          ) : null}

          {/* Video tutorial section */}
          <VideoTutorial
            thumbnail={params.videoThumbnail}
            url={params.videoUrl}
            title={params.videoTitle}
            author={params.videoAuthor}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

## Data Models

### Recipe Data Flow

```typescript
// Backend API Response Format
interface BackendRecipe {
  _id: string;
  name: string;
  description: string;
  ingredients: BackendIngredient[];
  instructions: BackendInstruction[];
  servings: number;
  totalCost: number;
  scaledTotalCost?: number;
  costPerServing?: number;
  targetServings?: number;
  scaleFactor?: number;
}

interface BackendIngredient {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

// Frontend Component Format
interface FrontendRecipe {
  id: string;
  name: string;
  desc: string;
  price: number;
  costPerServing: number;
  servings: number;
  imgKey: string;
  img?: string;
  ingredients: string[];
  procedures: string[];
}

interface ScaledRecipeDetails {
  id: string;
  name: string;
  desc: string;
  totalCost: number;
  costPerServing: number;
  servings: number;
  scaleFactor: number;
  ingredients: ScaledIngredient[];
  procedures: RecipeProcedure[];
}

interface ScaledIngredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  displayText: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated to eliminate redundancy:
- API request properties can be combined into comprehensive network behavior validation
- Data transformation properties can be unified around format consistency
- UI state properties can be grouped by loading, error, and success states
- Cache properties can be consolidated around data persistence and expiration
- Search and filtering properties can be combined into comprehensive data flow validation

### Core Properties

**Property 1: API Service Reliability**
*For any* API endpoint call with valid parameters, the service should either return valid data or throw a descriptive error after appropriate retry attempts with exponential backoff
**Validates: Requirements 1.2, 1.3, 1.5**

**Property 2: Recipe Cost Calculation Accuracy**
*For any* recipe and target serving size, the cost calculations should be mathematically correct with proper scaling and the visual budget indicators should accurately reflect affordability
**Validates: Requirements 2.4, 2.5, 3.1, 3.2**

**Property 3: Data Transformation Consistency**
*For any* valid backend recipe data, the transformer should convert it to frontend format while preserving all essential information including costs, ingredients, and procedures
**Validates: Requirements 2.3, 4.2, 4.3**

**Property 4: Recipe Scaling Mathematical Correctness**
*For any* recipe and target serving size, the scaled recipe details should have proportionally adjusted ingredient quantities and costs that maintain accurate totals
**Validates: Requirements 4.1, 4.2, 4.4**

**Property 5: Search and Visual Budget Integration**
*For any* search query on all available recipes, the results should include only recipes that match the search criteria while maintaining accurate visual budget indicators for each recipe
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 6: Error Handling Completeness**
*For any* network error, timeout, or API failure, the system should display appropriate user feedback while logging detailed error information for debugging
**Validates: Requirements 6.1, 6.3, 6.4**

**Property 7: Cache Consistency and Expiration**
*For any* successfully loaded recipe data, the cache should store it with proper timestamps and retrieve it correctly until expiration, then refresh from the API
**Validates: Requirements 7.1, 7.3, 7.4**

**Property 8: Loading State Accuracy**
*For any* data loading operation, the UI should display appropriate loading indicators that match the final content structure and transition smoothly to loaded content
**Validates: Requirements 8.1, 8.2, 8.5**

**Property 9: Real-time Filter Debouncing**
*For any* rapid sequence of budget or serving changes, the system should debounce API calls to prevent excessive requests while ensuring the final state reflects the latest user input
**Validates: Requirements 3.3, 3.4**

**Property 10: Offline Mode Consistency**
*For any* offline scenario, the system should detect the condition, display appropriate indicators, and provide cached data when available while maintaining full functionality
**Validates: Requirements 6.2, 7.2, 9.3**

## Error Handling

### Error Boundary Component

```javascript
// components/ErrorBoundary.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';

const ErrorBoundary = ({ error, onRetry, isOffline = false }) => {
  const { theme } = useTheme();

  const getErrorMessage = () => {
    if (isOffline) {
      return "You're offline. Check your internet connection and try again.";
    }
    
    if (error?.includes('timeout')) {
      return "Request timed out. The server might be busy. Please try again.";
    }
    
    if (error?.includes('404')) {
      return "Recipe not found. It might have been removed or updated.";
    }
    
    if (error?.includes('500')) {
      return "Server error. Our team has been notified. Please try again later.";
    }
    
    return "Something went wrong. Please try again.";
  };

  return (
    <View style={{
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      margin: 16
    }}>
      <Ionicons 
        name={isOffline ? "cloud-offline" : "alert-circle"} 
        size={48} 
        color={theme.error || '#FF6B6B'} 
        style={{ marginBottom: 16 }}
      />
      
      <Text style={{
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: theme.text,
        textAlign: 'center',
        marginBottom: 8
      }}>
        {isOffline ? 'Offline' : 'Oops!'}
      </Text>
      
      <Text style={{
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: theme.subtext,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20
      }}>
        {getErrorMessage()}
      </Text>
      
      <TouchableOpacity
        onPress={onRetry}
        style={{
          backgroundColor: theme.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <Ionicons name="refresh" size={16} color="white" style={{ marginRight: 8 }} />
        <Text style={{
          fontFamily: 'Montserrat-SemiBold',
          fontSize: 14,
          color: 'white'
        }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ErrorBoundary;
```

### Loading Skeleton Component

```javascript
// components/LoadingSkeleton.js
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const LoadingSkeleton = ({ cols = 2, type = 'cards' }) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'ingredients') {
    return (
      <View style={{ padding: 16 }}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={{
              height: 40,
              backgroundColor: theme.surface || '#E0E0E0',
              marginBottom: 8,
              borderRadius: 8,
              opacity: shimmerOpacity,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 2,
      gap: 8
    }}>
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            width: `${(100 / cols) - (8 / cols)}%`,
            backgroundColor: theme.card || '#F5F5F5',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <Animated.View
            style={{
              width: '100%',
              aspectRatio: 1,
              backgroundColor: theme.surface || '#E0E0E0',
              opacity: shimmerOpacity,
            }}
          />
          <View style={{ padding: 10 }}>
            <Animated.View
              style={{
                height: 16,
                backgroundColor: theme.surface || '#E0E0E0',
                borderRadius: 4,
                marginBottom: 8,
                opacity: shimmerOpacity,
              }}
            />
            <Animated.View
              style={{
                height: 12,
                backgroundColor: theme.surface || '#E0E0E0',
                borderRadius: 4,
                width: '70%',
                opacity: shimmerOpacity,
              }}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

export default LoadingSkeleton;
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- API service endpoint calls with specific parameters
- Data transformation with known backend responses
- Error boundary behavior with specific error types
- Cache operations with known data sets
- UI component rendering with mock data

**Property-Based Tests:**
- API reliability across random valid parameters
- Data transformation consistency across all possible backend formats
- Budget filtering accuracy across random budget/serving combinations
- Search functionality across random query strings
- Cache behavior across random data sets and timestamps

### Property-Based Testing Configuration

Using **fast-check** for JavaScript property-based testing:
- Minimum 100 iterations per property test
- Custom generators for recipe data, budget values, and API responses
- Each test tagged with: **Feature: frontend-backend-integration, Property {number}: {property_text}**

### Test Organization

```
frontend/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── apiService.test.js
│   │   │   └── cacheService.test.js
│   │   ├── utils/
│   │   │   └── recipeTransformer.test.js
│   │   └── components/
│   │       ├── MealContainer.test.js
│   │       ├── ErrorBoundary.test.js
│   │       └── LoadingSkeleton.test.js
│   ├── integration/
│   │   ├── apiIntegration.test.js
│   │   └── cacheIntegration.test.js
│   └── properties/
│       ├── apiProperties.test.js
│       ├── dataTransformProperties.test.js
│       └── uiStateProperties.test.js
└── jest.config.js
```

### Testing Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "fast-check": "^3.0.0",
    "jest-fetch-mock": "^3.0.0",
    "@react-native-async-storage/async-storage": "^2.2.0"
  }
}
```

Property tests will validate universal correctness while unit tests handle specific scenarios and edge cases, ensuring both API reliability and UI consistency across all user interactions.