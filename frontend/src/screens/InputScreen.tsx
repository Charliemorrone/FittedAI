import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, UserPreferences } from '../types';
import EventSuggestionCarousel, { EventSuggestion } from '../components/EventSuggestionCarousel';
import PhotoSelectionModal from '../components/PhotoSelectionModal';
import { PhotoStorageService } from '../services/photoStorageService';

type InputScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InputScreen'>;

interface Props {
  navigation: InputScreenNavigationProp;
}

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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
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

  const handleTakePhoto = () => {
    console.log('📸 InputScreen: Take photo button pressed');
    setShowPhotoModal(false);
    console.log('🚀 InputScreen: Navigating to CameraScreen...');
    navigation.navigate('CameraScreen');
    console.log('✅ InputScreen: Navigation call completed');
  };

  const handleChooseFromGallery = async () => {
    console.log('🖼️ InputScreen: Choose from gallery button pressed');
    setShowPhotoModal(false);
    console.log('🔐 InputScreen: Requesting media library permissions...');
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔐 InputScreen: Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ InputScreen: Media library permission denied');
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      console.log('📱 InputScreen: Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      console.log('📱 InputScreen: Image picker result:', result);

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        console.log('📷 InputScreen: Selected photo URI:', photoUri);
        setReferenceImage(photoUri);
        console.log('✅ InputScreen: Photo set in state');
        
        // Save to local storage
        try {
          console.log('💾 InputScreen: Saving photo to storage...');
          await PhotoStorageService.saveReferencePhoto(photoUri);
          console.log('✅ InputScreen: Photo saved to storage successfully');
        } catch (error) {
          console.error('💥 InputScreen: Error saving photo to storage:', error);
        }
      } else {
        console.log('❌ InputScreen: Image picker was canceled');
      }
    } catch (error) {
      console.error('💥 InputScreen: Error in handleChooseFromGallery:', error);
    }
  };

  const handlePhotoButtonPress = () => {
    console.log('🎯 InputScreen: Photo button pressed - showing modal');
    setShowPhotoModal(true);
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
              placeholder="Message FittedAI..."
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

        {/* Photo Selection Modal */}
        <PhotoSelectionModal
          visible={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onTakePhoto={handleTakePhoto}
          onChooseFromGallery={handleChooseFromGallery}
        />
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
    paddingVertical: 8,
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
});