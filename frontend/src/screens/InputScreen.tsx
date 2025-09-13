import React, { useState } from 'react';
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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, UserPreferences, EventType } from '../types';

type InputScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InputScreen'>;

interface Props {
  navigation: InputScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const EVENT_TYPES: EventType[] = [
  { id: 'wedding', name: 'Wedding', description: 'Elegant and formal attire', icon: '💒' },
  { id: 'business', name: 'Business Meeting', description: 'Professional and polished', icon: '💼' },
  { id: 'casual', name: 'Casual Outing', description: 'Comfortable and relaxed', icon: '👕' },
  { id: 'date', name: 'Date Night', description: 'Romantic and stylish', icon: '💕' },
  { id: 'party', name: 'Party', description: 'Fun and trendy', icon: '🎉' },
  { id: 'gym', name: 'Gym/Workout', description: 'Athletic and functional', icon: '🏃‍♀️' },
];

export default function InputScreen({ navigation }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleContinue = async () => {
    if (!selectedEvent || !stylePrompt.trim()) {
      Alert.alert('Missing Information', 'Please select an event type and provide a style description.');
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const preferences: UserPreferences = {
        eventType: selectedEvent,
        stylePrompt: stylePrompt.trim(),
        referenceImage: referenceImage || undefined,
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
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>What's the occasion?</Text>
        <Text style={styles.subtitle}>Tell us about your event and style preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Type</Text>
        <View style={styles.eventGrid}>
          {EVENT_TYPES.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventCard,
                selectedEvent === event.id && styles.eventCardSelected,
              ]}
              onPress={() => setSelectedEvent(event.id)}
            >
              <Text style={styles.eventIcon}>{event.icon}</Text>
              <Text style={[
                styles.eventName,
                selectedEvent === event.id && styles.eventNameSelected,
              ]}>
                {event.name}
              </Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style Description</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe your ideal outfit (e.g., 'elegant black dress with heels', 'casual jeans and t-shirt')"
          value={stylePrompt}
          onChangeText={setStylePrompt}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reference Photo (Optional)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {referenceImage ? (
            <Image source={{ uri: referenceImage }} style={styles.referenceImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📷</Text>
              <Text style={styles.imagePlaceholderLabel}>Tap to add a reference photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Finding Recommendations...' : 'Get Recommendations'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
  },
  eventGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  eventCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  eventIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  eventNameSelected: {
    color: '#6366f1',
  },
  eventDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 80,
  },
  imagePicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePlaceholderLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
