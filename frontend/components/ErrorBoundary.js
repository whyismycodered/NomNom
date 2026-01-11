import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';

const ErrorBoundary = ({ error, onRetry, isOffline = false }) => {
  const { theme } = useTheme();

  // Log detailed error information for debugging
  React.useEffect(() => {
    if (error) {
      console.error('ErrorBoundary caught error:', {
        message: error,
        timestamp: new Date().toISOString(),
        isOffline,
        userAgent: navigator?.userAgent || 'React Native',
        stack: error.stack || 'No stack trace available'
      });
    }
  }, [error, isOffline]);

  const getErrorMessage = () => {
    if (isOffline) {
      return "You're offline. Check your internet connection and try again.";
    }
    
    if (typeof error === 'string') {
      if (error.includes('timeout') || error.includes('TIMEOUT')) {
        return "Request timed out. The server might be busy. Please try again.";
      }
      
      if (error.includes('404') || error.includes('Not Found')) {
        return "Recipe not found. It might have been removed or updated.";
      }
      
      if (error.includes('500') || error.includes('Internal Server Error')) {
        return "Server error. Our team has been notified. Please try again later.";
      }
      
      if (error.includes('Network Error') || error.includes('NETWORK_ERROR')) {
        return "Network error. Please check your connection and try again.";
      }
      
      if (error.includes('Failed to fetch')) {
        return "Unable to connect to server. Please check your connection.";
      }
    }
    
    return "Something went wrong. Please try again.";
  };

  const getErrorIcon = () => {
    if (isOffline) {
      return 'wifi-outline';
    }
    
    if (typeof error === 'string') {
      if (error.includes('timeout')) {
        return 'time-outline';
      }
      
      if (error.includes('404')) {
        return 'search-outline';
      }
      
      if (error.includes('500')) {
        return 'server-outline';
      }
      
      if (error.includes('Network Error') || error.includes('Failed to fetch')) {
        return 'cloud-offline-outline';
      }
    }
    
    return 'alert-circle-outline';
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.card || '#FFFFFF',
      borderRadius: 12,
      margin: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.error || '#FF6B6B',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: 'Montserrat-SemiBold',
      fontSize: 18,
      color: theme.text || '#333333',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 14,
      color: theme.subtext || '#666666',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.primary || '#51225B',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    retryButtonText: {
      fontFamily: 'Montserrat-SemiBold',
      fontSize: 16,
      color: 'white',
    },
    debugInfo: {
      marginTop: 16,
      padding: 12,
      backgroundColor: theme.surface || '#F5F5F5',
      borderRadius: 8,
      width: '100%',
    },
    debugText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 12,
      color: theme.subtext || '#666666',
      textAlign: 'left',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getErrorIcon()} 
          size={28} 
          color="white" 
        />
      </View>
      
      <Text style={styles.title}>
        {isOffline ? 'No Internet Connection' : 'Oops! Something went wrong'}
      </Text>
      
      <Text style={styles.message}>
        {getErrorMessage()}
      </Text>
      
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.retryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
      
      {__DEV__ && error && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug Info: {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ErrorBoundary;