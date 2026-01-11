/**
 * Loading Skeleton Component
 * Displays skeleton screens that match final content layout
 * Supports different skeleton types with shimmer animations
 * 
 * Requirements: 8.1, 8.2, 8.4
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const LoadingSkeleton = ({ cols = 2, type = 'cards', count = 6 }) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const SkeletonBox = ({ width, height, style = {} }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme.surface || '#f0f0f0',
          borderRadius: 8,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            opacity: shimmerOpacity,
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      />
    </View>
  );

  if (type === 'procedures') {
    return (
      <View style={{ padding: 16 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              marginBottom: 16,
              paddingHorizontal: 8,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.surface || '#f0f0f0',
                marginRight: 12,
                marginTop: 2,
              }}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    opacity: shimmerOpacity,
                    transform: [{ translateX: shimmerTranslateX }],
                    borderRadius: 12,
                  },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonBox 
                width={width - 100} 
                height={16} 
                style={{ marginBottom: 4 }} 
              />
              <SkeletonBox 
                width={width - 140} 
                height={14} 
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'ingredients') {
    return (
      <View style={{ padding: 16 }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              paddingHorizontal: 8,
              paddingVertical: 8,
              backgroundColor: theme.card || '#ffffff',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                backgroundColor: theme.surface || '#f0f0f0',
                marginRight: 12,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    opacity: shimmerOpacity,
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonBox 
                width={width - 120} 
                height={16} 
                style={{ marginBottom: 4 }} 
              />
              <SkeletonBox 
                width={width - 160} 
                height={12} 
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'details') {
    return (
      <View style={{ padding: 16 }}>
        {/* Title skeleton */}
        <SkeletonBox width={width - 32} height={28} style={{ marginBottom: 8 }} />
        
        {/* Description skeleton */}
        <SkeletonBox width={width - 60} height={16} style={{ marginBottom: 16 }} />
        
        {/* Cost info skeleton */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 24,
            padding: 12,
            backgroundColor: theme.surface || '#f8f8f8',
            borderRadius: 8,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <SkeletonBox width={60} height={20} style={{ marginBottom: 4 }} />
            <SkeletonBox width={50} height={14} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonBox width={60} height={20} style={{ marginBottom: 4 }} />
            <SkeletonBox width={50} height={14} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonBox width={30} height={20} style={{ marginBottom: 4 }} />
            <SkeletonBox width={40} height={14} />
          </View>
        </View>
        
        {/* Ingredients section skeleton */}
        <SkeletonBox width={120} height={20} style={{ marginBottom: 12 }} />
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={`ingredient-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: theme.card || '#ffffff',
              borderRadius: 6,
            }}
          >
            <SkeletonBox width={20} height={20} style={{ marginRight: 12 }} />
            <SkeletonBox width={width - 80} height={16} />
          </View>
        ))}
        
        {/* Procedures section skeleton */}
        <View style={{ marginTop: 20 }}>
          <SkeletonBox width={100} height={20} style={{ marginBottom: 12 }} />
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={`procedure-${index}`}
              style={{
                flexDirection: 'row',
                marginBottom: 12,
                paddingHorizontal: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.surface || '#f0f0f0',
                  marginRight: 12,
                  marginTop: 2,
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      opacity: shimmerOpacity,
                      transform: [{ translateX: shimmerTranslateX }],
                      borderRadius: 12,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SkeletonBox 
                  width={width - 100} 
                  height={16} 
                  style={{ marginBottom: 4 }} 
                />
                <SkeletonBox 
                  width={width - 140} 
                  height={14} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Default: recipe cards skeleton
  const cardWidth = cols === 1 ? width - 16 : (width - 32) / cols;
  const cardHeight = 200;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        justifyContent: cols > 1 ? 'space-between' : 'center',
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            width: cardWidth,
            marginBottom: 16,
            backgroundColor: theme.card || '#ffffff',
            borderRadius: 12,
            padding: 8,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          {/* Image skeleton */}
          <SkeletonBox
            width={cardWidth - 16}
            height={120}
            style={{ marginBottom: 8, borderRadius: 8 }}
          />
          
          {/* Title skeleton */}
          <SkeletonBox
            width={cardWidth - 32}
            height={18}
            style={{ marginBottom: 6 }}
          />
          
          {/* Description skeleton */}
          <SkeletonBox
            width={cardWidth - 48}
            height={14}
            style={{ marginBottom: 8 }}
          />
          
          {/* Price and serving info skeleton */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}>
            <View>
              <SkeletonBox width={50} height={16} style={{ marginBottom: 2 }} />
              <SkeletonBox width={40} height={12} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <SkeletonBox width={35} height={14} style={{ marginBottom: 2 }} />
              <SkeletonBox width={45} height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default LoadingSkeleton;