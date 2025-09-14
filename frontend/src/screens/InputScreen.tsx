import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, UserPreferences } from '../types';
import EventSuggestionCarousel, { EventSuggestion } from '../components/EventSuggestionCarousel';
import { PhotoStorageService } from '../services/photoStorageService';

type InputScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InputScreen'>;

type Props = Readonly<{
  navigation: InputScreenNavigationProp;
}>;

const { width, height } = Dimensions.get('window');

const EVENT_SUGGESTIONS: EventSuggestion[] = [
  { id: 'business', title: 'Business Meeting', icon: 'briefcase', description: 'Professional attire' },
  { id: 'wedding', title: 'Wedding Guest', icon: 'flower', description: 'Elegant formal wear' },
  { id: 'date', title: 'Date Night', icon: 'heart', description: 'Romantic and stylish' },
  { id: 'casual', title: 'Weekend Casual', icon: 'shirt', description: 'Comfortable and relaxed' },
  { id: 'party', title: 'Party/Event', icon: 'musical-notes', description: 'Fun and trendy' },
  { id: 'travel', title: 'Travel Outfit', icon: 'airplane', description: 'Comfortable for travel' },
  { id: 'gym', title: 'Gym/Workout', icon: 'fitness', description: 'Athletic and functional' },
  { id: 'formal', title: 'Formal Event', icon: 'diamond', description: 'Black-tie elegance' },
];

export default function InputScreen({ navigation }: Props) {
  const [message, setMessage] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const loadStoredPhoto = async () => {
    console.log('🔄 InputScreen: Loading stored photo...');
    try {
      const storedPhotoUri = await PhotoStorageService.getReferencePhoto();
      console.log('📷 InputScreen: Stored photo URI:', storedPhotoUri);
      if (storedPhotoUri) {
        setReferenceImage(storedPhotoUri);
        console.log('✅ InputScreen: Photo loaded and set in state');
      } else {
        console.log('❌ InputScreen: No stored photo found');
      }
    } catch (error) {
      console.error('💥 InputScreen: Error loading stored photo:', error);
    }
  };

  // Load stored photo when component mounts
  useEffect(() => {
    loadStoredPhoto();
  }, []);

  // Reload photo when returning from camera screen
  useFocusEffect(
    React.useCallback(() => {
      loadStoredPhoto();
    }, [])
  );

  const handleTakePhoto = async () => {
    console.log('📸 InputScreen: Take photo button pressed');
    
    try {
      console.log('🔐 InputScreen: Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔐 InputScreen: Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ InputScreen: Camera permission denied');
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      console.log('📱 InputScreen: Launching camera directly...');
      
      // Add timeout to detect if ImagePicker is hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera timeout after 10 seconds')), 10000);
      });
      
      const result = await Promise.race([
        ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        }),
        timeoutPromise
      ]) as ImagePicker.ImagePickerResult;
      
      console.log('📱 InputScreen: Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('📷 InputScreen: Photo taken, URI:', photoUri);
        
        // Save photo to local storage
        console.log('💾 InputScreen: Saving photo to storage...');
        await PhotoStorageService.saveReferencePhoto(photoUri);
        setReferenceImage(photoUri);
        console.log('✅ InputScreen: Photo saved and set in state successfully');
      } else {
        console.log('❌ InputScreen: Camera was canceled');
      }
    } catch (error) {
      console.error('💥 InputScreen: Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    console.log('🖼️ InputScreen: Choose from gallery button pressed');
    
    try {
      // Request media library permissions first
      console.log('🔐 InputScreen: Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔐 InputScreen: Media library permission result:', permissionResult);
      console.log('🔐 InputScreen: Permission granted:', permissionResult.granted);
      console.log('🔐 InputScreen: Permission status:', permissionResult.status);
      
      if (permissionResult.granted === false) {
        console.log('❌ InputScreen: Media library permission denied');
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }

      console.log('📱 InputScreen: Permissions OK, launching image library...');
      console.log('📱 InputScreen: About to call launchImageLibraryAsync...');
      
      // Add timeout to detect if ImagePicker is hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('ImagePicker timeout after 10 seconds')), 10000);
      });
      
      const result = await Promise.race([
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.5,
        }),
        timeoutPromise
      ]) as ImagePicker.ImagePickerResult;
      
      console.log('📱 InputScreen: Image picker completed successfully!');
      console.log('📱 InputScreen: Full result object:', JSON.stringify(result, null, 2));
      console.log('📱 InputScreen: Result canceled:', result.canceled);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('📷 InputScreen: Got photo URI:', photoUri);
        console.log('📷 InputScreen: Saving to storage...');
        
        // Save to storage like camera does
        await PhotoStorageService.saveReferencePhoto(photoUri);
        setReferenceImage(photoUri);
        console.log('✅ InputScreen: Photo saved and set in state successfully');
      } else {
        console.log('❌ InputScreen: No photo selected or result was canceled');
      }
    } catch (error) {
      console.error('💥 InputScreen: Gallery selection error:', error);
      console.error('💥 InputScreen: Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to select photo from gallery: ${errorMessage}`);
    }
  };

  const handlePhotoButtonPress = () => {
    console.log('🎯 InputScreen: Photo button pressed - toggling options');
    setShowPhotoOptions(!showPhotoOptions);
  };

  const clearPhoto = async () => {
    console.log('🗑️ InputScreen: Clear photo button pressed');
    try {
      await PhotoStorageService.clearReferencePhoto();
      setReferenceImage(null);
      console.log('✅ InputScreen: Photo cleared successfully');
    } catch (error) {
      console.error('💥 InputScreen: Error clearing photo:', error);
    }
  };

  const handleSuggestionPress = (suggestion: EventSuggestion) => {
    const suggestionText = `I need an outfit for ${suggestion.title.toLowerCase()}`;
    setMessage(suggestionText);
    // Don't set hasStartedChat to true here - keep suggestions visible
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please describe what kind of outfit you\'re looking for.');
      return;
    }

    if (!referenceImage) {
      Alert.alert('Reference Photo Required', 'Please upload a reference photo to help us understand your style preferences.');
      return;
    }

    setIsLoading(true);
    setHasStartedChat(true); // Only hide suggestions when actually sending

    // Simulate Gray Whale API call
    setTimeout(async () => {
      try {
        // Get the latest photo from storage
        const storedPhoto = await PhotoStorageService.getReferencePhoto();
        
        const preferences: UserPreferences = {
          eventType: 'custom',
          stylePrompt: message.trim(),
          referenceImage: storedPhoto || referenceImage,
          likedOutfits: [],
          dislikedOutfits: [],
          sizePreferences: {
            top: 'M',
            bottom: 'M',
            shoes: '9',
          },
          colorPreferences: [],
          priceRange: {
            min: 20,
            max: 200,
          },
        };

        navigation.navigate('RecommendationScreen', { preferences });
        setIsLoading(false);
      } catch (error) {
        console.error('Error preparing recommendations:', error);
        setIsLoading(false);
      }
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>FittedAI</Text>
            <Text style={styles.headerSubtitle}>Your AI Style Assistant</Text>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.mainContent} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasStartedChat ? (
            <>
              {/* Center Question */}
              <View style={styles.centerContent}>
                <Text style={styles.mainQuestion}>What's your event?</Text>
                <Text style={styles.subQuestion}>
                  I'll help you find the perfect outfit
                </Text>
              </View>

              {/* Event Suggestion Carousel */}
              <EventSuggestionCarousel
                suggestions={EVENT_SUGGESTIONS}
                onSuggestionPress={handleSuggestionPress}
              />
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              {/* Just show empty space or minimal content when typing */}
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Area */}
        <View style={styles.inputArea}>
          {/* Reference Image Status - Only show when image is added */}
          {referenceImage && (
            <View style={styles.imageStatus}>
              <TouchableOpacity 
                style={styles.imageStatusContent} 
                onPress={handlePhotoButtonPress}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <View style={styles.imageStatusTextContainer}>
                  <Text style={styles.imageStatusText}>Reference photo added</Text>
                  <Text style={styles.imageStatusSubtext}>Tap to change</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearPhoto} style={styles.clearPhotoButton}>
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={handlePhotoButtonPress}
            >
              <Ionicons 
                name={referenceImage ? "checkmark" : "image"} 
                size={20} 
                color={referenceImage ? "#10b981" : "#6b7280"} 
              />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="i.e. Indian Wedding, Easter Brunch"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || !referenceImage || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || !referenceImage || isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={18} color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Options */}
        {showPhotoOptions && (
          <View style={styles.photoOptionsOverlay}>
            <TouchableOpacity 
              style={styles.photoOptionsBackdrop} 
              onPress={() => setShowPhotoOptions(false)}
            />
            <View style={styles.photoOptionsContainer}>
              <Text style={styles.photoOptionsTitle}>Add Photo</Text>
              
              <TouchableOpacity 
                style={styles.photoOption} 
                onPress={() => {
                  console.log('📸 Direct: Take Photo button pressed');
                  setShowPhotoOptions(false);
                  handleTakePhoto();
                }}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="camera" size={24} color="#111827" />
                </View>
                <Text style={styles.photoOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoOption} 
                onPress={() => {
                  console.log('🖼️ Direct: Choose from Gallery button pressed');
                  setShowPhotoOptions(false);
                  handleChooseFromGallery();
                }}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="images" size={24} color="#111827" />
                </View>
                <Text style={styles.photoOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoOptionCancel} 
                onPress={() => {
                  console.log('❌ Direct: Cancel button pressed');
                  setShowPhotoOptions(false);
                }}
              >
                <Text style={styles.photoOptionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainQuestion: {
    fontSize: 32,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subQuestion: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 120,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  imageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  imageStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageStatusTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  imageStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  imageStatusSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  clearPhotoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  imageUploadPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d97706',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  imageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  photoOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  photoOptionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  photoOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
  },
  photoOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  photoOptionCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  photoOptionCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});