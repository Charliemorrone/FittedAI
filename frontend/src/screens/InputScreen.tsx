import React, { useState, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, UserPreferences } from '../types';
import EventSuggestionCarousel, { EventSuggestion } from '../components/EventSuggestionCarousel';

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
  const inputRef = useRef<TextInput>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setReferenceImage(result.assets[0].uri);
    }
  };

  const handleSuggestionPress = (suggestion: EventSuggestion) => {
    const suggestionText = `I need an outfit for ${suggestion.title.toLowerCase()}`;
    setMessage(suggestionText);
    setHasStartedChat(true);
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
    setHasStartedChat(true);

    // Simulate Gray Whale API call
    setTimeout(() => {
      const preferences: UserPreferences = {
        eventType: 'custom',
        stylePrompt: message.trim(),
        referenceImage: referenceImage,
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
                <View style={styles.logoContainer}>
                  <View style={styles.logo}>
                    <Ionicons name="sparkles" size={32} color="#000" />
                  </View>
                </View>
                <Text style={styles.mainQuestion}>What's the event?</Text>
                <Text style={styles.subQuestion}>
                  Tell me about the occasion and I'll help you find the perfect outfit
                </Text>
              </View>

              {/* Event Suggestion Carousel */}
              <EventSuggestionCarousel
                suggestions={EVENT_SUGGESTIONS}
                onSuggestionPress={handleSuggestionPress}
              />
            </>
          ) : (
            <View style={styles.chatContainer}>
              {/* User Message */}
              <View style={styles.userMessageContainer}>
                <View style={styles.userMessage}>
                  <Text style={styles.userMessageText}>{message}</Text>
                </View>
              </View>

              {/* AI Response */}
              <View style={styles.aiMessageContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color="#000" />
                </View>
                <View style={styles.aiMessage}>
                  <Text style={styles.aiMessageText}>
                    Perfect! I'll analyze your style preferences and find matching outfits.
                    {referenceImage ? ' Your reference photo will help me understand your taste better.' : ' Don\'t forget to add a reference photo!'}
                  </Text>
                </View>
              </View>

              {/* Reference Image Display */}
              {referenceImage && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewLabel}>Reference Photo</Text>
                  <Image source={{ uri: referenceImage }} style={styles.imagePreview} />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Area */}
        <View style={styles.inputArea}>
          {/* Reference Image Status */}
          {referenceImage ? (
            <TouchableOpacity style={styles.imageStatus} onPress={pickImage}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.imageStatusText}>Reference photo added</Text>
              <Text style={styles.imageStatusSubtext}>Tap to change</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.imageUploadPrompt} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#6b7280" />
              <Text style={styles.imageUploadText}>Add reference photo (required)</Text>
            </TouchableOpacity>
          )}

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={pickImage}
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
    paddingVertical: 40,
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
  chatContainer: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiMessage: {
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    maxWidth: '80%',
  },
  aiMessageText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 22,
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
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
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  imageStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  imageStatusSubtext: {
    fontSize: 12,
    color: '#6b7280',
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
    alignItems: 'flex-end',
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