import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, View, Dimensions, Vibration, Platform } from 'react-native';

import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationElement } from '../../utils/AnimationManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnimationProps {
  animationValue: Animated.Value;
  rotationValue: Animated.Value;
  scaleValue: Animated.Value;
  elements: AnimationElement[];
  styles: any;
  // Additional props that might be passed from animation.tsx
  width?: number;
  height?: number;
  onAnimationLoaded?: () => void;
}



interface ShapePosition {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
}

interface ShapePhysics {
  velocityX: number;
  velocityY: number;
  mass: number;
  bounciness: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  opacity: number;
  scale: number;
  color: string;
  size: number;
  lifetime: number;
}

interface ShapeState {
  scale: number;
  rotation: number;
  glowing: boolean;
  colorIndex: number;
  hasTrail: boolean;
}

// Enhanced color palettes for shapes
const COLOR_PALETTES = [
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  ['#FD79A8', '#FDCB6E', '#6C5CE7', '#A29BFE', '#74B9FF'],
  ['#FF7675', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'],
  ['#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#A29BFE'],
];

// Musical notes for sound feedback
const MUSICAL_NOTES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
];

/**
 * Enhanced Basic Shapes Animation with Physics and Particles
 *
 * This animation renders geometric shapes with advanced interactions:
 * - Physics simulation with gravity and collisions
 * - Particle effects and trails
 * - Multi-touch gestures (tap, double-tap, long-press, pinch)
 * - Sound feedback and haptics
 * - Dynamic color transitions
 */
function BasicShapesAnimation({
  animationValue,
  rotationValue,
  scaleValue,
  elements,
  styles,
  width,
  height,
  onAnimationLoaded,
}: AnimationProps) {

  const [shapePositions, setShapePositions] = useState<ShapePosition[]>([]);
  const [dragStates, setDragStates] = useState<DragState[]>([]);
  const [shapePhysics, setShapePhysics] = useState<ShapePhysics[]>([]);
  const [shapeStates, setShapeStates] = useState<ShapeState[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [backgroundGradient, setBackgroundGradient] = useState(0);


  // Animation frame reference for future use
  // const animationFrame = useRef<number | null>(null);
  const physicsTimer = useRef<NodeJS.Timeout | null>(null);
  const particleCounter = useRef<number>(0);

  // Initialize shape positions, physics, and states
  useEffect(() => {
    const initialPositions = elements.map((element, index) => {
      // Start shapes gently from different heights for staggered entrance
      const baseY = screenHeight * 0.3; // Start from upper third instead of top
      const randomOffset = (Math.random() - 0.5) * 100; // Small random variation
      return {
        x: (element.properties.position?.x || 0.2 + (index * 0.15)) * screenWidth,
        y: baseY + randomOffset,
      };
    });
    
    const initialDragStates = elements.map(() => ({
      isDragging: false,
      startX: 0,
      startY: 0,
    }));
    
    const initialPhysics = elements.map((_, index) => ({
      velocityX: (Math.random() - 0.5) * 1, // Much gentler initial movement
      velocityY: Math.random() * 0.5, // Very gentle downward drift
      mass: 1,
      bounciness: 0.3, // Softer bouncing
    }));
    
    const initialStates = elements.map(() => ({
      scale: 1,
      rotation: 0,
      glowing: false,
      colorIndex: 0,
      hasTrail: false,
    }));
    
    setShapePositions(initialPositions);
    setDragStates(initialDragStates);
    setShapePhysics(initialPhysics);
    setShapeStates(initialStates);
    
    console.log('🎯 Initialized enhanced shapes with physics');
  }, [elements]);

  // Create particle explosion effect
  const createParticleExplosion = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 3 + Math.random() * 7;
      
      // Use incrementing counter for guaranteed unique IDs
      particleCounter.current += 1;
      const uniqueId = `particle-${Date.now()}-${particleCounter.current}-${Math.random().toString(36).substr(2, 5)}`;
      
      const particle: Particle = {
        id: uniqueId,
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        opacity: 1,
        scale: 1,
        color: color,
        size: 5 + Math.random() * 10,
        lifetime: 60, // 60 frames = ~1 second at 60fps
      };
      
      newParticles.push(particle);
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    // Removed haptic feedback from particle explosion
  }, []);

  // Play sound effect
  const playSound = useCallback(async (frequency: number) => {
    try {
      // Sound effect without haptic feedback
      // Removed vibration to reduce haptic feedback
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  // Update particles
  useEffect(() => {
    const updateParticles = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.3, // gravity
          opacity: Math.max(0, particle.opacity - 0.02),
          scale: Math.max(0, particle.scale - 0.01),
          lifetime: particle.lifetime - 1,
        }))
        .filter(particle => particle.lifetime > 0)
      );
    };
    
    const particleTimer = setInterval(updateParticles, 16); // 60 FPS
    return () => clearInterval(particleTimer);
  }, []);

  // Physics simulation loop
  useEffect(() => {
    const runPhysics = () => {
      setShapePositions(prev => {
        // Create completely new arrays to avoid mutations
        const newPositions = prev.map(pos => ({ ...pos }));
        const physics = shapePhysics.map(p => ({ ...p }));
        
        // Update positions based on physics
        for (let i = 0; i < newPositions.length; i++) {
          if (dragStates[i]?.isDragging) continue;
          
          // Apply velocity (create new position object)
          const newX = newPositions[i].x + physics[i].velocityX;
          const newY = newPositions[i].y + physics[i].velocityY;
          
          // Apply gentle gravity (much softer)
          physics[i] = {
            ...physics[i],
            velocityY: physics[i].velocityY + 0.05
          };
          
          // Gentle bouncing with soft rebounds
          if (newX <= 50 || newX >= screenWidth - 50) {
            physics[i] = {
              ...physics[i],
              velocityX: physics[i].velocityX * -0.4 // Softer bounce
            };
            newPositions[i] = {
              x: Math.max(50, Math.min(screenWidth - 50, newX)),
              y: newY
            };
            playSound(MUSICAL_NOTES[i % MUSICAL_NOTES.length]);
          } else if (newY <= 50 || newY >= screenHeight - 100) {
            physics[i] = {
              ...physics[i],
              velocityY: physics[i].velocityY * -0.4 // Softer bounce
            };
            newPositions[i] = {
              x: newX,
              y: Math.max(50, Math.min(screenHeight - 100, newY))
            };
            playSound(MUSICAL_NOTES[(i + 2) % MUSICAL_NOTES.length]);
          } else {
            newPositions[i] = { x: newX, y: newY };
          }
          
          // Apply gentle air resistance for floating effect
          physics[i] = {
            ...physics[i],
            velocityX: physics[i].velocityX * 0.98,
            velocityY: physics[i].velocityY * 0.98
          };
          
          // Add gentle floating motion
          const time = Date.now() * 0.001; // Convert to seconds
          const floatOffset = Math.sin(time + i) * 0.5; // Gentle up/down motion
          physics[i] = {
            ...physics[i],
            velocityY: physics[i].velocityY + floatOffset * 0.02
          };
        }
        
        // Check collisions
        for (let i = 0; i < newPositions.length; i++) {
          for (let j = i + 1; j < newPositions.length; j++) {
            const dx = newPositions[i].x - newPositions[j].x;
            const dy = newPositions[i].y - newPositions[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = 80;
            
            if (distance < minDistance && distance > 0) {
              // Collision detected!
              const overlap = minDistance - distance;
              
              // Separate shapes (create new position objects)
              const separationX = (dx / distance) * overlap * 0.5;
              const separationY = (dy / distance) * overlap * 0.5;
              
              newPositions[i] = {
                x: newPositions[i].x + separationX,
                y: newPositions[i].y + separationY
              };
              newPositions[j] = {
                x: newPositions[j].x - separationX,
                y: newPositions[j].y - separationY
              };
              
              // Exchange velocities (elastic collision) - create new physics objects
              const tempVx = physics[i].velocityX;
              const tempVy = physics[i].velocityY;
              physics[i] = {
                ...physics[i],
                velocityX: physics[j].velocityX * 0.8,
                velocityY: physics[j].velocityY * 0.8
              };
              physics[j] = {
                ...physics[j],
                velocityX: tempVx * 0.8,
                velocityY: tempVy * 0.8
              };
              
              // Create particle effect at collision point
              const collisionX = (newPositions[i].x + newPositions[j].x) / 2;
              const collisionY = (newPositions[i].y + newPositions[j].y) / 2;
              const colors = COLOR_PALETTES[i % COLOR_PALETTES.length];
              createParticleExplosion(collisionX, collisionY, colors[2]);
            }
          }
        }
        
        setShapePhysics(physics);
        return newPositions;
      });
    };
    
    physicsTimer.current = setInterval(runPhysics, 16) as any; // 60 FPS
    
    return () => {
      if (physicsTimer.current) {
        clearInterval(physicsTimer.current);
      }
    };
  }, [dragStates, shapePhysics, playSound, createParticleExplosion]);



  // Cycle background gradient - slower, calmer transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setBackgroundGradient(prev => (prev + 1) % COLOR_PALETTES.length);
    }, 60000); // 1 minute instead of 5 seconds
    
    return () => clearInterval(timer);
  }, []);

  // Handle tap gesture for shape interaction
  const handleTap = (shapeIndex: number) => (event: any) => {
    if (event.nativeEvent.state === State.END) {
      console.log('👆 Shape tapped:', shapeIndex);
      
      // Play sound
      playSound(MUSICAL_NOTES[shapeIndex % MUSICAL_NOTES.length]);
      
      // Toggle glow effect and change color
      setShapeStates(prev => {
        const newStates = [...prev];
        newStates[shapeIndex] = {
          ...newStates[shapeIndex],
          glowing: !newStates[shapeIndex].glowing,
          colorIndex: (newStates[shapeIndex].colorIndex + 1) % COLOR_PALETTES[0].length,
          scale: 1.2,
        };
        return newStates;
      });
      
      // Animate scale back to normal
      setTimeout(() => {
        setShapeStates(prev => {
          const newStates = [...prev];
          newStates[shapeIndex] = {
            ...newStates[shapeIndex],
            scale: 1,
          };
          return newStates;
        });
      }, 200);
      
      // Create particle burst
      const pos = shapePositions[shapeIndex];
      const colors = COLOR_PALETTES[shapeIndex % COLOR_PALETTES.length];
      createParticleExplosion(pos.x, pos.y, colors[shapeStates[shapeIndex]?.colorIndex || 0]);
      
      // Minimal haptic feedback only on touch
      if (Platform.OS === 'ios') {
        Vibration.vibrate(5); // Reduced from 10ms to 5ms for minimal feedback
      }
    }
  };

  // Handle drag gesture for individual shapes
  const handleDrag = (shapeIndex: number) => (event: any) => {
    const { nativeEvent } = event;
    const { state, translationX, translationY, absoluteX, absoluteY } = nativeEvent;

    switch (state) {
      case State.BEGAN:
        console.log(`👆 Started dragging shape ${shapeIndex}`);
        
        setDragStates(prev => prev.map((dragState, index) => 
          index === shapeIndex 
            ? { ...dragState, isDragging: true, startX: absoluteX, startY: absoluteY }
            : dragState
        ));
        break;

      case State.ACTIVE:
        // Update position while dragging with reduced sensitivity for babies
        setShapePositions(prev => prev.map((pos, index) => {
          if (index === shapeIndex) {
            // Reduce sensitivity by 60% for gentler, calmer movement
            const dampedTranslationX = translationX * 0.4;
            const dampedTranslationY = translationY * 0.4;
            
            const newX = Math.max(25, Math.min(screenWidth - 25, pos.x + dampedTranslationX));
            const newY = Math.max(25, Math.min(screenHeight - 25, pos.y + dampedTranslationY));
            return { x: newX, y: newY }; // Always return new object
          }
          return { ...pos }; // Return copy even for unchanged positions
        }));
        break;

      case State.END:
      case State.CANCELLED:
      case State.FAILED:
        console.log(`👋 Finished dragging shape ${shapeIndex}`);
        if (state === State.END && dragStates[shapeIndex]) {
          // Gentler throw velocity for calmer physics
          const velocityX = (translationX * 0.3) / 10; // Reduced throw strength
          const velocityY = (translationY * 0.3) / 10;
          setShapePhysics(prev => {
            const newPhysics = [...prev];
            newPhysics[shapeIndex] = {
              ...newPhysics[shapeIndex],
              velocityX: Math.max(-8, Math.min(8, velocityX)), // Lower max velocity
              velocityY: Math.max(-8, Math.min(8, velocityY)),
            };
            return newPhysics;
          });
        }
        
        setDragStates(prev => prev.map((dragState, index) => 
          index === shapeIndex 
            ? { ...dragState, isDragging: false }
            : dragState
        ));
        // Play drop sound
        playSound(MUSICAL_NOTES[(shapeIndex + 4) % MUSICAL_NOTES.length]);
        

        break;
    }
  };



  // Notify parent when animation is loaded
  useEffect(() => {
    if (onAnimationLoaded) {
      onAnimationLoaded();
    }
  }, [onAnimationLoaded]);
  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.animationContainer}>
      {/* Gradient background - simple and stable */}
      <LinearGradient
        colors={COLOR_PALETTES[backgroundGradient] as [string, string, ...string[]]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Render particles */}
      {particles.map((particle) => (
        <View
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size * particle.scale,
            height: particle.size * particle.scale,
            borderRadius: (particle.size * particle.scale) / 2,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
        />
      ))}
      {elements.map((element, index) => {
        const { type, properties } = element;
        const { size, animations = {} } = properties;
        const shapePosition = shapePositions[index];
        const shapeState = shapeStates[index];

        if (!shapePosition) return null;

        const transforms = [];
        if (animations.rotate) {
          transforms.push({ rotate: rotation });
        }
        if (animations.scale) {
          transforms.push({ scale: scaleValue });
        }

        const opacityStyle = animations.opacity ? { opacity: animationValue } : {};

        // Calculate position from current shape position
        const dragState = dragStates[index];
        
        // Dynamic color from palette
        const colorPalette = COLOR_PALETTES[index % COLOR_PALETTES.length];
        const color = colorPalette[shapeState?.colorIndex || 0];
        
        // Calculate actual size with scale
        const actualSize = size * (shapeState?.scale || 1);

        // For shapes, we'll use absolute positioning with regular View wrapper
        const baseStyle = {
          position: 'absolute' as const,
          transform: transforms,
          ...opacityStyle,
          // Add visual feedback for dragging and glowing
          ...(dragState?.isDragging && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
          }),
          ...(shapeState?.glowing && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 5,
          }),
        };

        switch (type) {
          case 'circle':
            return (
              <TapGestureHandler
                key={`tap-${index}`}
                onHandlerStateChange={handleTap(index)}
                numberOfTaps={1}
              >
              <PanGestureHandler
                key={`pan-${index}`}
                onGestureEvent={handleDrag(index)}
                onHandlerStateChange={handleDrag(index)}
              >
                <View style={{
                  position: 'absolute',
                  left: shapePosition.x - actualSize / 2,
                  top: shapePosition.y - actualSize / 2,
                }}>
                  <Animated.View
                    style={[
                      styles.circle,
                      baseStyle,
                      {
                        width: actualSize,
                        height: actualSize,
                        backgroundColor: color,
                        borderRadius: actualSize / 2,
                      },
                    ]}
                  />
                </View>
              </PanGestureHandler>
              </TapGestureHandler>
            );
          case 'square':
            return (
              <TapGestureHandler
                key={`tap-${index}`}
                onHandlerStateChange={handleTap(index)}
                numberOfTaps={1}
              >
              <PanGestureHandler
                key={`pan-${index}`}
                onGestureEvent={handleDrag(index)}
                onHandlerStateChange={handleDrag(index)}
              >
                <View style={{
                  position: 'absolute',
                  left: shapePosition.x - actualSize / 2,
                  top: shapePosition.y - actualSize / 2,
                }}>
                  <Animated.View
                    style={[
                      styles.square,
                      baseStyle,
                      {
                        width: actualSize,
                        height: actualSize,
                        backgroundColor: color,
                        borderRadius: 10,
                      },
                    ]}
                  />
                </View>
              </PanGestureHandler>
              </TapGestureHandler>
            );
          case 'triangle':
            return (
              <TapGestureHandler
                key={`tap-${index}`}
                onHandlerStateChange={handleTap(index)}
                numberOfTaps={1}
              >
              <PanGestureHandler
                key={`pan-${index}`}
                onGestureEvent={handleDrag(index)}
                onHandlerStateChange={handleDrag(index)}
              >
                <View style={{
                  position: 'absolute',
                  left: shapePosition.x - actualSize / 2,
                  top: shapePosition.y - actualSize / 2,
                }}>
                  <Animated.View
                    style={[
                      styles.triangle,
                      baseStyle,
                      {
                        borderBottomWidth: actualSize,
                        borderLeftWidth: actualSize / 2,
                        borderRightWidth: actualSize / 2,
                        borderBottomColor: color,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                      },
                    ]}
                  />
                </View>
              </PanGestureHandler>
              </TapGestureHandler>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

export default React.memo(BasicShapesAnimation);
