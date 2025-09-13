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

### 1. Input Screen
- Event selection dropdown
- Text input for style preferences
- Image picker for reference photos
- Form validation

### 2. Recommendation Engine
- Gray Whale algorithm integration
- Image matching logic
- Recommendation scoring
- Dataset querying

### 3. Swipe Interface
- Gesture recognition
- Image carousel
- Like/dislike tracking
- Recommendation updates

### 4. Purchase Flow
- Item aggregation
- Amazon link generation
- Purchase confirmation
- Order tracking

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
