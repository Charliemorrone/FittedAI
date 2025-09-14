# Active Context: FittedAI

## Current Focus

**Gray Whale API integration prioritized and enhanced** - API now takes priority over local collections, with comprehensive shopping data mapping. Modern Tinder-like swipe interface implemented with dual project support.

## Recent Changes

- ✅ Complete UI revamp to modern ChatGPT-style light mode interface
- ✅ Replaced emojis with professional Ionicons throughout app
- ✅ Created scrollable EventSuggestionCarousel component
- ✅ Fixed suggestion flow - suggestions stay visible until send button clicked
- ✅ Implemented modern light theme with clean white backgrounds
- ✅ Added proper SafeAreaView and navigation headers
- ✅ Enhanced loading screens with Gray Whale branding
- ✅ Improved input validation and user feedback
- ✅ **Modern Tinder-like swipe interface** with card stack and rotation animations
- ✅ **Gray Whale API integration** with configurable dual project support (A/B)
- ✅ **Collections mode** - displays local outfit sets from JSON with swipeable cards
- ✅ **Auto-refresh after 3 swipes** for immediate re-ranking from API
- ✅ **Dynamic project selection** based on user input (wedding/formal → A, else → B)
- ✅ **VEO 3 Video Generation** - Premium feature that unlocks after 3 swipes
- ✅ **Partner Photo Support** - Couple video generation with partner reference photos
- ✅ **Animated Unlock Experience** - Spectacular button appearance with notifications
- ✅ **VEO Service Integration** - Google VEO 3 API wrapper with video generation
- ✅ **Real Google API Integration** - Direct calls to Google VEO 3 with multiple endpoint support
- ✅ **Smart Fallback System** - Graceful degradation to demo mode if API fails
- ✅ **In-App Video Player** - Native video playback with expo-av integration
- ✅ **Seamless Video Experience** - Auto-polling, progress tracking, and instant display
- ✅ **Video Controls** - Play/pause, error handling, and loading states
- ✅ **Gray Whale API Priority** - API-first approach with enhanced item data mapping
- ✅ **Smart Shopping Integration** - Gray Whale responses now include detailed purchase data

## Latest Updates (September 2025)

- ✅ **Gray Whale API Data Structure Update** - Fixed parsing of actual API response structure with product.product_url and product.attributes
- ✅ **Batch Loading System** - Implemented 3-at-a-time recommendation loading for better performance
- ✅ **Smart Image Fallback** - Enhanced image loading with fallback to attribute images when product_url is empty
- ✅ **Clean Card Interface** - Removed description and confidence overlays for photo-only swipeable cards
- ✅ **Consistent Image Fitting** - Applied resizeMode: 'contain' to both recommendation and purchase screen images
- ✅ **Flexible Attribute Parsing** - Support for both singular and plural attribute names (image_url/image_urls)
- ✅ **Auto-pagination** - Seamless loading of more recommendations when approaching end of current batch

## Next Steps

1. Create splash screen for app launch
2. Create item detail screen that appears when clicking on outfit photos
3. Add video status tracking modal for VEO generation progress
4. Implement video playback functionality when generation completes
5. Add VEO credits system and usage tracking
6. Polish animations and micro-interactions
7. Add user preferences persistence
8. Testing with real Gray Whale API endpoints
9. Enhanced error handling and offline support

## Active Decisions

- **Architecture**: React Native with serverless approach
- **Navigation**: React Navigation for screen transitions
- **State Management**: React Context for global state
- **Image Handling**: Pre-built dataset for hackathon efficiency

## Current Blockers

- Need to initialize React Native project
- Gray Whale algorithm integration details
- Amazon API setup requirements

## Development Priorities

1. Core UI screens and navigation
2. Swipe gesture implementation
3. Basic recommendation flow
4. Purchase integration
5. Gray Whale algorithm integration

## Notes

- Focus on MVP for hackathon timeline
- Prioritize core functionality over polish
- Use pre-built images to avoid real-time generation complexity
- **Gray Whale API Config**: Set GRAY_WHALE_SERVER_URL, GRAY_WHALE_ORG_ID, GRAY_WHALE_ACCESS_TOKEN in app.json
- **Collections**: Local JSON file (collections.json) takes priority over API for demo purposes
- **Project Selection**: Keywords "wedding"/"formal" → Project A, others → Project B
