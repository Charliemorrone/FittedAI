import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, UserPreferences, OutfitRecommendation, SwipeAction } from '../types';

type RecommendationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecommendationScreen'>;
type RecommendationScreenRouteProp = RouteProp<RootStackParamList, 'RecommendationScreen'>;

interface Props {
  navigation: RecommendationScreenNavigationProp;
  route: RecommendationScreenRouteProp;
}

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Enhanced mock data with better Gray Whale simulation
const generateMockRecommendations = (preferences: UserPreferences): OutfitRecommendation[] => {
  const baseRecommendations = [
    {
      id: 'gw_rec_001',
      items: [
        {
          id: 'amz_B08N5WRWNW',
          name: 'Elegant Midi Dress',
          brand: 'Calvin Klein',
          price: 89.99,
          imageUrl: 'https://via.placeholder.com/300x400/1a1a2e/FFFFFF?text=Elegant+Dress',
          amazonUrl: 'https://amazon.com/dp/B08N5WRWNW',
          category: 'top' as const,
          colors: ['black', 'navy'],
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
        },
        {
          id: 'amz_B07QXYZ123',
          name: 'Block Heel Pumps',
          brand: 'Naturalizer',
          price: 79.99,
          imageUrl: 'https://via.placeholder.com/300x400/2d3436/FFFFFF?text=Block+Heels',
          amazonUrl: 'https://amazon.com/dp/B07QXYZ123',
          category: 'shoes' as const,
          colors: ['black', 'nude'],
          sizes: ['6', '7', '8', '9', '10'],
        },
      ],
      imageUrl: 'https://via.placeholder.com/300x500/6366f1/FFFFFF?text=Gray+Whale+Match+95%25',
      eventType: preferences.eventType,
      styleDescription: `Perfect match for "${preferences.stylePrompt}" - Sophisticated and elegant`,
      confidence: 0.95,
    },
    {
      id: 'gw_rec_002',
      items: [
        {
          id: 'amz_B09ABC456',
          name: 'Tailored Blazer',
          brand: 'Theory',
          price: 198.00,
          imageUrl: 'https://via.placeholder.com/300x400/2c3e50/FFFFFF?text=Tailored+Blazer',
          amazonUrl: 'https://amazon.com/dp/B09ABC456',
          category: 'top' as const,
          colors: ['navy', 'charcoal', 'black'],
          sizes: ['XS', 'S', 'M', 'L'],
        },
        {
          id: 'amz_B08DEF789',
          name: 'Silk Blouse',
          brand: 'Equipment',
          price: 128.00,
          imageUrl: 'https://via.placeholder.com/300x400/ecf0f1/2c3e50?text=Silk+Blouse',
          amazonUrl: 'https://amazon.com/dp/B08DEF789',
          category: 'top' as const,
          colors: ['white', 'cream', 'blush'],
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
        },
        {
          id: 'amz_B07GHI012',
          name: 'Straight Leg Trousers',
          brand: 'Banana Republic',
          price: 89.50,
          imageUrl: 'https://via.placeholder.com/300x400/34495e/FFFFFF?text=Trousers',
          amazonUrl: 'https://amazon.com/dp/B07GHI012',
          category: 'bottom' as const,
          colors: ['navy', 'black', 'charcoal'],
          sizes: ['0', '2', '4', '6', '8', '10', '12'],
        },
      ],
      imageUrl: 'https://via.placeholder.com/300x500/4f46e5/FFFFFF?text=Gray+Whale+Match+88%25',
      eventType: preferences.eventType,
      styleDescription: `Professional ensemble matching your style - Modern and polished`,
      confidence: 0.88,
    },
    {
      id: 'gw_rec_003',
      items: [
        {
          id: 'amz_B06JKL345',
          name: 'Cashmere Sweater',
          brand: 'Everlane',
          price: 118.00,
          imageUrl: 'https://via.placeholder.com/300x400/e17055/FFFFFF?text=Cashmere+Sweater',
          amazonUrl: 'https://amazon.com/dp/B06JKL345',
          category: 'top' as const,
          colors: ['camel', 'cream', 'navy', 'black'],
          sizes: ['XS', 'S', 'M', 'L'],
        },
        {
          id: 'amz_B05MNO678',
          name: 'High-Waisted Jeans',
          brand: 'Levi\'s',
          price: 69.50,
          imageUrl: 'https://via.placeholder.com/300x400/3498db/FFFFFF?text=High+Waist+Jeans',
          amazonUrl: 'https://amazon.com/dp/B05MNO678',
          category: 'bottom' as const,
          colors: ['dark wash', 'light wash', 'black'],
          sizes: ['24', '25', '26', '27', '28', '29', '30'],
        },
        {
          id: 'amz_B04PQR901',
          name: 'White Leather Sneakers',
          brand: 'Adidas',
          price: 85.00,
          imageUrl: 'https://via.placeholder.com/300x400/2ecc71/FFFFFF?text=White+Sneakers',
          amazonUrl: 'https://amazon.com/dp/B04PQR901',
          category: 'shoes' as const,
          colors: ['white', 'off-white'],
          sizes: ['5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'],
        },
      ],
      imageUrl: 'https://via.placeholder.com/300x500/10b981/FFFFFF?text=Gray+Whale+Match+82%25',
      eventType: preferences.eventType,
      styleDescription: `Casual chic inspired by your preferences - Comfortable yet stylish`,
      confidence: 0.82,
    },
  ];

  return baseRecommendations;
};

export default function RecommendationScreen({ navigation, route }: Props) {
  const { preferences } = route.params;
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeActions, setSwipeActions] = useState<SwipeAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const translateX = new Animated.Value(0);
  const opacity = new Animated.Value(1);
  const scale = new Animated.Value(1);
  
  // Button feedback animations
  const likeButtonScale = useRef(new Animated.Value(1)).current;
  const dislikeButtonScale = useRef(new Animated.Value(1)).current;
  const likeButtonOpacity = useRef(new Animated.Value(0.7)).current;
  const dislikeButtonOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Simulate Gray Whale algorithm processing
    setTimeout(() => {
      const mockRecommendations = generateMockRecommendations(preferences);
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }, 2500); // Longer delay to show the enhanced loading screen
  }, [preferences]);

  // Button animation helpers
  const animateButton = (buttonScale: Animated.Value, buttonOpacity: Animated.Value, isLike: boolean) => {
    // Scale and highlight animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentOutfit = recommendations[currentIndex];
    if (!currentOutfit) return;

    // Animate corresponding button
    if (direction === 'right') {
      animateButton(likeButtonScale, likeButtonOpacity, true);
    } else {
      animateButton(dislikeButtonScale, dislikeButtonOpacity, false);
    }

    const action: SwipeAction = {
      outfitId: currentOutfit.id,
      action: direction === 'right' ? 'like' : 'dislike',
      timestamp: Date.now(),
    };

    setSwipeActions(prev => [...prev, action]);

    // Animate card out with enhanced animations
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction === 'right' ? width * 1.2 : -width * 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next recommendation
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(currentIndex + 1);
        translateX.setValue(0);
        opacity.setValue(1);
        scale.setValue(1);
      } else {
        // No more recommendations, show purchase option
        Alert.alert(
          'All Done!',
          'You\'ve seen all recommendations. Would you like to purchase any liked items?',
          [
            { text: 'Keep Browsing', style: 'cancel' },
            { text: 'View Purchases', onPress: handlePurchase },
          ]
        );
      }
    });
  };

  const handlePurchase = () => {
    const likedOutfits = swipeActions
      .filter(action => action.action === 'like')
      .map(action => action.outfitId);

    if (likedOutfits.length === 0) {
      Alert.alert('No Items Selected', 'Please like some outfits before purchasing.');
      return;
    }

    const likedRecommendations = recommendations.filter(rec => likedOutfits.includes(rec.id));
    const totalPrice = likedRecommendations.reduce((sum, rec) => 
      sum + rec.items.reduce((itemSum, item) => itemSum + item.price, 0), 0
    );

    const purchaseItem = {
      outfitId: 'purchase_' + Date.now(),
      items: likedRecommendations.flatMap(rec => rec.items),
      totalPrice,
      amazonUrls: likedRecommendations.flatMap(rec => rec.items.map(item => item.amazonUrl)),
    };

    navigation.navigate('PurchaseScreen', { purchaseItem });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Consider both distance and velocity for more natural swipe detection
      const shouldSwipe = Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 800;
      
      if (shouldSwipe) {
        handleSwipe(translationX > 0 ? 'right' : 'left');
      } else {
        // Snap back to center with spring animation
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    } else if (event.nativeEvent.state === State.ACTIVE) {
      // Add subtle scale effect during drag
      const dragScale = 1 - Math.abs(event.nativeEvent.translationX) / (width * 3);
      scale.setValue(Math.max(0.95, dragScale));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="sparkles" size={32} color="#ffffff" />
          </View>
          <Text style={styles.loadingText}>Gray Whale is analyzing your style...</Text>
          <Text style={styles.loadingSubtext}>
            • Processing your reference photo{'\n'}
            • Understanding your style preferences{'\n'}
            • Finding matching outfits from our database{'\n'}
            • Generating personalized recommendations
          </Text>
          <View style={styles.progressIndicator}>
            <View style={styles.progressBar} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= recommendations.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text style={styles.emptyText}>All done!</Text>
          <Text style={styles.emptySubtext}>You've seen all recommendations</Text>
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <Ionicons name="bag" size={20} color="#ffffff" />
            <Text style={styles.purchaseButtonText}>View Liked Items</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentOutfit = recommendations[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Style Matches</Text>
        </View>
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentIndex + 1}/{recommendations.length}
          </Text>
        </View>
      </View>

      {/* Card Stack Container */}
      <View style={styles.cardStackContainer}>
        {/* Background Cards for Stack Effect */}
        {currentIndex + 1 < recommendations.length && (
          <View style={[styles.outfitCard, styles.backgroundCard, { transform: [{ scale: 0.95 }] }]}>
            <Image 
              source={{ uri: recommendations[currentIndex + 1].imageUrl }} 
              style={styles.outfitImage} 
            />
          </View>
        )}
        
        {/* Main Swipeable Card */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.outfitCard,
              styles.mainCard,
              {
                transform: [
                  { translateX },
                  { scale },
                  { 
                    rotate: translateX.interpolate({
                      inputRange: [-width, 0, width],
                      outputRange: ['-15deg', '0deg', '15deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                opacity,
              },
            ]}
          >
            <Image source={{ uri: currentOutfit.imageUrl }} style={styles.outfitImage} />
            
            {/* Swipe Indicators */}
            <Animated.View 
              style={[
                styles.swipeIndicator,
                styles.likeIndicator,
                {
                  opacity: translateX.interpolate({
                    inputRange: [0, width / 4],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            >
              <Ionicons name="heart" size={32} color="#10b981" />
              <Text style={[styles.indicatorText, { color: '#10b981' }]}>LIKE</Text>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.swipeIndicator,
                styles.dislikeIndicator,
                {
                  opacity: translateX.interpolate({
                    inputRange: [-width / 4, 0],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            >
              <Ionicons name="close" size={32} color="#ef4444" />
              <Text style={[styles.indicatorText, { color: '#ef4444' }]}>PASS</Text>
            </Animated.View>

            {/* Outfit Info Overlay */}
            <View style={styles.outfitInfoOverlay}>
              <Text style={styles.outfitDescription}>{currentOutfit.styleDescription}</Text>
              <Text style={styles.confidence}>
                {Math.round(currentOutfit.confidence * 100)}% Match
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <Animated.View style={{ transform: [{ scale: dislikeButtonScale }], opacity: dislikeButtonOpacity }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dislikeButton]}
            onPress={() => handleSwipe('left')}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-down" size={24} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.actionButton, styles.shopButton]}
          onPress={handlePurchase}
          activeOpacity={0.8}
        >
          <Ionicons name="bag" size={24} color="#ffffff" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: likeButtonScale }], opacity: likeButtonOpacity }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe('right')}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={24} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  // New Modern Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  progressIndicator: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  // Card Stack Container
  cardStackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  outfitCard: {
    width: width - 40,
    height: height * 0.65,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 15,
    overflow: 'hidden',
    position: 'absolute',
  },
  backgroundCard: {
    opacity: 0.8,
    zIndex: 1,
  },
  mainCard: {
    zIndex: 2,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Swipe Indicators
  swipeIndicator: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  likeIndicator: {
    right: 30,
  },
  dislikeIndicator: {
    left: 30,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  // Outfit Info Overlay
  outfitInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 24,
  },
  outfitDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 24,
  },
  confidence: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  // Bottom Action Bar
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 16,
  },
  dislikeButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#10b981',
  },
  shopButton: {
    backgroundColor: '#6366f1',
    width: 72,
    height: 72,
    borderRadius: 36,
    marginHorizontal: 20,
  },
  purchaseButton: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
