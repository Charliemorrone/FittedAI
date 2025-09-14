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
  Animated,
  Keyboard,
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
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isCoupleMode, setIsCoupleMode] = useState(false);
  const [partnerReferenceImage, setPartnerReferenceImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Start rotation animation
  const startRotation = () => {
    rotationAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Stop rotation animation
  const stopRotation = () => {
    rotationAnim.stopAnimation();
    rotationAnim.setValue(0);
  };

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

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Reload photo when returning from camera screen
  useFocusEffect(
    React.useCallback(() => {
      loadStoredPhoto();
    }, [])
  );

  const handleTakeSelfie = async () => {
    console.log('🤳 InputScreen: Take selfie button pressed (demo only)');
    
    try {
      console.log('🔐 InputScreen: Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔐 InputScreen: Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ InputScreen: Camera permission denied');
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      console.log('📱 InputScreen: Launching camera for selfie...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera timeout after 10 seconds')), 10000);
      });
      
      const result = await Promise.race([
        ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1], // Square aspect for selfie
          quality: 0.8,
        }),
        timeoutPromise
      ]) as ImagePicker.ImagePickerResult;
      
      console.log('📱 InputScreen: Selfie camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('🤳 InputScreen: Selfie taken, URI:', photoUri);
        
        // For demo: just set in state temporarily, don't save to storage
        setSelfieImage(photoUri);
        console.log('✅ InputScreen: Selfie set in state (demo only)');
        
        // Show success message and clear after 2 seconds
        Alert.alert('Photo Uploaded!', 'Your photo has been uploaded successfully.');
        setTimeout(() => {
          setSelfieImage(null);
          console.log('🗑️ InputScreen: Demo selfie cleared after 2 seconds');
        }, 2000);
      } else {
        console.log('❌ InputScreen: Selfie camera was canceled');
      }
    } catch (error) {
      console.error('💥 InputScreen: Selfie camera error:', error);
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    }
  };

  const handleUploadReferencePhoto = async (isPartner: boolean = false) => {
    console.log(`📷 InputScreen: Upload ${isPartner ? 'partner' : 'reference'} photo button pressed`);
    
    try {
      console.log('🔐 InputScreen: Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔐 InputScreen: Media library permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ InputScreen: Media library permission denied');
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }

      console.log(`📱 InputScreen: Launching image library for ${isPartner ? 'partner' : 'reference'} photo...`);
      
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
      
      console.log(`📱 InputScreen: ${isPartner ? 'Partner' : 'Reference'} photo picker completed!`);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log(`📷 InputScreen: ${isPartner ? 'Partner' : 'Reference'} photo selected, URI:`, photoUri);
        
        if (isPartner) {
          // For now, just store in state - we can add partner photo storage later if needed
          setPartnerReferenceImage(photoUri);
          console.log('✅ InputScreen: Partner photo set in state');
        } else {
          // Save to storage - this will be used for API calls
          await PhotoStorageService.saveReferencePhoto(photoUri);
          setReferenceImage(photoUri);
          console.log('✅ InputScreen: Reference photo saved for API use');
        }
      } else {
        console.log(`❌ InputScreen: No ${isPartner ? 'partner' : 'reference'} photo selected`);
      }
    } catch (error) {
      console.error(`💥 InputScreen: ${isPartner ? 'Partner' : 'Reference'} photo selection error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to select ${isPartner ? 'partner' : 'reference'} photo: ${errorMessage}`);
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

    if (isCoupleMode && !partnerReferenceImage) {
      Alert.alert('Partner Photo Required', 'Please upload a reference photo for your partner to find coordinating outfits.');
      return;
    }

    setIsLoading(true);
    setHasStartedChat(true); // Only hide suggestions when actually sending
    startRotation(); // Start hourglass rotation

    // Simulate Gray Whale API call
    setTimeout(async () => {
      try {
        // Get the latest photo from storage
        const storedPhoto = await PhotoStorageService.getReferencePhoto();
        
        // Select Gray Whale project based on message heuristics
        const lower = message.trim().toLowerCase();
        const grayWhaleProjectKey: 'A' | 'B' =
          lower.includes('wedding') || lower.includes('formal') ? 'A' : 'B';

        const preferences: UserPreferences = {
          eventType: 'custom',
          stylePrompt: message.trim(),
          referenceImage: storedPhoto || referenceImage,
          likedOutfits: [],
          dislikedOutfits: [],
          grayWhaleProjectKey,
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
        stopRotation(); // Stop hourglass rotation
        setIsLoading(false);
      } catch (error) {
        console.error('Error preparing recommendations:', error);
        stopRotation(); // Stop hourglass rotation
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
            
            {/* Mode Toggle - always present */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[styles.modeToggleButton, !isCoupleMode && styles.modeToggleButtonActive]}
                onPress={() => setIsCoupleMode(false)}
              >
                <Text style={[styles.modeToggleText, !isCoupleMode && styles.modeToggleTextActive]}>
                  Just Me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeToggleButton, isCoupleMode && styles.modeToggleButtonActive]}
                onPress={() => setIsCoupleMode(true)}
              >
                <Text style={[styles.modeToggleText, isCoupleMode && styles.modeToggleTextActive]}>
                  Couple
                </Text>
              </TouchableOpacity>
            </View>
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
          {/* Photo Status - Show both types when they exist */}
          {(referenceImage || selfieImage || partnerReferenceImage) && (
            <View style={styles.photoStatusContainer}>
              {selfieImage && (
                <View style={styles.imageStatus}>
                  <View style={styles.imageStatusContent}>
                    <Ionicons name="person-circle" size={20} color="#8b5cf6" />
                    <View style={styles.imageStatusTextContainer}>
                      <Text style={styles.imageStatusText}>Selfie uploaded</Text>
                      <Text style={styles.imageStatusSubtext}>Demo only</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {referenceImage && (
                <View style={styles.imageStatus}>
                  <TouchableOpacity 
                    style={styles.imageStatusContent} 
                    onPress={handlePhotoButtonPress}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <View style={styles.imageStatusTextContainer}>
                      <Text style={styles.imageStatusText}>
                        {isCoupleMode ? 'Your reference photo added' : 'Reference photo added'}
                      </Text>
                      <Text style={styles.imageStatusSubtext}>Tap to change</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearPhoto} style={styles.clearPhotoButton}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              {isCoupleMode && partnerReferenceImage && (
                <View style={styles.imageStatus}>
                  <TouchableOpacity 
                    style={styles.imageStatusContent} 
                    onPress={handlePhotoButtonPress}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <View style={styles.imageStatusTextContainer}>
                      <Text style={styles.imageStatusText}>Partner's reference photo added</Text>
                      <Text style={styles.imageStatusSubtext}>Tap to change</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPartnerReferenceImage(null)} style={styles.clearPhotoButton}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
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
              multiline={false}
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              enablesReturnKeyAutomatically={true}
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || !referenceImage || (isCoupleMode && !partnerReferenceImage) || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || !referenceImage || (isCoupleMode && !partnerReferenceImage) || isLoading}
            >
              {isLoading ? (
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: rotationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="hourglass" size={18} color="#fff" />
                </Animated.View>
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
            <View style={[
              styles.photoOptionsDropdown,
              {
                bottom: keyboardHeight > 0 
                  ? keyboardHeight + 60 // When keyboard is open, position above keyboard with padding
                  : 90 // When keyboard is closed, position above input area
              }
            ]}>
              
              <TouchableOpacity 
                style={styles.photoOption} 
                onPress={() => {
                  console.log('🤳 Direct: Take Selfie button pressed');
                  setShowPhotoOptions(false);
                  handleTakeSelfie();
                }}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="person" size={24} color="#111827" />
                </View>
                <View style={styles.photoOptionTextContainer}>
                  <Text style={styles.photoOptionText}>Take Photo of Yourself</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoOption} 
                onPress={() => {
                  console.log('📷 Direct: Upload Reference Photo button pressed');
                  setShowPhotoOptions(false);
                  handleUploadReferencePhoto(false);
                }}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="images" size={24} color="#111827" />
                </View>
                <View style={styles.photoOptionTextContainer}>
                  <Text style={styles.photoOptionText}>
                    {isCoupleMode ? 'Upload Your Reference Photo' : 'Upload Reference Photo'}
                  </Text>
                </View>
              </TouchableOpacity>

              {isCoupleMode && (
                <TouchableOpacity 
                  style={styles.photoOption} 
                  onPress={() => {
                    console.log('👫 Direct: Upload Partner Reference Photo button pressed');
                    setShowPhotoOptions(false);
                    handleUploadReferencePhoto(true);
                  }}
                >
                  <View style={styles.photoOptionIcon}>
                    <Ionicons name="people" size={24} color="#111827" />
                  </View>
                  <View style={styles.photoOptionTextContainer}>
                    <Text style={styles.photoOptionText}>Upload Partner's Reference Photo</Text>
                  </View>
                </TouchableOpacity>
              )}
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
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 2,
    marginTop: 12,
    alignSelf: 'center',
  },
  modeToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
  },
  modeToggleButtonActive: {
    backgroundColor: '#111827',
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modeToggleTextActive: {
    color: '#ffffff',
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
  photoStatusContainer: {
    marginBottom: 12,
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
    zIndex: 1000,
  },
  photoOptionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoOptionsDropdown: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    maxHeight: 300, // Prevent it from getting too tall
  },
  photoOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  photoOptionsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoOptionIcon: {
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
  photoOptionTextContainer: {
    flex: 1,
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  photoOptionSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});