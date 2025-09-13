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
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, UserPreferences, EventType } from '../types';

type InputScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InputScreen'>;

interface Props {
  navigation: InputScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const STYLE_SUGGESTIONS = [
  "I need a professional outfit for a business meeting",
  "Looking for a casual weekend look with jeans",
  "Want an elegant dress for a wedding guest",
  "Need workout clothes for the gym",
  "Looking for a romantic date night outfit",
  "Want a trendy party look with bold colors",
  "Need a comfortable travel outfit",
  "Looking for a formal black-tie event outfit",
  "Want a boho-chic summer dress",
  "Need a cozy fall layered look",
];

export default function InputScreen({ navigation }: Props) {
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const handleSuggestionSelect = (suggestion: string) => {
    setStylePrompt(suggestion);
    setShowSuggestions(false);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!stylePrompt.trim()) {
      Alert.alert('Missing Information', 'Please describe what kind of outfit you\'re looking for.');
      return;
    }

    if (!referenceImage) {
      Alert.alert('Reference Photo Required', 'Please upload a reference photo to help us understand your style preferences.');
      return;
    }

    setIsLoading(true);

    // Simulate Gray Whale API call
    setTimeout(() => {
      const preferences: UserPreferences = {
        eventType: 'custom', // Derived from AI prompt analysis
        stylePrompt: stylePrompt.trim(),
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
    }, 2000); // Longer delay to simulate Gray Whale processing
  };

  const handleInputFocus = () => {
    if (showSuggestions) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSuggestions(false));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.aiIcon}>
          <Text style={styles.aiIconText}>✨</Text>
        </View>
        <Text style={styles.title}>FittedAI Style Assistant</Text>
        <Text style={styles.subtitle}>Tell me what you're looking for and I'll find the perfect outfit</Text>
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        {/* Reference Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionTitle}>
            {referenceImage ? '✅ Reference Photo Added' : '📷 Add Reference Photo (Required)'}
          </Text>
          <TouchableOpacity 
            style={[styles.imagePicker, referenceImage && styles.imagePickerSelected]} 
            onPress={pickImage}
          >
            {referenceImage ? (
              <Image source={{ uri: referenceImage }} style={styles.referenceImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📸</Text>
                <Text style={styles.imagePlaceholderLabel}>Tap to upload your style reference</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        {showSuggestions && (
          <Animated.View style={[styles.suggestionsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.suggestionsTitle}>Try asking me about:</Text>
            <View style={styles.suggestionsGrid}>
              {STYLE_SUGGESTIONS.slice(0, 6).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionSelect(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Chat Messages */}
        {stylePrompt && !showSuggestions && (
          <View style={styles.messagesContainer}>
            <View style={styles.userMessage}>
              <Text style={styles.userMessageText}>{stylePrompt}</Text>
            </View>
            <View style={styles.aiMessage}>
              <Text style={styles.aiMessageText}>
                Perfect! I'll analyze your style preferences and find matching outfits. 
                {referenceImage ? ' Your reference photo will help me understand your taste better.' : ' Don\'t forget to add a reference photo!'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Describe the outfit you're looking for..."
            value={stylePrompt}
            onChangeText={setStylePrompt}
            onFocus={handleInputFocus}
            multiline
            maxLength={200}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!stylePrompt.trim() || !referenceImage || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!stylePrompt.trim() || !referenceImage || isLoading}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? '⏳' : '✨'}
            </Text>
          </TouchableOpacity>
        </View>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🧠 Gray Whale is analyzing your style...</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  aiIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatContent: {
    padding: 20,
    paddingBottom: 100,
  },
  photoSection: {
    marginBottom: 25,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  imagePicker: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePickerSelected: {
    borderColor: '#10b981',
    borderStyle: 'solid',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 28,
    marginBottom: 6,
  },
  imagePlaceholderLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  messagesContainer: {
    marginTop: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    maxWidth: '80%',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  aiMessageText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  loadingContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});
