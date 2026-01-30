import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import type { AnimationElement } from '../../utils/AnimationManager';

interface AnimationProps {
  width?: number;
  height?: number;
  elements?: AnimationElement[];
  onAnimationLoaded?: () => void;
  onBackgroundTap?: (x: number, y: number) => void;
}

// Animation constants
const INITIAL_BUBBLE_COUNT = 15;
const BUBBLE_MIN_SIZE = 30;
const BUBBLE_MAX_SIZE = 80;
const CHILD_COUNT_MIN = 3;
const CHILD_COUNT_MAX = 5;
const BUBBLE_SPEED = 0.8;
const BUBBLE_FLOAT_INTERVAL = 50; // ms - more frequent updates for smoother animation
const DOT_COUNT = 12;
const DOT_SIZE = 10;
const DOT_LIFETIME = 1000; // ms
const BURST_PARTICLE_COUNT = 8; // particles when bubble bursts

// Bubble animation types
interface Bubble {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  currentX: number; // Track current position without using private API
  currentY: number;
  size: number;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  highlight: boolean;
}

interface Dot {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  opacity: Animated.Value;
  scale: Animated.Value;
}

const SpaceBubblesAnimation = React.memo(({ 
  width: propWidth = Dimensions.get('window').width, 
  height: propHeight = Dimensions.get('window').height,
  elements = [],
  onAnimationLoaded,
  onBackgroundTap
}: AnimationProps) => {
  // Container dimensions & absolute position (updated via onLayout)
  const [containerDims, setContainerDims] = useState({ width: propWidth, height: propHeight });
  const containerOffset = useRef({ x: 0, y: 0 });

  // State for bubbles and dots
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [dots, setDots] = useState<Dot[]>([]);
  
  // Use refs to avoid dependency issues
  const animationLoadedRef = useRef(onAnimationLoaded);
  const hasNotifiedLoaded = useRef(false);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Update ref when prop changes
  useEffect(() => {
    animationLoadedRef.current = onAnimationLoaded;
  }, [onAnimationLoaded]);
  
  // Generate a unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);
  
  // Create a new bubble
  const createBubble = useCallback((x?: number, y?: number, size?: number): Bubble => {
    const bubbleSize = size || Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE) + BUBBLE_MIN_SIZE;
    const { width, height } = containerDims;
    const posX = x !== undefined ? x : Math.random() * width;
    const posY = y !== undefined ? y : Math.random() * height;

    return {
      id: generateId(),
      x: new Animated.Value(posX),
      y: new Animated.Value(posY),
      currentX: posX, // Track position without using private API
      currentY: posY,
      size: bubbleSize,
      opacity: new Animated.Value(0.7 + Math.random() * 0.3),
      scale: new Animated.Value(0.8 + Math.random() * 0.4),
      color: 'white',
      highlight: Math.random() > 0.5
    };
  }, [containerDims, generateId]);

  // Create a burst of dots at a specific position
  const createDotBurst = useCallback((x: number, y: number) => {
    const newDots: Dot[] = [];
    
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot: Dot = {
        id: generateId(),
        x: new Animated.Value(x),
        y: new Animated.Value(y),
        size: DOT_SIZE * (0.5 + Math.random() * 0.5),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1)
      };
      
      // Animate the dot
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      
      Animated.parallel([
        Animated.timing(dot.x, {
          toValue: x + Math.cos(angle) * distance,
          duration: DOT_LIFETIME,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(dot.y, {
          toValue: y + Math.sin(angle) * distance,
          duration: DOT_LIFETIME,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(dot.opacity, {
          toValue: 0,
          duration: DOT_LIFETIME,
          useNativeDriver: true
        }),
        Animated.timing(dot.scale, {
          toValue: 0.2,
          duration: DOT_LIFETIME,
          useNativeDriver: true
        })
      ]).start(() => {
        // Remove the dot after animation completes
        setDots(prevDots => prevDots.filter(d => d.id !== dot.id));
      });
      
      newDots.push(dot);
    }
    
    setDots(prevDots => [...prevDots, ...newDots]);
  }, [generateId]);
  
  // Create a burst effect when a bubble pops
  const createBurstEffect = useCallback((x: number, y: number, size: number, color: string = 'white') => {
    const burstDots: Dot[] = [];
    
    for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
      const dot: Dot = {
        id: generateId(),
        x: new Animated.Value(x),
        y: new Animated.Value(y),
        size: size * 0.2 * (0.5 + Math.random() * 0.5),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1)
      };
      
      // Animate the burst particle
      const angle = (i / BURST_PARTICLE_COUNT) * Math.PI * 2;
      const distance = size * (1.5 + Math.random());
      
      Animated.parallel([
        Animated.timing(dot.x, {
          toValue: x + Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(dot.y, {
          toValue: y + Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(dot.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(dot.scale, {
          toValue: 0.1,
          duration: 800,
          useNativeDriver: true
        })
      ]).start(() => {
        setDots(prevDots => prevDots.filter(d => d.id !== dot.id));
      });
      
      burstDots.push(dot);
    }
    
    setDots(prevDots => [...prevDots, ...burstDots]);
  }, [generateId]);

  // Split a bubble into smaller bubbles
  const splitBubble = useCallback((bubble: Bubble, x: number, y: number) => {
    // Create burst effect at the bubble's position
    createBurstEffect(x, y, bubble.size);
    
    // Remove the original bubble with a fade out effect
    Animated.timing(bubble.opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setBubbles(prevBubbles => prevBubbles.filter(b => b.id !== bubble.id));
      
      // Create smaller bubbles
      const count = Math.floor(Math.random() * (CHILD_COUNT_MAX - CHILD_COUNT_MIN + 1)) + CHILD_COUNT_MIN;
      const newBubbles: Bubble[] = [];
      
      for (let i = 0; i < count; i++) {
        const childSize = bubble.size * 0.6 * (0.5 + Math.random() * 0.5);
        const newBubble = createBubble(x, y, childSize);
        
        // Animate the new bubble outward
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5; // More evenly distributed
        const distance = 100 + Math.random() * 150;
        
        Animated.timing(newBubble.x, {
          toValue: x + Math.cos(angle) * distance,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }).start();
        
        Animated.timing(newBubble.y, {
          toValue: y + Math.sin(angle) * distance,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }).start();
        
        newBubbles.push(newBubble);
      }
      
      setBubbles(prevBubbles => [...prevBubbles, ...newBubbles]);
    });
  }, [createBubble, createBurstEffect]);
  
  // Handle touch on the animation area
  const handleTouch = useCallback((event: { nativeEvent: { pageX: number; pageY: number } }) => {
    const { pageX, pageY } = event.nativeEvent;
    // Notify parent (unlock logic expects absolute coordinates)
    onBackgroundTap?.(pageX, pageY);
    const x = pageX - containerOffset.current.x;
    const y = pageY - containerOffset.current.y;

    // Check if a bubble was touched using tracked positions
    const touchedBubble = bubbles.find(bubble => {
      const dx = x - bubble.currentX;
      const dy = y - bubble.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= bubble.size / 2;
    });

    if (touchedBubble) {
      splitBubble(touchedBubble, x, y);
    } else {
      createDotBurst(x, y);
    }
  }, [bubbles, splitBubble, createDotBurst, onBackgroundTap]);
  
  // Animation function for bubbles - smoother floating motion
  const animateBubbles = useCallback(() => {
    setBubbles(prevBubbles => prevBubbles.map(bubble => {
      // Calculate new position with natural floating movement
      // Add some sine wave motion for more natural floating
      const time = Date.now() / 1000;
      const uniqueOffset = parseInt(bubble.id.substring(0, 2), 36) / 36; // Use ID for unique wave pattern
      const sineOffset = Math.sin((time + uniqueOffset) * 2) * 1.5;

      const newX = bubble.currentX + sineOffset + (Math.random() * 2 - 1) * BUBBLE_SPEED * 2;
      const newY = bubble.currentY - BUBBLE_SPEED * (2 + Math.random()); // Varying upward speed

      // Wrap around if bubble goes off screen
      const { width, height } = containerDims;
      const wrappedY = newY < -bubble.size ? height + bubble.size : newY;
      const wrappedX = newX < -bubble.size ? width + bubble.size :
                      newX > width + bubble.size ? -bubble.size : newX;

      // Animate to new position with shorter duration for smoother movement
      Animated.timing(bubble.y, {
        toValue: wrappedY,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.linear
      }).start();

      Animated.timing(bubble.x, {
        toValue: wrappedX,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.linear
      }).start();

      // Only start new opacity/scale animations if not already animating
      // This prevents too many animations from stacking up
      if (Math.random() < 0.05) { // Occasionally update the pulsing
        // Animate opacity and scale for a pulsing effect
        Animated.sequence([
          Animated.timing(bubble.opacity, {
            toValue: 0.6 + Math.random() * 0.4,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(bubble.opacity, {
            toValue: 0.8 + Math.random() * 0.2,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true
          })
        ]).start();

        Animated.sequence([
          Animated.timing(bubble.scale, {
            toValue: 0.8 + Math.random() * 0.3,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(bubble.scale, {
            toValue: 1.0 + Math.random() * 0.2,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true
          })
        ]).start();
      }

      // Return updated bubble with new tracked positions
      return {
        ...bubble,
        currentX: wrappedX,
        currentY: wrappedY
      };
    }));
  }, [containerDims]);

  // Initialize animation
  useEffect(() => {
    // Create initial bubbles whenever container size changes (once on mount as well)
    const initialBubbles: Bubble[] = [];
    
    for (let i = 0; i < INITIAL_BUBBLE_COUNT; i++) {
      initialBubbles.push(createBubble());
    }
    
    setBubbles(initialBubbles);
    
    // Notify that animation is loaded (only once)
    if (!hasNotifiedLoaded.current && animationLoadedRef.current) {
      animationLoadedRef.current();
      hasNotifiedLoaded.current = true;
    }
    
    return () => {
      // Cleanup
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [createBubble, containerDims]);
  
  // Set up animation interval separately to avoid dependency issues
  useEffect(() => {
    // Use a shorter interval for smoother animation
    animationIntervalRef.current = setInterval(animateBubbles, BUBBLE_FLOAT_INTERVAL);
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [animateBubbles]);
  
  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View
        style={[styles.container, { width: containerDims.width, height: containerDims.height }]}
        onLayout={event => {
          const { width: w, height: h } = event.nativeEvent.layout;
          setContainerDims({ width: w, height: h });
        }}>
        {/* Render bubbles */}
        {bubbles.map(bubble => (
          <Animated.View 
            key={bubble.id}
            style={[
              styles.bubble,
              {
                width: bubble.size,
                height: bubble.size,
                borderRadius: bubble.size / 2,
                backgroundColor: bubble.color,
                transform: [
                  { translateX: Animated.subtract(bubble.x, bubble.size / 2) },
                  { translateY: Animated.subtract(bubble.y, bubble.size / 2) },
                  { scale: bubble.scale }
                ],
                opacity: bubble.opacity
              }
            ]}
          >
            {bubble.highlight && (
              <View style={[
                styles.highlight,
                {
                  width: bubble.size * 0.4,
                  height: bubble.size * 0.4,
                  borderRadius: bubble.size * 0.2,
                  top: bubble.size * 0.15,
                  left: bubble.size * 0.15
                }
              ]} />
            )}
          </Animated.View>
        ))}
        
        {/* Render dots */}
        {dots.map(dot => (
          <Animated.View 
            key={dot.id}
            style={[
              styles.dot,
              {
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                transform: [
                  { translateX: Animated.subtract(dot.x, dot.size / 2) },
                  { translateY: Animated.subtract(dot.y, dot.size / 2) },
                  { scale: dot.scale }
                ],
                opacity: dot.opacity
              }
            ]}
          />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000',
    overflow: 'hidden'
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  },
  dot: {
    position: 'absolute',
    backgroundColor: 'white'
  }
});

// Add display name for the component
SpaceBubblesAnimation.displayName = 'SpaceBubblesAnimation';

export default SpaceBubblesAnimation;
