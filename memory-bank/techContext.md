# Technical Context: FittedAI

## Technology Stack

- **Frontend**: React Native
- **Architecture**: Serverless (for hackathon)
- **Recommendation Engine**: Gray Whale algorithm
- **Image Processing**: AI-generated outfit photos
- **E-commerce**: Amazon integration
- **State Management**: React Context/Redux (TBD)

## Development Environment

- **Platform**: Cross-platform (iOS/Android)
- **IDE**: Cursor
- **Package Manager**: npm/yarn
- **Version Control**: Git

## Key Technical Decisions

1. **React Native with Expo**: Cross-platform development for hackathon efficiency
2. **Serverless**: Rapid deployment without backend complexity
3. **Pre-built Dataset**: Pre-generated images for faster recommendations
4. **Gray Whale Integration**: Core recommendation algorithm
5. **Modern UI Framework**: ChatGPT-style interface with light mode
6. **Component Architecture**: Reusable components with TypeScript

## Current Dependencies

- **React Native & Expo**: Core framework
- **React Navigation**: Screen navigation with custom headers
- **Expo Image Picker**: Professional image selection
- **Ionicons**: Modern icon library throughout app
- **React Native Gesture Handler**: Swipe functionality
- **TypeScript**: Type safety and better development experience

## Component Architecture

- **EventSuggestionCarousel**: Reusable scrollable suggestion component
- **Custom Navigation**: SafeAreaView with modern headers
- **Service Layer**: Mock Gray Whale and Amazon integration
- **Type Definitions**: Comprehensive TypeScript interfaces

## Technical Constraints

- Hackathon timeline (rapid development)
- Serverless architecture (no persistent backend)
- Pre-built image dataset (no real-time generation)
- Mobile-first design

## Development Setup

- Node.js environment
- React Native CLI
- iOS/Android simulators
- Gray Whale algorithm access
