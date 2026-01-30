import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import type { AnimationElement } from '../../utils/AnimationManager';

interface AnimationProps {
  width?: number;
  height?: number;
  elements?: AnimationElement[];
  onAnimationLoaded?: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Enhanced "Space Journey" animation with parallax stars, rotating planets,
 * and smooth looping transitions.
 */
const SpaceJourneyAnimationComponent: React.FC<AnimationProps> = ({
  width = SCREEN_W,
  height = SCREEN_H,
  elements = [],
  onAnimationLoaded,
}) => {
  // Initialize animation values internally
  const animationValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Interpolations
  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const starOpacity = animationValue.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0.1, 0.6, 1, 0.6, 0.1],
  });

  // Generate star layers for parallax effect
  const starLayers = useRef(
    [...Array(3)].map((_, layer) =>
      Array.from({ length: 20 }, (_, i) => {
        const size = Math.random() * (2 + layer * 2) + 1;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const speed = 0.5 + layer * 0.3;
        return { id: `star-${layer}-${i}`, size, x, y, speed, layer };
      })
    )
  ).current;

  useEffect(() => {
    // Notify parent that animation is loaded
    if (onAnimationLoaded) {
      onAnimationLoaded();
    }

    // Animate star drift
    const driftAnimation = Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Rotate planets continuously
    const rotateAnimation = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Slight pulsating scale on planets
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Start all animations
    driftAnimation.start();
    rotateAnimation.start();
    scaleAnimation.start();

    // Clean up animations on unmount
    return () => {
      driftAnimation.stop();
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, [animationValue, rotationValue, scaleValue, onAnimationLoaded]);

  // Planets data
  const planets = [
    { size: 80, color: '#3B82F6', x: width * 0.2, y: height * 0.3, z: 2 },
    { size: 50, color: '#10B981', x: width * 0.8, y: height * 0.5, z: 1 },
    { size: 100, color: '#F59E0B', x: width * 0.5, y: height * 0.8, z: 3 },
  ];

  return (
    <View style={[styles.animationContainer, { width, height }]}>
      {/* Parallax Star Layers */}
      {starLayers.map((layer) =>
        layer.map((star) => {
          const driftX = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -star.speed * 50],
          });
          return (
            <Animated.View
              key={star.id}
              style={[
                styles.star,
                {
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  top: star.y,
                  left: star.x,
                  opacity: starOpacity,
                  transform: [{ translateX: driftX }],
                },
              ]}
            />
          );
        })
      )}

      {/* Rotating & Pulsing Planets */}
      {planets.map((planet, i) => (
        <Animated.View
          key={`planet-${i}`}
          style={[
            styles.planet,
            {
              width: planet.size,
              height: planet.size,
              backgroundColor: planet.color,
              top: planet.y - planet.size / 2,
              left: planet.x - planet.size / 2,
              transform: [{ rotate: rotation }, { scale: scaleValue }],
              zIndex: planet.z,
            },
          ]}
        />
      ))}

      {/* Optional additional elements */}
      {elements && elements.length > 0 && elements.map((el, index) => {
        if (el && el.type) {
          // Render element based on its type and properties
          const { type, properties } = el;
          const { size, color, position = { x: 0, y: 0 }, animations = {} } = properties;
          
          // Create style based on element properties
          const elementStyle = {
            position: 'absolute' as 'absolute',
            width: size,
            height: size,
            backgroundColor: color,
            top: position.y,
            left: position.x,
          };
          
          // Apply animations if specified
          const animatedStyle = [];
          if (animations.rotate) {
            animatedStyle.push({ rotate: rotation });
          }
          if (animations.scale) {
            animatedStyle.push({ scale: scaleValue });
          }
          
          // Render different shapes based on type
          switch (type) {
            case 'circle':
              return (
                <Animated.View 
                  key={`element-${index}`} 
                  style={[elementStyle, { borderRadius: size / 2 }, animatedStyle.length > 0 ? { transform: animatedStyle } : null]}
                />
              );
            case 'square':
              return (
                <Animated.View 
                  key={`element-${index}`} 
                  style={[elementStyle, animatedStyle.length > 0 ? { transform: animatedStyle } : null]}
                />
              );
            case 'triangle':
              // For triangle, we'd need a more complex approach with a custom component
              // This is a simplified version
              return (
                <Animated.View 
                  key={`element-${index}`} 
                  style={[elementStyle, { borderBottomWidth: size, borderBottomColor: color, borderLeftWidth: size/2, borderLeftColor: 'transparent', borderRightWidth: size/2, borderRightColor: 'transparent', backgroundColor: 'transparent' }, animatedStyle.length > 0 ? { transform: animatedStyle } : null]}
                />
              );
            case 'custom':
              // Custom elements would need specific handling
              return (
                <Animated.View 
                  key={`element-${index}`} 
                  style={[elementStyle, animatedStyle.length > 0 ? { transform: animatedStyle } : null]}
                />
              );
            default:
              return null;
          }
        }
        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
  },
  planet: {
    position: 'absolute',
    borderRadius: 100,
  },
});

const SpaceJourneyAnimation = React.memo(SpaceJourneyAnimationComponent);

export default SpaceJourneyAnimation;
