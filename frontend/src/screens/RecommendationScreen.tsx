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
  Modal,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { RootStackParamList, UserPreferences, OutfitRecommendation, SwipeAction, OutfitItem } from '../types';
import GrayWhaleService from '../services/grayWhaleService';
import VeoService, { VeoVideoResponse } from '../services/veoService';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollectionsMode, setIsCollectionsMode] = useState(false);
  const [collections, setCollections] = useState<Array<any>>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [veoUnlocked, setVeoUnlocked] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoResponse, setVideoResponse] = useState<VeoVideoResponse | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [videoPollingInterval, setVideoPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  
  // Unlock notification animation
  const unlockNotificationOpacity = useRef(new Animated.Value(0)).current;
  const unlockNotificationTranslateY = useRef(new Animated.Value(-50)).current;

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
  
  // VEO button animations
  const veoButtonScale = useRef(new Animated.Value(0)).current;
  const veoButtonOpacity = useRef(new Animated.Value(0)).current;
  
  // Swipe indicators
  const likeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const dislikeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const likeIndicatorScale = useRef(new Animated.Value(0.8)).current;
  const dislikeIndicatorScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Priority 1: Try Gray Whale API first
        console.log('🐋 Attempting Gray Whale API call...');
        console.log('🐋 About to call Gray Whale API with preferences:', {
          eventType: preferences.eventType,
          stylePrompt: preferences.stylePrompt,
          grayWhaleProjectKey: preferences.grayWhaleProjectKey
        });
        
        const recs = await GrayWhaleService.getRecommendations(preferences, 1, 3);
        
        console.log('🐋 Gray Whale Service returned:', {
          recommendationsCount: recs?.length || 0,
          page: 1,
          batchSize: 3,
          firstRec: recs?.[0] ? {
            id: recs[0].id,
            styleDescription: recs[0].styleDescription,
            itemsCount: recs[0].items?.length || 0,
            firstItem: recs[0].items?.[0] ? {
              name: recs[0].items[0].name,
              amazonUrl: recs[0].items[0].amazonUrl
            } : null
          } : null
        });
        
        if (isMounted && recs && recs.length > 0) {
          console.log('✅ Gray Whale API successful, got', recs.length, 'recommendations');
          setRecommendations(recs);
          setCurrentPage(1);
          setIsCollectionsMode(false);
          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ Gray Whale API returned empty or no recommendations');
        }
      } catch (e) {
        console.warn('⚠️ Gray Whale API failed, trying fallbacks:', e);
      }

      try {
        // Priority 2: Try local collections as fallback
        console.log('📁 Trying local collections fallback...');
        const sets = Array.isArray(collectionsData?.sets) ? collectionsData.sets : [];
        if (isMounted && sets.length > 0) {
          console.log('✅ Using local collections,', sets.length, 'sets available');
          setCollections(sets);
          setIsCollectionsMode(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('⚠️ Local collections failed:', e);
      }

      // Priority 3: Final fallback to mock data
      if (isMounted) {
        console.log('🔄 Using mock data fallback');
        const fallback = generateMockRecommendations(preferences);
        setRecommendations(fallback);
        setIsCollectionsMode(false);
      }

      if (isMounted) setIsLoading(false);
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

  // VEO button animation helpers
  const animateVeoButtonAppearance = () => {
    // Show unlock notification first
    setShowUnlockNotification(true);
    
    // Animate unlock notification
    Animated.parallel([
      Animated.timing(unlockNotificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(unlockNotificationTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      // Hide notification after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(unlockNotificationOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(unlockNotificationTranslateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowUnlockNotification(false);
        });
      }, 2000);
    });

    // Spectacular entrance animation for VEO button
    setTimeout(() => {
      Animated.sequence([
        // First, scale up with bounce
        Animated.parallel([
          Animated.spring(veoButtonScale, {
            toValue: 1.2,
            useNativeDriver: true,
            tension: 100,
            friction: 6,
          }),
          Animated.timing(veoButtonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Then settle to normal size
        Animated.spring(veoButtonScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
      ]).start();
    }, 500);
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
    
    console.log('👆 SWIPE INTERACTION START:', {
      direction,
      velocity,
      currentIndex,
      isCollectionsMode,
      currentId,
      totalItems: isCollectionsMode ? collections.length : recommendations.length
    });

    if (!currentId) {
      console.warn('⚠️ No current ID found for swipe - aborting');
      return;
    }

    // Prevent multiple swipes on the same card or during animation
    const totalCount = isCollectionsMode ? collections.length : recommendations.length;
    if (currentIndex >= totalCount || isAnimating) {
      console.warn('⚠️ Swipe blocked - out of bounds or animating:', {
        currentIndex,
        totalCount,
        isAnimating
      });
      return;
    }

    setIsAnimating(true);

    // Log current item details
    if (isCollectionsMode && currentSetLocal) {
      console.log('👆 SWIPING COLLECTION:', {
        id: currentSetLocal.id,
        title: currentSetLocal.title,
        itemsCount: Object.keys(currentSetLocal.items || {}).length,
        items: Object.entries(currentSetLocal.items || {}).map(([type, item]: [string, any]) => ({
          type,
          title: item.title,
          external_url: item.external_url
        }))
      });
    } else if (!isCollectionsMode && currentOutfit) {
      console.log('👆 SWIPING RECOMMENDATION:', {
        id: currentOutfit.id,
        styleDescription: currentOutfit.styleDescription,
        confidence: currentOutfit.confidence,
        eventType: currentOutfit.eventType,
        itemsCount: currentOutfit.items.length,
        items: currentOutfit.items.map(item => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          category: item.category,
          amazonUrl: item.amazonUrl
        }))
      });
    }

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

    console.log('👆 SWIPE ACTION CREATED:', {
      ...action,
      timestampFormatted: new Date(action.timestamp).toISOString(),
      swipeDirection: direction,
      isLike: direction === 'right'
    });

    setSwipeActions(prev => {
      const newActions = [...prev, action];
      console.log('👆 TOTAL SWIPE ACTIONS:', newActions.length, newActions);
      return newActions;
    });

    // Fire-and-forget feedback to backend
    if (!isCollectionsMode) {
      console.log('👆 SENDING FEEDBACK TO GRAY WHALE...');
      GrayWhaleService.sendFeedback([action]);
    } else {
      console.log('👆 Collections mode - skipping Gray Whale feedback');
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
        setSwipeCount((c) => {
          const newCount = c + 1;
          // Unlock VEO feature after 3 swipes
          if (newCount >= 3 && !veoUnlocked) {
            setVeoUnlocked(true);
            animateVeoButtonAppearance();
          }
          return newCount;
        });
      } else {
        setIsAnimating(false);
        // Update swipe count after animation completes
        setSwipeCount((c) => {
          const newCount = c + 1;
          // Unlock VEO feature after 3 swipes
          if (newCount >= 3 && !veoUnlocked) {
            setVeoUnlocked(true);
            animateVeoButtonAppearance();
          }
          return newCount;
        });
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

  // Auto-refresh after every 3 swipes to get next batch with updated ranking
  useEffect(() => {
    if (!isLoading && !isCollectionsMode && swipeCount > 0 && swipeCount % 3 === 0) {
      console.log('🔄 AUTO-REFRESH TRIGGERED:', {
        swipeCount,
        isLoading,
        isCollectionsMode,
        isAnimating,
        currentRecommendationsCount: recommendations.length
      });

      // Add a delay to ensure animations complete and avoid conflicts
      const refreshTimer = setTimeout(async () => {
        // Double-check we're not animating before refreshing
        if (!isAnimating) {
          console.log('🔄 EXECUTING AUTO-REFRESH - Getting next batch with updated ranking...');
          try {
            // Get next batch of recommendations. Backend uses prior feedback events to re-rank.
            const nextPage = currentPage + 1;
            const updated = await GrayWhaleService.getRecommendations(preferences, nextPage, 3);
            console.log('🔄 AUTO-REFRESH SUCCESS:', {
              previousCount: recommendations.length,
              newCount: updated.length,
              newPage: nextPage,
              resetToIndex: 0
            });
            // Replace remaining stack with updated items and advance to next page
            setRecommendations(updated);
            setCurrentIndex(0);
            setCurrentPage(nextPage);
            resetCardAnimations();
          } catch (e) {
            console.error('🔄 AUTO-REFRESH FAILED:', e);
            // Non-fatal; keep current stack
          }
        } else {
          console.log('🔄 AUTO-REFRESH SKIPPED - still animating');
        }
      }, 1000); // Wait 1 second to ensure all animations are complete

      return () => clearTimeout(refreshTimer);
    }
  }, [swipeCount]);


  // Video status polling
  const startVideoPolling = (videoId: string) => {
    // Clear any existing polling
    if (videoPollingInterval) {
      clearInterval(videoPollingInterval);
    }

    let progress = 0;
    const interval = setInterval(async () => {
      try {
        const status = await VeoService.checkVideoStatus(videoId);
        
        // Update progress
        progress += 10;
        setVideoProgress(Math.min(progress, 90)); // Cap at 90% until completion
        
        if (status.status === 'completed' && status.videoUrl) {
          // Video is ready! Show it immediately
          clearInterval(interval);
          setVideoPollingInterval(null);
          setVideoProgress(100);
          setIsGeneratingVideo(false);
          
          // Update the video response with the completed video
          setVideoResponse(status);
          
          // Reset video state and auto-show the video modal
          setIsVideoLoading(true);
          setVideoError(null);
          setShowVideoModal(true);
          
          console.log('🎬 Video completed! Auto-displaying:', status.videoUrl);
          
        } else if (status.status === 'failed') {
          // Generation failed
          clearInterval(interval);
          setVideoPollingInterval(null);
          setIsGeneratingVideo(false);
          setVideoProgress(0);
          
          Alert.alert('Video Generation Failed', status.error || 'Please try again.');
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setVideoPollingInterval(interval);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (videoPollingInterval) {
        clearInterval(videoPollingInterval);
      }
    };
  }, [videoPollingInterval]);

  const handleVeoGeneration = async () => {
    const totalCount = isCollectionsMode ? collections.length : recommendations.length;
    if (currentIndex >= totalCount) {
      Alert.alert('No Outfit Available', 'No outfit is currently being displayed for video generation.');
      return;
    }

    try {
      setIsGeneratingVideo(true);
      
      // Get current outfit details
      let styleDescription = '';
      let outfitImageUrl = '';
      
      if (isCollectionsMode) {
        const currentCollection = collections[currentIndex];
        styleDescription = currentCollection?.title || 'Stylish outfit collection';
        outfitImageUrl = 'https://via.placeholder.com/400x600/6366f1/FFFFFF?text=Collection+Style';
      } else {
        const currentOutfit = recommendations[currentIndex];
        styleDescription = currentOutfit?.styleDescription || 'Stylish outfit recommendation';
        outfitImageUrl = currentOutfit?.imageUrl || '';
      }

      // Prepare VEO request
      const veoRequest = {
        styleImageUrl: outfitImageUrl,
        partnerImageUrl: preferences.partnerReferenceImage,
        outfitDescription: styleDescription,
        eventType: preferences.eventType,
        prompt: preferences.stylePrompt,
      };

      console.log('🎬 Starting VEO video generation:', veoRequest);

      // Generate video
      const response = await VeoService.generateVideo(veoRequest);
      setVideoResponse(response);

      if (response.status === 'processing') {
        // Start polling for video completion
        startVideoPolling(response.videoId);
        
        // Show a simple notification instead of blocking alert
        Alert.alert(
          '🎬 Video Generation Started!',
          `Your ${preferences.partnerReferenceImage ? 'couple' : 'solo'} fashion video is being created. It will appear automatically when ready.`,
          [
            { text: 'Got it!', style: 'default' },
          ]
        );
      } else if (response.status === 'failed') {
        Alert.alert('Generation Failed', response.error || 'Failed to generate video. Please try again.');
      }
    } catch (error) {
      console.error('💥 VEO generation error:', error);
      Alert.alert('Error', 'Failed to start video generation. Please try again.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

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
          <Text style={styles.headerTitle}>Get Fitted</Text>
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

                {/* Outfit Info Overlay - REMOVED to show only photo */}
              </>
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Unlock Notification */}
      {showUnlockNotification && (
        <Animated.View
          style={[
            styles.unlockNotification,
            {
              opacity: unlockNotificationOpacity,
              transform: [{ translateY: unlockNotificationTranslateY }],
            },
          ]}
        >
          <View style={styles.unlockNotificationContent}>
            <Ionicons name="sparkles" size={20} color="#ff6b6b" />
            <Text style={styles.unlockNotificationText}>Video Generation Unlocked!</Text>
            <Text style={styles.unlockNotificationSubtext}>Create AI videos with your style</Text>
          </View>
        </Animated.View>
      )}

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

        {/* VEO Video Generation Button - Above Shop Button */}
        <View style={styles.centerButtonContainer}>
          {veoUnlocked && (
            <Animated.View 
              style={[
                styles.veoButtonContainer,
                {
                  opacity: veoButtonOpacity,
                  transform: [{ scale: veoButtonScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.actionButton, styles.veoButton]}
                onPress={handleVeoGeneration}
                activeOpacity={0.7}
                disabled={isGeneratingVideo}
              >
                {isGeneratingVideo ? (
                  <View style={styles.veoButtonProgress}>
                    <View style={[styles.veoProgressBar, { width: `${videoProgress}%` }]} />
                    <Ionicons name="hourglass" size={24} color="#ffffff" style={styles.veoProgressIcon} />
                  </View>
                ) : (
                  <Ionicons name="videocam" size={24} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text style={styles.veoButtonLabel}>Gen Video</Text>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.shopButton]}
            onPress={handlePurchase}
            activeOpacity={0.7}
          >
            <Ionicons name="bag" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>

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

      {/* Video Display Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <SafeAreaView style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              style={styles.videoModalCloseButton}
              onPress={() => setShowVideoModal(false)}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>Your Fashion Video</Text>
            <View style={styles.videoModalHeaderSpacer} />
          </View>

          <ScrollView style={styles.videoModalContent}>
            {videoResponse?.status === 'completed' && videoResponse.videoUrl ? (
              <View style={styles.videoContainer}>
                {/* Actual Video Player */}
                <View style={styles.videoPlayerContainer}>
                  {videoError ? (
                    <View style={styles.videoErrorContainer}>
                      <Ionicons name="alert-circle" size={48} color="#ef4444" />
                      <Text style={styles.videoErrorText}>Failed to load video</Text>
                      <Text style={styles.videoErrorSubtext}>{videoError}</Text>
                      <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                          setVideoError(null);
                          setIsVideoLoading(true);
                        }}
                      >
                        <Ionicons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Video
                        ref={videoRef}
                        style={styles.videoPlayer}
                        source={{ uri: videoResponse.videoUrl }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay={false}
                        onLoad={() => {
                          setIsVideoLoading(false);
                          console.log('🎬 Video loaded successfully');
                        }}
                        onError={(error) => {
                          setIsVideoLoading(false);
                          setVideoError(typeof error === 'string' ? error : 'Unknown video error');
                          console.error('🎬 Video error:', error);
                        }}
                        onLoadStart={() => {
                          setIsVideoLoading(true);
                          setVideoError(null);
                        }}
                      />
                      {isVideoLoading && (
                        <View style={styles.videoLoadingOverlay}>
                          <Ionicons name="hourglass" size={32} color="#ff6b6b" />
                          <Text style={styles.videoLoadingText}>Loading video...</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
                
                <View style={styles.videoActions}>
                  <TouchableOpacity 
                    style={styles.videoActionButton}
                    onPress={async () => {
                      if (videoRef.current) {
                        try {
                          const status = await videoRef.current.getStatusAsync();
                          if (status.isLoaded) {
                            if (status.isPlaying) {
                              await videoRef.current.pauseAsync();
                            } else {
                              await videoRef.current.playAsync();
                            }
                          }
                        } catch (error) {
                          console.error('Error controlling video playback:', error);
                        }
                      }
                    }}
                  >
                    <Ionicons name="play-outline" size={20} color="#ffffff" />
                    <Text style={styles.videoActionText}>Play/Pause</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.videoActionButton, styles.shareButton]}
                    onPress={() => {
                      // Share functionality would go here
                      Alert.alert('Share', 'Share functionality coming soon!');
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#ffffff" />
                    <Text style={styles.videoActionText}>Share</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.videoDetails}>
                  <Text style={styles.videoDetailsTitle}>Video Details</Text>
                  <Text style={styles.videoDetailsText}>
                    Type: {preferences.partnerReferenceImage ? 'Couple Fashion Video' : 'Solo Fashion Video'}
                  </Text>
                  <Text style={styles.videoDetailsText}>
                    Event: {preferences.eventType}
                  </Text>
                  <Text style={styles.videoDetailsText}>
                    Style: {isCollectionsMode ? collections[currentIndex]?.title : recommendations[currentIndex]?.styleDescription}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.videoLoadingContainer}>
                <Ionicons name="hourglass" size={48} color="#ff6b6b" />
                <Text style={styles.videoGeneratingText}>Generating your video...</Text>
                <Text style={styles.videoLoadingSubtext}>This may take up to 30 seconds</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    resizeMode: 'contain',
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
  // Outfit Info Overlay styles removed - cards now show only photos
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
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  veoButtonContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  veoButton: {
    backgroundColor: '#ff6b6b',
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  veoButtonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ff6b6b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  veoButtonProgress: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  veoProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
  },
  veoProgressIcon: {
    zIndex: 1,
  },
  unlockNotification: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  unlockNotificationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  unlockNotificationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  unlockNotificationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  videoModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  videoModalHeaderSpacer: {
    width: 40,
  },
  videoModalContent: {
    flex: 1,
    padding: 20,
  },
  videoContainer: {
    flex: 1,
  },
  videoPlayerContainer: {
    position: 'relative',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    aspectRatio: 16 / 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  videoLoadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  videoErrorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  videoErrorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  videoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButton: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
  },
  videoActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  videoDetails: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  videoDetailsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  videoLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  videoGeneratingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  videoLoadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
