import { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, useWindowDimensions, Text, View, RefreshControl } from 'react-native';
import MealCard from './MealCard';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';
import { RecipeTransformer } from '../utils/recipeTransformer';
import { CacheService } from '../services/cacheService';
import dataSyncService from '../services/dataSyncService';
import { useTheme } from '../theme/ThemeProvider';

const MealContainer = ({ budget, searchQuery, servings = 4 }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { theme } = useTheme();
  const syncListenerRef = useRef(null);
  const backendListenerRef = useRef(null);

  // Load all recipes on mount and when servings change
  useEffect(() => {
    fetchAllRecipes(servings);
  }, [servings]);

  // Set up data sync listeners
  useEffect(() => {
    // Listen for sync events
    syncListenerRef.current = dataSyncService.addSyncListener((syncEvent) => {
      console.log('Sync event received:', syncEvent);
      
      if (syncEvent.success && syncEvent.type === 'background') {
        // Background sync completed - refresh data silently
        loadCachedRecipes();
      }
    });

    // Listen for backend availability changes
    backendListenerRef.current = dataSyncService.addBackendListener((isAvailable) => {
      setIsOffline(!isAvailable);
      
      if (isAvailable && recipes.length === 0) {
        // Backend became available and have no data - fetch immediately
        fetchAllRecipes(servings, true);
      }
    });

    // Get initial backend availability state
    const syncStatus = dataSyncService.getSyncStatus();
    setIsOffline(!syncStatus.isLocalBackendAvailable);

    return () => {
      // Clean up listeners
      if (syncListenerRef.current) {
        syncListenerRef.current();
      }
      if (backendListenerRef.current) {
        backendListenerRef.current();
      }
    };
  }, [servings, recipes.length]);

  // Recalculate costs when budget changes (without refetching data)
  useEffect(() => {
    if (recipes.length > 0) {
      // Update recipes with new cost calculations for current servings
      const updatedRecipes = recipes.map(recipe => {
        const costPerServing = recipe.totalCost / servings;
        return {
          ...recipe,
          costPerServing: Math.round(costPerServing * 100) / 100
        };
      });
      setRecipes(updatedRecipes);

      // Notify data sync service about budget change for smart cache invalidation
      dataSyncService.invalidateCacheIfNeeded('budget_change', {
        newBudget: budget,
        servings: servings
      });
    }
  }, [budget, servings, recipes.length]);

  // Load cached recipes without API call
  const loadCachedRecipes = useCallback(async () => {
    try {
      const cached = await CacheService.getCachedRecipes();
      if (cached && cached.recipes) {
        console.log('Loading cached recipes for background sync update');
        const transformedRecipes = RecipeTransformer.transformAllRecipes(
          { data: cached.recipes }, 
          servings
        );
        setRecipes(transformedRecipes);
      }
    } catch (error) {
      console.warn('Failed to load cached recipes:', error);
    }
  }, [servings]);

  const fetchAllRecipes = useCallback(async (currentServings, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Use data sync service to check backend availability
      const syncStatus = dataSyncService.getSyncStatus();
      setIsOffline(!syncStatus.isLocalBackendAvailable);

      let recipeData;

      if (syncStatus.isLocalBackendAvailable || forceRefresh) {
        try {
          // Use debounced API call through data sync service
          const debouncedGetAllRecipes = dataSyncService.getDebouncedApiCall('getAllRecipes');
          const response = await debouncedGetAllRecipes();
          recipeData = RecipeTransformer.transformAllRecipes(response, currentServings);
          
          // Cache the results
          await CacheService.cacheRecipes(recipeData, budget, currentServings);
        } catch (apiError) {
          console.warn('API call failed, falling back to cache:', apiError);
          // Fall back to cache
          const cached = await CacheService.getCachedRecipes();
          if (cached && cached.servings === currentServings) {
            recipeData = cached.recipes;
            setIsOffline(true);
          } else {
            throw apiError;
          }
        }
      } else {
        // Load from cache when backend unavailable
        const cached = await CacheService.getCachedRecipes();
        if (cached && cached.servings === currentServings) {
          recipeData = cached.recipes;
        } else {
          throw new Error('No cached data available for current serving size and backend is unavailable');
        }
      }

      setRecipes(recipeData);
    } catch (err) {
      setError(err.message);
      
      // Try to load any cached data as final fallback
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
  }, [budget]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Use data sync service for coordinated refresh
    dataSyncService.triggerSync({ force: true, type: 'manual' })
      .then((result) => {
        if (result.success) {
          console.log('Manual sync completed successfully');
        } else {
          console.warn('Manual sync failed:', result.error);
        }
        // Always fetch recipes after sync attempt
        fetchAllRecipes(servings, true);
      })
      .catch((error) => {
        console.warn('Manual sync error:', error);
        fetchAllRecipes(servings, true);
      });
  }, [servings, fetchAllRecipes]);

  const retryFetch = useCallback(() => {
    fetchAllRecipes(servings, true);
  }, [servings, fetchAllRecipes]);

  // Filter recipes by search query (client-side) with improved matching
  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const recipeName = recipe.name.toLowerCase();
    const recipeDesc = recipe.desc ? recipe.desc.toLowerCase() : '';
    
    return recipeName.includes(query) || recipeDesc.includes(query);
  });

  // Calculate which recipes are within budget for visual feedback and sort them
  const recipesWithBudgetStatus = filteredRecipes.map(recipe => {
    const budgetPerServing = budget / servings;
    const isWithinBudget = recipe.costPerServing <= budgetPerServing;
    const exceedsBudgetBy = Math.max(0, recipe.costPerServing - budgetPerServing);
    
    return {
      ...recipe,
      isWithinBudget,
      exceedsBudgetBy: Math.round(exceedsBudgetBy * 100) / 100
    };
  }).sort((a, b) => {
    // Sort by budget availability first (available recipes at top)
    if (a.isWithinBudget && !b.isWithinBudget) return -1;
    if (!a.isWithinBudget && b.isWithinBudget) return 1;
    
    // Within same budget category, sort by cost per serving (cheaper first)
    return a.costPerServing - b.costPerServing;
  });

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
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ 
          fontFamily: 'Montserrat-Medium', 
          fontSize: 16, 
          color: theme.subtext,
          textAlign: 'center',
          marginBottom: 8
        }}>
          {isSearching 
            ? `No recipes found matching "${searchQuery.trim()}"`
            : 'No recipes available'
          }
        </Text>
        {isSearching && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontFamily: 'Montserrat-Regular', 
              fontSize: 14, 
              color: theme.subtext,
              textAlign: 'center',
              marginBottom: 12
            }}>
              Try adjusting your search terms:
            </Text>
            <Text style={{ 
              fontFamily: 'Montserrat-Regular', 
              fontSize: 13, 
              color: theme.subtext,
              textAlign: 'center',
              lineHeight: 18
            }}>
              • Check spelling{'\n'}
              • Use simpler terms{'\n'}
              • Try searching by main ingredient{'\n'}
              • Clear search to see all recipes
            </Text>
          </View>
        )}
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
        keyExtractor={(item, index) => item.id ? item.id.toString() : `recipe-${index}`}
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


export default MealContainer