# System Patterns: FittedAI

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Gray Whale     │    │   Amazon API    │
│   Frontend      │◄──►│   Algorithm      │◄──►│   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Pre-built     │
│   Image Dataset │
└─────────────────┘
```

## Core Components

### 1. Input Screen (ChatGPT-Style)

- Centered "What's the event?" question with modern typography
- Scrollable event suggestion carousel with real Ionicons
- Professional text input with image upload integration
- Reference photo requirement with visual feedback
- Suggestions stay visible until send button clicked

### 2. Event Suggestion Carousel

- Horizontal scrollable component with snap behavior
- Professional Ionicons (briefcase, heart, airplane, etc.)
- Modern card design with icon containers and shadows
- TypeScript interfaces for proper type safety
- Responsive sizing showing 2.2 cards for scroll hint

### 3. Recommendation Engine

- Gray Whale algorithm integration with enhanced loading
- Modern loading screen with processing steps
- Swipe gesture handling with modern icons
- Professional recommendation cards with confidence scoring
- Enhanced mock data with real brand names

### 4. Purchase Flow

- Clean item selection with modern checkboxes
- Amazon integration with professional styling
- Modern header with back navigation
- Enhanced item cards with proper spacing

### 5. Navigation System

- Custom headers with SafeAreaView
- Modern back buttons and navigation
- Light mode theme throughout
- Consistent styling patterns

## Data Flow

1. User inputs event + preferences + reference image
2. Gray Whale algorithm processes input
3. System queries pre-built image dataset
4. Recommendations displayed in swipe interface
5. User interactions update recommendation algorithm
6. Purchase flow aggregates selected items

## State Management Patterns

- **Global State**: User preferences, current recommendations
- **Local State**: Form inputs, UI interactions
- **Persistent State**: User history, preferences

## Navigation Structure

```
App
├── InputScreen (Event selection, preferences, image)
├── RecommendationScreen (Swipe interface)
└── PurchaseScreen (Amazon links, checkout)
```

## Key Design Patterns

- **Container/Presentational**: Separate logic from UI
- **Hooks**: Custom hooks for recommendation logic
- **Context**: Global state management
- **Gesture Handling**: Swipe interactions
