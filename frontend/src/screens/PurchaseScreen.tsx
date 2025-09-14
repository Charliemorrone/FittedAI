import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, PurchaseItem, OutfitItem } from '../types';

type PurchaseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PurchaseScreen'>;
type PurchaseScreenRouteProp = RouteProp<RootStackParamList, 'PurchaseScreen'>;

interface Props {
  navigation: PurchaseScreenNavigationProp;
  route: PurchaseScreenRouteProp;
}

const { width } = Dimensions.get('window');

export default function PurchaseScreen({ navigation, route }: Props) {
  const { purchaseItem } = route.params;
  // Auto-select all items since user is viewing the current outfit
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(purchaseItem.items.map(item => item.id))
  );
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(
    new Set(purchaseItem.items.map(item => item.id))
  );
  const [currentImageIndex, setCurrentImageIndex] = useState<Map<string, number>>(new Map());
  const [forceUpdate, setForceUpdate] = useState(0);
  const [imageTimeouts, setImageTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Add timeout for images that take too long to load
  useEffect(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();
    
    purchaseItem.items.forEach(item => {
      if (loadingImages.has(item.id) && !imageErrors.has(item.id)) {
        const timeout = setTimeout(() => {
          console.log(`Image loading timeout for ${item.name}, treating as error`);
          handleImageError(item.id);
        }, 10000); // 10 second timeout
        
        timeouts.set(item.id, timeout);
      }
    });
    
    setImageTimeouts(timeouts);
    
    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [loadingImages, imageErrors]);

  // Clear timeout when image loads successfully
  const clearImageTimeout = (itemId: string) => {
    const timeout = imageTimeouts.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      setImageTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const openAmazonLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Amazon link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handlePurchaseAll = () => {
    const selectedItemsList = purchaseItem.items.filter(item => selectedItems.has(item.id));
    
    if (selectedItemsList.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to purchase.');
      return;
    }

    const totalPrice = selectedItemsList.reduce((sum, item) => sum + item.price, 0);
    const hasZeroPrices = selectedItemsList.some(item => item.price === 0);
    
    const confirmationMessage = hasZeroPrices 
      ? `You're about to view ${selectedItemsList.length} items on Amazon. Prices will be shown on Amazon.`
      : `You're about to purchase ${selectedItemsList.length} items for $${totalPrice.toFixed(2)}. This will open Amazon in your browser.`;
    
    Alert.alert(
      'Purchase Confirmation',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue to Amazon', 
          onPress: () => {
            // Open all selected items' Amazon links
            selectedItemsList.forEach((item, index) => {
              setTimeout(() => {
                openAmazonLink(item.amazonUrl);
              }, index * 1000); // Stagger opening links by 1 second
            });
          }
        },
      ]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.size === purchaseItem.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(purchaseItem.items.map(item => item.id)));
    }
  };

  const handleImageError = (itemId: string) => {
    const item = purchaseItem.items.find(i => i.id === itemId);
    const currentIndex = currentImageIndex.get(itemId) || 0;
    const currentUrl = currentIndex === 0 ? item?.imageUrl : item?.alternativeImageUrls?.[currentIndex];
    
    console.log(`Image error for ${item?.name} (${itemId}):`, currentUrl);
    
    if (!item || !item.alternativeImageUrls) {
      console.log('No alternative URLs available for', item?.name);
      // No alternatives, mark as error
      setImageErrors(prev => new Set([...prev, itemId]));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    
    if (nextIndex < item.alternativeImageUrls.length) {
      console.log(`Trying alternative image ${nextIndex + 1}/${item.alternativeImageUrls.length} for ${item.name}:`, item.alternativeImageUrls[nextIndex]);
      // Try next alternative image URL
      setCurrentImageIndex(prev => new Map(prev).set(itemId, nextIndex));
      // Force re-render by updating a state
      setLoadingImages(prev => new Set([...prev, itemId]));
      setForceUpdate(prev => prev + 1);
    } else {
      console.log('All image URLs failed for', item.name);
      // No more alternatives, mark as error
      setImageErrors(prev => new Set([...prev, itemId]));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Add image validation function to detect Amazon's blocked images
  const validateImageLoad = async (itemId: string, imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      
      // Amazon returns tiny GIF placeholders (43 bytes) for blocked images
      const isBlocked = contentType === 'image/gif' && contentLength < 100;
      const isValid = response.ok && (contentType?.startsWith('image/') ?? false) && !isBlocked;
      
      console.log(`Image validation for ${itemId}: ${imageUrl} - ${isValid ? 'VALID' : 'BLOCKED/INVALID'} (${response.status}, ${contentType}, ${contentLength} bytes)`);
      return isValid;
    } catch (error) {
      console.log(`Image validation failed for ${itemId}: ${imageUrl}`, error);
      return false;
    }
  };

  const handleImageLoad = async (itemId: string) => {
    const item = purchaseItem.items.find(i => i.id === itemId);
    const currentIndex = currentImageIndex.get(itemId) || 0;
    const currentUrl = currentIndex === 0 ? item?.imageUrl : item?.alternativeImageUrls?.[currentIndex];
    
    console.log(`Image onLoad triggered for ${item?.name}:`, currentUrl);
    
    // Validate that the image actually loaded successfully
    if (currentUrl) {
      const isValid = await validateImageLoad(itemId, currentUrl);
      if (!isValid) {
        console.log(`Image validation failed for ${item?.name}, treating as error`);
        handleImageError(itemId);
        return;
      }
    }
    
    console.log(`Image loaded and validated successfully for ${item?.name}:`, currentUrl);
    clearImageTimeout(itemId);
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const getFallbackImage = (item: OutfitItem): string => {
    // Use Unsplash for realistic fashion images based on category
    const unsplashImages = {
      'top': [
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300&h=400&fit=crop', // Red kurta style
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop', // Traditional shirt
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=400&fit=crop', // Ethnic wear
      ],
      'bottom': [
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop', // Traditional pants
        'https://images.unsplash.com/photo-1506629905607-d9f02a6a0ac7?w=300&h=400&fit=crop', // Casual pants
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=400&fit=crop', // Linen pants
      ],
      'shoes': [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop', // Traditional shoes
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=400&fit=crop', // Brown shoes
        'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=400&fit=crop', // Ethnic footwear
      ],
      'accessories': [
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=400&fit=crop', // Traditional scarf
        'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=300&h=400&fit=crop', // Accessories
        'https://images.unsplash.com/photo-1506629905607-d9f02a6a0ac7?w=300&h=400&fit=crop', // Dupatta style
      ]
    };

    const categoryImages = unsplashImages[item.category] || unsplashImages['top'];
    const imageIndex = Math.abs(item.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % categoryImages.length;
    return categoryImages[imageIndex];
  };

  const getImageSource = (item: OutfitItem) => {
    if (imageErrors.has(item.id)) {
      // Use realistic fashion images from Unsplash instead of placeholders
      return { uri: getFallbackImage(item) };
    }
    
    // Try alternative image URLs if available
    const currentIndex = currentImageIndex.get(item.id) || 0;
    if (item.alternativeImageUrls && currentIndex > 0 && currentIndex < item.alternativeImageUrls.length) {
      const url = item.alternativeImageUrls[currentIndex];
      console.log(`Using alternative image ${currentIndex + 1} for ${item.name}:`, url);
      return { uri: url };
    }
    
    // Use primary image URL
    console.log(`Using primary image for ${item.name}:`, item.imageUrl);
    return { uri: item.imageUrl };
  };

  const selectedTotal = purchaseItem.items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  
  const hasZeroPrices = purchaseItem.items
    .filter(item => selectedItems.has(item.id))
    .some(item => item.price === 0);

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
          <Text style={styles.title}>Current Outfit Items</Text>
          <Text style={styles.subtitle}>
            {selectedItems.size} of {purchaseItem.items.length} items selected
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Price:</Text>
          <Text style={styles.summaryValue}>
            {hasZeroPrices ? 'See Amazon for prices' : `$${selectedTotal.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
          <Text style={styles.selectAllText}>
            {selectedItems.size === purchaseItem.items.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {purchaseItem.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              selectedItems.has(item.id) && styles.itemCardSelected,
            ]}
            onPress={() => toggleItemSelection(item.id)}
          >
            <View style={styles.itemImageContainer}>
              <Image 
                key={`${item.id}-${currentImageIndex.get(item.id) || 0}-${forceUpdate}`}
                source={getImageSource(item)} 
                style={styles.itemImage}
                onError={() => handleImageError(item.id)}
                onLoad={() => handleImageLoad(item.id)}
                onLoadStart={() => console.log(`Loading started for ${item.name}`)}
                onLoadEnd={() => console.log(`Loading ended for ${item.name}`)}
                resizeMode="contain"
              />
              {loadingImages.has(item.id) && (
                <View style={styles.loadingOverlay}>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              )}
              {selectedItems.has(item.id) && (
                <View style={styles.selectedOverlay}>
                  <Text style={styles.selectedCheckmark}>✓</Text>
                </View>
              )}
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemCategory}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemPrice}>
                  {item.price > 0 ? `$${item.price.toFixed(2)}` : 'See Amazon for price'}
                </Text>
                <Text style={styles.itemSizes}>
                  Sizes: {item.sizes.join(', ')}
                </Text>
              </View>
              <View style={styles.colorContainer}>
                <Text style={styles.colorLabel}>Colors: </Text>
                <View style={styles.colorChips}>
                  {item.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[
                        styles.colorChip,
                        { backgroundColor: color.toLowerCase() }
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.amazonButton}
              onPress={() => openAmazonLink(item.amazonUrl)}
            >
              <Text style={styles.amazonButtonText}>View on Amazon</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            selectedItems.size === 0 && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchaseAll}
          disabled={selectedItems.size === 0}
        >
          <Text style={styles.purchaseButtonText}>
            {hasZeroPrices 
              ? `View Selected (${selectedItems.size}) on Amazon`
              : `Purchase Selected (${selectedItems.size}) - $${selectedTotal.toFixed(2)}`
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  selectAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  selectAllText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  itemImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366f1',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  itemSizes: {
    fontSize: 12,
    color: '#6b7280',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  colorChips: {
    flexDirection: 'row',
  },
  colorChip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  amazonButton: {
    backgroundColor: '#ff9900',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  amazonButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  purchaseButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
