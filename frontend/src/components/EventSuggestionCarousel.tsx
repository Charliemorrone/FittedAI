import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface EventSuggestion {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface Props {
  suggestions: EventSuggestion[];
  onSuggestionPress: (suggestion: EventSuggestion) => void;
}

const EventSuggestionCarousel: React.FC<Props> = ({ suggestions, onSuggestionPress }) => {
  const cardWidth = (width - 60) / 2.2; // Show 2.2 cards at a time for scroll hint

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Popular</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12} // Card width + margin
        snapToAlignment="start"
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              { width: cardWidth },
              index === 0 && styles.firstCard,
              index === suggestions.length - 1 && styles.lastCard,
            ]}
            onPress={() => onSuggestionPress(suggestion)}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={suggestion.icon} 
r                size={20} 
                color="#111827" 
              />
            </View>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  suggestionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 18,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default EventSuggestionCarousel;
