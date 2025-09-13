import React, { useState } from 'react';
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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
    
    Alert.alert(
      'Purchase Confirmation',
      `You're about to purchase ${selectedItemsList.length} items for $${totalPrice.toFixed(2)}. This will open Amazon in your browser.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue to Amazon', 
          onPress: () => {
            // Open the first selected item's Amazon link
            const firstItem = selectedItemsList[0];
            openAmazonLink(firstItem.amazonUrl);
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

  const selectedTotal = purchaseItem.items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

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
          <Text style={styles.title}>Your Selected Items</Text>
          <Text style={styles.subtitle}>
            {selectedItems.size} of {purchaseItem.items.length} items selected
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Price:</Text>
          <Text style={styles.summaryValue}>${selectedTotal.toFixed(2)}</Text>
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
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
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
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
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
            Purchase Selected ({selectedItems.size}) - ${selectedTotal.toFixed(2)}
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
    resizeMode: 'cover',
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
