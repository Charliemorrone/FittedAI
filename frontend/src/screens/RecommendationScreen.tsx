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
  Linking,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, UserPreferences, OutfitRecommendation, SwipeAction, OutfitItem } from '../types';
import GrayWhaleService from '../services/grayWhaleService';
// Import collections data directly as JSON
import collectionsData from '../assets/images/collections.json';

type RecommendationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecommendationScreen'>;
type RecommendationScreenRouteProp = RouteProp<RootStackParamList, 'RecommendationScreen'>;

interface Props {
  navigation: RecommendationScreenNavigationProp;
  route: RecommendationScreenRouteProp;
}

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 1000;
const ROTATION_MULTIPLIER = 0.1;
const SCALE_MULTIPLIER = 0.05;

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
  const [swipeCount, setSwipeCount] = useState(0);
  const [isCollectionsMode, setIsCollectionsMode] = useState(false);
  const [collections, setCollections] = useState<Array<any>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation values for current card
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Next card animations
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.8)).current;
  
  // Button feedback animations
  const likeButtonScale = useRef(new Animated.Value(1)).current;
  const dislikeButtonScale = useRef(new Animated.Value(1)).current;
  const likeButtonOpacity = useRef(new Animated.Value(0.7)).current;
  const dislikeButtonOpacity = useRef(new Animated.Value(0.7)).current;
  
  // Swipe indicators
  const likeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const dislikeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const likeIndicatorScale = useRef(new Animated.Value(0.8)).current;
  const dislikeIndicatorScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Try to load local collections first
        const sets = Array.isArray(collectionsData?.sets) ? collectionsData.sets : [];
        if (isMounted && sets.length > 0) {
          setCollections(sets);
          setIsCollectionsMode(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // If reading local collections fails, proceed with API
      }
      try {
        const recs = await GrayWhaleService.getRecommendations(preferences);
        if (isMounted) {
          setRecommendations(recs);
        }
      } catch (e) {
        if (isMounted) {
          const fallback = generateMockRecommendations(preferences);
          setRecommendations(fallback);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [preferences]);

  // Helper function to extract ASIN from Amazon URL and generate multiple image URL options
  const getAmazonImageUrls = (amazonUrl: string): string[] => {
    const imageUrls: string[] = [];
    
    try {
      let urlToProcess = amazonUrl;
      
      // Handle URL-encoded Amazon URLs (like the sponsored links)
      if (amazonUrl.includes('url=') || amazonUrl.includes('%2F')) {
        try {
          // Extract the actual URL from sponsored/tracking URLs
          const urlMatch = amazonUrl.match(/url=([^&]+)/);
          if (urlMatch) {
            urlToProcess = decodeURIComponent(urlMatch[1]);
            // Convert %2F back to /
            urlToProcess = urlToProcess.replace(/%2F/g, '/');
            // Ensure it starts with https://
            if (urlToProcess.startsWith('/')) {
              urlToProcess = 'https://www.amazon.com' + urlToProcess;
            }
          }
        } catch (e) {
          console.log('Error decoding URL:', e);
        }
      }
      
      console.log('Processing URL:', urlToProcess);
      
      // Extract ASIN from various Amazon URL formats
      const asinPatterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i,
        /asin=([A-Z0-9]{10})/i,
        /\/([A-Z0-9]{10})(?:\/|\?|$)/i
      ];
      
      let asin = null;
      for (const pattern of asinPatterns) {
        const match = urlToProcess.match(pattern);
        if (match && match[1]) {
          asin = match[1];
          console.log('Found ASIN:', asin, 'using pattern:', pattern);
          break;
        }
      }
      
      if (asin) {
        // Try multiple Amazon image URL formats
        imageUrls.push(
          // Standard Amazon image URLs
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SX300_SY300_QL70_.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._AC_SX300_SY300_.jpg`,
          `https://m.media-amazon.com/images/P/${asin}.01._AC_SX300_SY300_.jpg`,
          `https://m.media-amazon.com/images/P/${asin}.01.L.jpg`,
          // Alternative formats
          `https://images-na.ssl-images-amazon.com/images/I/${asin}.01.L.jpg`,
          `https://images.amazon.com/images/P/${asin}.01.L.jpg`,
          // Smaller sizes as fallback
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SX200_.jpg`,
          `https://m.media-amazon.com/images/P/${asin}.01._SX200_.jpg`
        );
        console.log('Generated', imageUrls.length, 'image URLs for ASIN:', asin);
      } else {
        console.log('No ASIN found in URL:', urlToProcess);
      }
    } catch (error) {
      console.log('Error extracting ASIN from URL:', amazonUrl, error);
    }
    
    return imageUrls;
  };

  const getAmazonImageUrl = (amazonUrl: string, itemTitle: string): string => {
    const imageUrls = getAmazonImageUrls(amazonUrl);
    
    // Return the first URL to try, the PurchaseScreen will handle fallbacks
    if (imageUrls.length > 0) {
      return imageUrls[0];
    }
    
    // Fallback to placeholder with item title
    const imageText = itemTitle.length > 20 ? itemTitle.substring(0, 20) + '...' : itemTitle;
    return `https://via.placeholder.com/300x400/6366f1/FFFFFF?text=${encodeURIComponent(imageText)}`;
  };

  // Animation helper functions
  const resetCardAnimations = () => {
    translateX.setValue(0);
    rotate.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);
    likeIndicatorOpacity.setValue(0);
    dislikeIndicatorOpacity.setValue(0);
    likeIndicatorScale.setValue(0.8);
    dislikeIndicatorScale.setValue(0.8);
  };

  const animateNextCard = () => {
    Animated.parallel([
      Animated.spring(nextCardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(nextCardOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      // Reset next card for the following card
      nextCardScale.setValue(0.95);
      nextCardOpacity.setValue(0.8);
    });
  };

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

  const handleSwipe = (direction: 'left' | 'right', velocity: number = 0) => {
    const currentSetLocal = isCollectionsMode ? collections[currentIndex] : null;
    const currentOutfit = !isCollectionsMode ? recommendations[currentIndex] : null;
    const currentId = isCollectionsMode ? (currentSetLocal?.id || '') : (currentOutfit?.id || '');
    if (!currentId) return;

    // Prevent multiple swipes on the same card or during animation
    const totalCount = isCollectionsMode ? collections.length : recommendations.length;
    if (currentIndex >= totalCount || isAnimating) return;

    setIsAnimating(true);

    // Animate corresponding button
    if (direction === 'right') {
      animateButton(likeButtonScale, likeButtonOpacity, true);
    } else {
      animateButton(dislikeButtonScale, dislikeButtonOpacity, false);
    }

    const action: SwipeAction = {
      outfitId: currentId,
      action: direction === 'right' ? 'like' : 'dislike',
      timestamp: Date.now(),
    };

    setSwipeActions(prev => [...prev, action]);
    // Fire-and-forget feedback to backend
    if (!isCollectionsMode) {
      GrayWhaleService.sendFeedback([action]);
    }

    // Calculate animation duration based on velocity
    const baseDuration = 300;
    const velocityFactor = Math.min(Math.abs(velocity) / 2000, 1);
    const duration = Math.max(baseDuration - (velocityFactor * 150), 150);

    // Enhanced swipe out animation - strictly horizontal
    const exitX = direction === 'right' ? width * 1.5 : -width * 1.5;
    const exitRotation = direction === 'right' ? 30 : -30;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: exitX,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: exitRotation,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next card
      const lastIndex = isCollectionsMode ? collections.length - 1 : recommendations.length - 1;
      if (currentIndex < lastIndex) {
        setCurrentIndex(currentIndex + 1);
        resetCardAnimations();
        animateNextCard();
        setIsAnimating(false);
        // Update swipe count after animation completes
        setSwipeCount((c) => c + 1);
      } else {
        setIsAnimating(false);
        // Update swipe count after animation completes
        setSwipeCount((c) => c + 1);
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

  // Auto-refresh after every 5 swipes (less aggressive to avoid animation conflicts)
  useEffect(() => {
    if (!isLoading && !isCollectionsMode && swipeCount > 0 && swipeCount % 5 === 0) {
      // Add a delay to ensure animations complete and avoid conflicts
      const refreshTimer = setTimeout(async () => {
        // Double-check we're not animating before refreshing
        if (!isAnimating) {
          try {
            // Re-fetch recommendations. Backend uses prior feedback events to re-rank.
            const updated = await GrayWhaleService.getRecommendations(preferences);
            // Replace remaining stack with updated items
            setRecommendations(updated);
            setCurrentIndex(0);
            resetCardAnimations();
          } catch (e) {
            // Non-fatal; keep current stack
          }
        }
      }, 1000); // Wait 1 second to ensure all animations are complete

      return () => clearTimeout(refreshTimer);
    }
  }, [swipeCount]);

  const handlePurchase = () => {
    // Get the current outfit being viewed
    const totalCount = isCollectionsMode ? collections.length : recommendations.length;
    if (currentIndex >= totalCount) {
      Alert.alert('No Outfit Available', 'No outfit is currently being displayed.');
      return;
    }

    let purchaseItems: OutfitItem[] = [];
    let totalPrice = 0;
    let currentOutfitId = '';

    if (isCollectionsMode) {
      // Handle current collection being viewed
      const currentCollection = collections[currentIndex];
      if (!currentCollection) {
        Alert.alert('No Outfit Available', 'No outfit is currently being displayed.');
        return;
      }

      currentOutfitId = currentCollection.id;
      
      // Convert current collection items to OutfitItem format
      Object.keys(currentCollection.items).forEach((itemType, index) => {
        const item = currentCollection.items[itemType];
        
        // Extract brand from title if possible
        const titleParts = item.title.split(' ');
        const possibleBrand = titleParts.length > 1 ? titleParts[0] : 'Brand';
        
        // Estimate price based on item type
        const estimatedPrice = itemType === 'kurta' ? 45 : 
                              itemType === 'pants' ? 35 : 
                              itemType === 'shoes' ? 55 : 
                              itemType === 'accessory' ? 25 : 0;
        
        const outfitItem: OutfitItem = {
          id: item.id,
          name: item.title,
          brand: possibleBrand,
          price: estimatedPrice,
          imageUrl: getAmazonImageUrl(item.external_url, item.title),
          amazonUrl: item.external_url,
          // Add custom property for multiple image URLs (we'll extend the type)
          alternativeImageUrls: getAmazonImageUrls(item.external_url),
          category: itemType === 'kurta' ? 'top' : 
                   itemType === 'pants' ? 'bottom' : 
                   itemType === 'shoes' ? 'shoes' : 'accessories',
          colors: itemType === 'kurta' ? ['Red', 'Multi'] : 
                 itemType === 'pants' ? ['Multi', 'Cotton'] : 
                 itemType === 'shoes' ? ['Brown', 'Multi'] : 
                 ['Cream', 'Traditional'],
          sizes: itemType === 'kurta' ? ['S', 'M', 'L', 'XL'] : 
                itemType === 'pants' ? ['30', '32', '34', '36'] : 
                itemType === 'shoes' ? ['8', '9', '10', '11'] : 
                ['One Size'],
        };
        purchaseItems.push(outfitItem);
        totalPrice += estimatedPrice;
      });
    } else {
      // Handle current recommendation being viewed
      const currentRecommendation = recommendations[currentIndex];
      if (!currentRecommendation) {
        Alert.alert('No Outfit Available', 'No outfit is currently being displayed.');
        return;
      }

      currentOutfitId = currentRecommendation.id;
      purchaseItems = [...currentRecommendation.items];
      totalPrice = currentRecommendation.items.reduce((sum, item) => sum + item.price, 0);
    }

    const purchaseItem = {
      outfitId: currentOutfitId,
      items: purchaseItems,
      totalPrice,
      amazonUrls: purchaseItems.map(item => item.amazonUrl),
    };

    navigation.navigate('PurchaseScreen', { purchaseItem });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const { translationX } = event.nativeEvent;
        
        // Don't update animations during swipe animation
        if (isAnimating) return;
        
        // Calculate rotation based on horizontal movement only
        const rotationValue = translationX * ROTATION_MULTIPLIER;
        rotate.setValue(rotationValue);
        
        // Calculate scale based on horizontal distance only
        const scaleValue = Math.max(0.95, 1 - (Math.abs(translationX) * SCALE_MULTIPLIER) / 1000);
        scale.setValue(scaleValue);
        
        // Show swipe indicators based on direction and distance
        const swipeStrength = Math.abs(translationX) / SWIPE_THRESHOLD;
        
        if (translationX > 20) {
          // Swiping right (like)
          const indicatorOpacity = Math.min(swipeStrength, 1);
          const indicatorScale = 0.8 + (indicatorOpacity * 0.4);
          likeIndicatorOpacity.setValue(indicatorOpacity);
          likeIndicatorScale.setValue(indicatorScale);
          dislikeIndicatorOpacity.setValue(0);
          dislikeIndicatorScale.setValue(0.8);
        } else if (translationX < -20) {
          // Swiping left (dislike)
          const indicatorOpacity = Math.min(swipeStrength, 1);
          const indicatorScale = 0.8 + (indicatorOpacity * 0.4);
          dislikeIndicatorOpacity.setValue(indicatorOpacity);
          dislikeIndicatorScale.setValue(indicatorScale);
          likeIndicatorOpacity.setValue(0);
          likeIndicatorScale.setValue(0.8);
        } else {
          // Reset indicators
          likeIndicatorOpacity.setValue(0);
          dislikeIndicatorOpacity.setValue(0);
          likeIndicatorScale.setValue(0.8);
          dislikeIndicatorScale.setValue(0.8);
        }
        
        // Animate next card based on current card movement
        const nextCardScaleValue = 0.95 + (Math.abs(translationX) / width) * 0.05;
        const nextCardOpacityValue = 0.8 + (Math.abs(translationX) / width) * 0.2;
        nextCardScale.setValue(Math.min(nextCardScaleValue, 1));
        nextCardOpacity.setValue(Math.min(nextCardOpacityValue, 1));
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Don't process gestures during animation
      if (isAnimating) return;
      
      // Consider both distance and velocity for more natural swipe detection
      const shouldSwipe = Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD;
      
      if (shouldSwipe) {
        handleSwipe(translationX > 0 ? 'right' : 'left', velocityX);
      } else {
        // Snap back to center with spring animation - horizontal only
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
          }),
          Animated.timing(likeIndicatorOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dislikeIndicatorOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(likeIndicatorScale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dislikeIndicatorScale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(nextCardScale, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
          }),
          Animated.spring(nextCardOpacity, {
            toValue: 0.8,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
          }),
        ]).start();
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

  const totalCount = isCollectionsMode ? collections.length : recommendations.length;
  if (currentIndex >= totalCount) {
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

  const currentOutfit = isCollectionsMode ? null : recommendations[currentIndex];
  const currentSet = isCollectionsMode ? collections[currentIndex] : null;

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
            {currentIndex + 1}/{totalCount}
          </Text>
        </View>
      </View>

      {/* Card Stack Container */}
      <View style={styles.cardStackContainer}>
        {/* Background Cards for Stack Effect */}
        {(!isCollectionsMode && currentIndex + 1 < recommendations.length) && (
          <Animated.View 
            style={[
              styles.outfitCard, 
              styles.backgroundCard, 
              { 
                transform: [{ scale: nextCardScale }],
                opacity: nextCardOpacity,
              }
            ]}
          >
            <Image 
              source={{ uri: recommendations[currentIndex + 1].imageUrl }} 
              style={styles.outfitImage} 
            />
          </Animated.View>
        )}
        
        {/* Third card for deeper stack effect */}
        {(!isCollectionsMode && currentIndex + 2 < recommendations.length) && (
          <View style={[styles.outfitCard, styles.thirdCard]}>
            <Image 
              source={{ uri: recommendations[currentIndex + 2].imageUrl }} 
              style={styles.outfitImage} 
            />
          </View>
        )}
        
        {/* Main Swipeable Card */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-20, 20]}
          shouldCancelWhenOutside={false}
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
                    rotate: rotate.interpolate({
                      inputRange: [-30, 0, 30],
                      outputRange: ['-30deg', '0deg', '30deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                opacity,
              },
            ]}
          >
            {isCollectionsMode ? (
              <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={styles.collectionHeader}>
                  <Text style={styles.collectionTitle}>{currentSet?.title}</Text>
                </View>
                <View style={styles.collectionItems}>
                  {currentSet && Object.keys(currentSet.items).map((key) => {
                    const item = (currentSet as any).items[key];
                    return (
                      <TouchableOpacity key={item.id} style={styles.collectionItem} onPress={() => Linking.openURL(item.external_url)}>
                        <View style={styles.collectionItemIcon}>
                          <Ionicons name="pricetag" size={18} color="#111827" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.collectionItemTitle}>{item.title}</Text>
                          <Text style={styles.collectionItemSub}>{key}</Text>
                        </View>
                        <Ionicons name="open" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <>
                <Image source={{ uri: currentOutfit?.imageUrl || '' }} style={styles.outfitImage} />
                
                {/* Enhanced Swipe Indicators */}
                <Animated.View 
                  style={[
                    styles.swipeIndicator,
                    styles.likeIndicator,
                    {
                      opacity: likeIndicatorOpacity,
                      transform: [{ scale: likeIndicatorScale }],
                    }
                  ]}
                >
                  <View style={styles.indicatorIconContainer}>
                    <Ionicons name="heart" size={28} color="#10b981" />
                  </View>
                  <Text style={[styles.indicatorText, { color: '#10b981' }]}>LIKE</Text>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    styles.swipeIndicator,
                    styles.dislikeIndicator,
                    {
                      opacity: dislikeIndicatorOpacity,
                      transform: [{ scale: dislikeIndicatorScale }],
                    }
                  ]}
                >
                  <View style={styles.indicatorIconContainer}>
                    <Ionicons name="close" size={28} color="#ef4444" />
                  </View>
                  <Text style={[styles.indicatorText, { color: '#ef4444' }]}>PASS</Text>
                </Animated.View>

                {/* Outfit Info Overlay */}
                <View style={styles.outfitInfoOverlay}>
                  <Text style={styles.outfitDescription}>{currentOutfit?.styleDescription || 'Style Match'}</Text>
                  <Text style={styles.confidence}>
                    {Math.round((currentOutfit?.confidence || 0) * 100)}% Match
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <Animated.View style={{ transform: [{ scale: dislikeButtonScale }], opacity: dislikeButtonOpacity }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dislikeButton]}
            onPress={() => handleSwipe('left', 0)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.actionButton, styles.shopButton]}
          onPress={handlePurchase}
          activeOpacity={0.7}
        >
          <Ionicons name="bag" size={26} color="#ffffff" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: likeButtonScale }], opacity: likeButtonOpacity }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe('right', 0)}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={26} color="#ffffff" />
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
  thirdCard: {
    opacity: 0.6,
    zIndex: 0,
    transform: [{ scale: 0.9 }],
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
  indicatorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
  // Collection Styles
  collectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
  },
  collectionItems: {
    flex: 1,
    padding: 16,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  collectionItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  collectionItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 18,
  },
  collectionItemSub: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
});
