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
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, UserPreferences, OutfitRecommendation, SwipeAction } from '../types';

type RecommendationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecommendationScreen'>;
type RecommendationScreenRouteProp = RouteProp<RootStackParamList, 'RecommendationScreen'>;

interface Props {
  navigation: RecommendationScreenNavigationProp;
  route: RecommendationScreenRouteProp;
}

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Mock data for demonstration
const MOCK_RECOMMENDATIONS: OutfitRecommendation[] = [
  {
    id: '1',
    items: [
      {
        id: 'item1',
        name: 'Elegant Black Dress',
        brand: 'Fashion Brand',
        price: 89.99,
        imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Dress',
        amazonUrl: 'https://amazon.com/dress1',
        category: 'top',
        colors: ['black'],
        sizes: ['S', 'M', 'L'],
      },
      {
        id: 'item2',
        name: 'Black Heels',
        brand: 'Shoe Brand',
        price: 129.99,
        imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Heels',
        amazonUrl: 'https://amazon.com/heels1',
        category: 'shoes',
        colors: ['black'],
        sizes: ['7', '8', '9', '10'],
      },
    ],
    imageUrl: 'https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Outfit+1',
    eventType: 'wedding',
    styleDescription: 'Elegant black dress with matching heels',
    confidence: 0.85,
  },
  {
    id: '2',
    items: [
      {
        id: 'item3',
        name: 'Navy Blazer',
        brand: 'Professional Brand',
        price: 149.99,
        imageUrl: 'https://via.placeholder.com/300x400/000080/FFFFFF?text=Navy+Blazer',
        amazonUrl: 'https://amazon.com/blazer1',
        category: 'top',
        colors: ['navy'],
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        id: 'item4',
        name: 'White Dress Shirt',
        brand: 'Shirt Brand',
        price: 49.99,
        imageUrl: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+Shirt',
        amazonUrl: 'https://amazon.com/shirt1',
        category: 'top',
        colors: ['white'],
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        id: 'item5',
        name: 'Dress Pants',
        brand: 'Pants Brand',
        price: 79.99,
        imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Dress+Pants',
        amazonUrl: 'https://amazon.com/pants1',
        category: 'bottom',
        colors: ['black', 'navy'],
        sizes: ['30', '32', '34', '36'],
      },
    ],
    imageUrl: 'https://via.placeholder.com/300x400/4f46e5/FFFFFF?text=Outfit+2',
    eventType: 'business',
    styleDescription: 'Professional navy blazer with white shirt and dress pants',
    confidence: 0.92,
  },
  {
    id: '3',
    items: [
      {
        id: 'item6',
        name: 'Casual T-Shirt',
        brand: 'Casual Brand',
        price: 24.99,
        imageUrl: 'https://via.placeholder.com/300x400/ff6b6b/FFFFFF?text=Casual+T-Shirt',
        amazonUrl: 'https://amazon.com/tshirt1',
        category: 'top',
        colors: ['red', 'blue', 'white'],
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        id: 'item7',
        name: 'Blue Jeans',
        brand: 'Jeans Brand',
        price: 59.99,
        imageUrl: 'https://via.placeholder.com/300x400/4dabf7/FFFFFF?text=Blue+Jeans',
        amazonUrl: 'https://amazon.com/jeans1',
        category: 'bottom',
        colors: ['blue'],
        sizes: ['28', '30', '32', '34', '36'],
      },
      {
        id: 'item8',
        name: 'Sneakers',
        brand: 'Shoe Brand',
        price: 89.99,
        imageUrl: 'https://via.placeholder.com/300x400/51cf66/FFFFFF?text=Sneakers',
        amazonUrl: 'https://amazon.com/sneakers1',
        category: 'shoes',
        colors: ['white', 'black'],
        sizes: ['7', '8', '9', '10', '11'],
      },
    ],
    imageUrl: 'https://via.placeholder.com/300x400/51cf66/FFFFFF?text=Outfit+3',
    eventType: 'casual',
    styleDescription: 'Casual t-shirt with blue jeans and sneakers',
    confidence: 0.78,
  },
];

export default function RecommendationScreen({ navigation, route }: Props) {
  const { preferences } = route.params;
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeActions, setSwipeActions] = useState<SwipeAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const translateX = new Animated.Value(0);
  const opacity = new Animated.Value(1);

  useEffect(() => {
    // Simulate loading recommendations from Gray Whale algorithm
    setTimeout(() => {
      setRecommendations(MOCK_RECOMMENDATIONS);
      setIsLoading(false);
    }, 1500);
  }, []);

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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding your perfect outfits...</Text>
        <Text style={styles.loadingSubtext}>Using Gray Whale algorithm</Text>
      </View>
    );
  }

  if (currentIndex >= recommendations.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No more recommendations!</Text>
        <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
          <Text style={styles.actionButtonText}>View Liked Items</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentOutfit = recommendations[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventType}>{preferences.eventType.toUpperCase()}</Text>
        <Text style={styles.stylePrompt}>"{preferences.stylePrompt}"</Text>
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
          <Text style={styles.actionButtonText}>👎</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.purchaseButton]}
          onPress={handlePurchase}
        >
          <Text style={styles.actionButtonText}>🛒</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
        >
          <Text style={styles.actionButtonText}>👍</Text>
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
    </View>
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
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  stylePrompt: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
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
    backgroundColor: '#6366f1',
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
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});
