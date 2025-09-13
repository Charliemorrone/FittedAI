# FittedAI - Fashion Recommendation App

A React Native mobile app that uses the Gray Whale algorithm to provide personalized outfit recommendations based on user input and reference photos.

## Features

- **Event-based Recommendations**: Select from various event types (wedding, business, casual, etc.)
- **Style Input**: Describe your ideal outfit with text prompts
- **Reference Photos**: Upload reference images for style inspiration
- **Swipe Interface**: Swipe left/right to like or dislike outfit recommendations
- **Gray Whale Algorithm**: Intelligent recommendation system
- **Amazon Integration**: Direct purchase links for recommended items
- **AI-Generated Outfits**: Visual representation of recommended outfits

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for screen transitions
- **React Native Gesture Handler** for swipe interactions
- **Expo Image Picker** for photo selection
- **Gray Whale Algorithm** for recommendations
- **Amazon API** for product integration

## Project Structure

```
src/
├── screens/           # Main app screens
│   ├── InputScreen.tsx
│   ├── RecommendationScreen.tsx
│   └── PurchaseScreen.tsx
├── components/        # Reusable UI components
├── navigation/        # Navigation configuration
├── services/          # API services
│   ├── grayWhaleService.ts
│   └── amazonService.ts
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── assets/           # Images and static assets
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   npm run web     # Web browser
   ```

## App Flow

1. **Input Screen**: User selects event type, enters style description, and optionally uploads a reference photo
2. **Recommendation Screen**: User swipes through AI-generated outfit recommendations
3. **Purchase Screen**: User can select and purchase liked items through Amazon

## Gray Whale Integration

The app integrates with the Gray Whale algorithm for intelligent outfit recommendations. The service layer handles:
- Sending user preferences to the algorithm
- Processing recommendation responses
- Updating recommendations based on user feedback

## Amazon Integration

Direct integration with Amazon for:
- Product search and details
- Affiliate link generation
- Purchase flow management

## Development Notes

- Built for hackathon with serverless architecture
- Uses mock data for demonstration
- Pre-built image dataset for faster recommendations
- Focus on core functionality over polish

## Future Enhancements

- Real-time Gray Whale API integration
- User profile and preferences
- Outfit history and favorites
- Social sharing features
- Advanced filtering options
