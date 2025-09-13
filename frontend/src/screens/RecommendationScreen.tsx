import React, { useState, useEffect } from 'react';
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

  const translateX = new Animated.Value(0);
  const opacity = new Animated.Value(1);

  useEffect(() => {
    // Simulate Gray Whale algorithm processing
    setTimeout(() => {
      const mockRecommendations = generateMockRecommendations(preferences);
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }, 2500); // Longer delay to show the enhanced loading screen
  }, [preferences]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentOutfit = recommendations[currentIndex];
    if (!currentOutfit) return;

    const action: SwipeAction = {
      outfitId: currentOutfit.id,
      action: direction === 'right' ? 'like' : 'dislike',
      timestamp: Date.now(),
    };

    setSwipeActions(prev => [...prev, action]);

    // Animate card out
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction === 'right' ? width : -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next recommendation
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(currentIndex + 1);
        translateX.setValue(0);
        opacity.setValue(1);
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
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        handleSwipe(translationX > 0 ? 'right' : 'left');
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Recommendations</Text>
          <Text style={styles.headerSubtitle}>"{preferences.stylePrompt}"</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.cardContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.outfitCard,
              {
                transform: [{ translateX }],
                opacity,
              },
            ]}
          >
            <Image source={{ uri: currentOutfit.imageUrl }} style={styles.outfitImage} />
            <View style={styles.outfitInfo}>
              <Text style={styles.outfitDescription}>{currentOutfit.styleDescription}</Text>
              <Text style={styles.confidence}>
                Confidence: {Math.round(currentOutfit.confidence * 100)}%
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={() => handleSwipe('left')}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.purchaseButton]}
          onPress={handlePurchase}
        >
          <Ionicons name="bag" size={20} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
        >
          <Ionicons name="heart" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {recommendations.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / recommendations.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
  progressIndicator: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
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
    backgroundColor: '#ffffff',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  outfitCard: {
    width: width - 40,
    height: height * 0.6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  outfitInfo: {
    padding: 20,
    height: '20%',
    justifyContent: 'center',
  },
  outfitDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dislikeButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#10b981',
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
  actionButtonText: {
    fontSize: 24,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});
