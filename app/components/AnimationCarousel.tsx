import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimationConfig } from '../utils/AnimationManager';
import { designTokens } from '../styles/designTokens';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.8, 320); // Wider cards like in reference
const CARD_HEIGHT = 220; // Taller cards like in reference
const CARD_SPACING = 20; // More spacing between cards

interface AnimationCarouselProps {
  animations: AnimationConfig[];
  selectedAnimation: string;
  onSelectAnimation: (id: string) => void;
}

const AnimationCarousel: React.FC<AnimationCarouselProps> = ({
  animations,
  selectedAnimation,
  onSelectAnimation,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(width);
  
  // Find the index of the selected animation
  const selectedIndex = animations.findIndex(anim => anim.id === selectedAnimation);
  
  // Handle container layout changes to ensure proper centering
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: newWidth } = event.nativeEvent.layout;
    setContainerWidth(newWidth);
  }, []);
  
  // Calculate item size based on container width
  const getItemLayout = useCallback((_: ArrayLike<AnimationConfig> | null | undefined, index: number) => ({
    length: CARD_WIDTH + CARD_SPACING,
    offset: (CARD_WIDTH + CARD_SPACING) * index,
    index,
  }), []);

  // Scroll to selected animation when it changes
  React.useEffect(() => {
    if (flatListRef.current && selectedIndex !== -1 && selectedIndex !== currentIndex) {
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5, // Center the item
      });
    }
  }, [selectedAnimation, selectedIndex, currentIndex]);

  // Note: useNativeDriver: false is required here because scroll events
  // need JS thread to read contentOffset.x for interpolation calculations.
  // To enable native driver, would need to migrate to react-native-reanimated.
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
    if (newIndex >= 0 && newIndex < animations.length) {
      setCurrentIndex(newIndex);
      
      if (animations[newIndex] && animations[newIndex].id !== selectedAnimation) {
        onSelectAnimation(animations[newIndex].id);
      }
    }
  };

  const renderItem = ({ item, index }: { item: AnimationConfig; index: number }) => {
    const isSelected = item.id === selectedAnimation;
    
    // Calculate animation values for scaling and opacity based on scroll position
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });
    
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [8, 0, 8],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAnimation(item.id)}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }, { translateY }],
              opacity,
              borderColor: isSelected ? designTokens.colors.primary : 'transparent',
            },
          ]}
        >
          <Image 
            source={item.thumbnailPath ? { uri: item.thumbnailPath } : item.thumbnail} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark" size={18} color={designTokens.colors.white} />
            </View>
          )}
          
          {/* Selection indicator at bottom */}
          {isSelected && <View style={styles.selectionIndicator} />}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={animations}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.carouselContent,
            { paddingHorizontal: (containerWidth - CARD_WIDTH) / 2 }
          ]}
          renderItem={renderItem}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          initialScrollIndex={selectedIndex > -1 ? selectedIndex : 0}
          getItemLayout={getItemLayout}
          snapToAlignment="center"
        />
      </View>
      
      {/* Pagination dots */}
      <View style={styles.pagination}>
        {animations.map((_, index) => (
          <TouchableOpacity 
            key={index}
            onPress={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index, animated: true });
              }
            }}
          >
            <View
              style={[
                styles.paginationDot,
                currentIndex === index && styles.paginationDotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: designTokens.spacing.md,
  },
  carouselContainer: {
    overflow: 'visible', // Allow cards to be visible outside container
  },
  carouselContent: {
    // Dynamic padding will be applied
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_SPACING,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: designTokens.colors.lightGray,
  },
  thumbnail: {
    width: '100%',
    height: 120, // Taller image area
    resizeMode: 'contain', // Center content without cropping
    backgroundColor: designTokens.colors.aliceBlue, // Light background for the image area
    padding: designTokens.spacing.lg,
  },
  cardContent: {
    padding: designTokens.spacing.lg,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center content like in reference
  },
  cardTitle: {
    fontSize: 20, // Larger title like in reference
    fontWeight: '700', // Bolder title like in reference
    marginBottom: 8,
    color: designTokens.colors.charcoal, // Darker font color for better contrast
    textAlign: 'center', // Center text like in reference
  },
  cardDescription: {
    fontSize: 14, // Slightly larger description
    color: designTokens.colors.charcoal, // Much darker for better contrast
    textAlign: 'center', // Center text like in reference
    marginHorizontal: designTokens.spacing.md,
  },
  selectedBadge: {
    position: 'absolute',
    top: designTokens.spacing.md,
    right: designTokens.spacing.md,
    backgroundColor: designTokens.colors.primary,
    borderRadius: 50, // Fully rounded like in reference
    padding: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: designTokens.colors.primary,
    borderBottomLeftRadius: 24, // Match card border radius
    borderBottomRightRadius: 24, // Match card border radius
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.mediumGray, // Darker color for better visibility
    marginHorizontal: 6, // Increased spacing between dots
    opacity: 0.8, // Higher opacity for better visibility
    borderWidth: 1, // Add border to make inactive dots more visible
    borderColor: designTokens.colors.mediumGray,
  },
  paginationDotActive: {
    backgroundColor: designTokens.colors.primary,
    width: 12, // Larger active dot
    height: 12, // Larger active dot
    borderRadius: 6, // Maintain circular shape
    opacity: 1, // Full opacity for active dot
    borderWidth: 0, // No border for active dot
  },
});

export default AnimationCarousel;
