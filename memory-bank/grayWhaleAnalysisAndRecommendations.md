# Gray Whale API Analysis and Recommendations for FittedAI

## Current Implementation Analysis

### ✅ What's Working Well

1. **Configuration Setup**: The app has proper Gray Whale API credentials configured in `app.json`

   - Server URL: `https://app.productgenius.io`
   - Organization ID: `FittedAI`
   - Access Token: `7cd2e0b1-8328-4838-91e8-6457b9bed2db`

2. **Dual Project Support**: The app correctly implements A/B project switching

   - Wedding/formal events → Project A (`FittedAI-A`)
   - Other events → Project B (`FittedAI-B`)

3. **Fallback Strategy**: Three-tier fallback system is well implemented

   - Primary: Gray Whale API
   - Secondary: Local collections
   - Tertiary: Mock data

4. **Feedback Loop**: User swipe actions are captured and sent to Gray Whale API

5. **Session Management**: Unique session IDs are generated and maintained

### ⚠️ Current Issues Identified

#### 1. **Missing Project Setup**

**Problem**: The Gray Whale projects (`FittedAI-A` and `FittedAI-B`) may not exist or lack data
**Evidence**: API likely returning empty `cards` arrays
**Impact**: App falls back to local collections/mock data instead of using real recommendations

#### 2. **No Genius Items (Product Catalog)**

**Problem**: Projects probably have no genius items seeded
**Evidence**: Empty API responses suggest no items to recommend
**Impact**: Gray Whale has nothing to recommend from

#### 3. **No Model Creation/Promotion**

**Problem**: Projects may not have trained models or promoted models
**Evidence**: API working but returning no recommendations
**Impact**: Even with items, no AI model to generate recommendations

#### 4. **Limited Error Handling**

**Problem**: API errors are caught but not specifically handled
**Evidence**: Generic error logging without specific Gray Whale error analysis
**Impact**: Difficult to debug why API calls fail

#### 5. **Incomplete Item Data Mapping**

**Problem**: Gray Whale cards may not map perfectly to FittedAI's expected structure
**Evidence**: Complex mapping logic suggests inconsistent API responses
**Impact**: Recommendations may be incomplete or incorrectly formatted

## Specific Recommendations

### 1. Project Initialization (CRITICAL)

You need to set up your Gray Whale projects properly. Here's what you need to do:

```bash
# 1. Create Project A (for wedding/formal)
curl -X POST "https://app.productgenius.io/hackathon/project/create" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "FittedAI-A",
    "project_summary": "Fashion recommendations for formal events, weddings, and special occasions. Focuses on elegant, sophisticated, and event-appropriate attire with emphasis on formal wear, evening dresses, suits, and accessories suitable for upscale venues.",
    "hacker_email": "your-email@example.com",
    "first_name": "Your",
    "last_name": "Name"
  }'

# 2. Create Project B (for casual/other events)
curl -X POST "https://app.productgenius.io/hackathon/project/create" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "FittedAI-B",
    "project_summary": "Fashion recommendations for casual, business, and everyday events. Focuses on comfortable, stylish, and versatile clothing suitable for work, social gatherings, dates, travel, and daily activities.",
    "hacker_email": "your-email@example.com",
    "first_name": "Your",
    "last_name": "Name"
  }'
```

### 2. Seed Genius Items (CRITICAL)

You need to populate your projects with fashion items. Create a seeding script:

```typescript
// Create: frontend/src/scripts/seedGrayWhaleItems.ts
import { grayWhaleApiClient } from "../services/grayWhaleApi";

const formalItems = [
  {
    title: "Elegant Black Evening Dress",
    description:
      "Sophisticated black evening dress perfect for formal events, galas, and upscale dinners. Features a flattering silhouette with premium fabric construction. Ideal for wedding guests, cocktail parties, and black-tie occasions. Timeless design that exudes elegance and class.",
    image_url:
      "https://images.unsplash.com/photo-1566479179817-c0f2e2d4f2a6?w=400&h=600&fit=crop",
    external_url: "https://amazon.com/dp/B08N5WRWNW",
    metadata: [
      { key: "category", value: "dress" },
      { key: "occasion", value: "formal" },
      { key: "color", value: "black" },
      { key: "style", value: "evening" },
      { key: "price_range", value: "premium" },
    ],
  },
  // Add more formal items...
];

const casualItems = [
  {
    title: "Comfortable Casual Blazer",
    description:
      "Versatile casual blazer perfect for business casual settings, date nights, and smart casual events. Made with breathable fabric and modern cut. Great for layering over t-shirts or blouses. Suitable for work meetings, coffee dates, and weekend outings.",
    image_url:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop",
    external_url: "https://amazon.com/dp/B09ABC456",
    metadata: [
      { key: "category", value: "blazer" },
      { key: "occasion", value: "casual" },
      { key: "style", value: "business_casual" },
      { key: "versatility", value: "high" },
    ],
  },
  // Add more casual items...
];

async function seedItems() {
  // Seed Project A with formal items
  await fetch(
    "https://app.productgenius.io/hackathon/project/FittedAI-A/items/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 7cd2e0b1-8328-4838-91e8-6457b9bed2db",
      },
      body: JSON.stringify(formalItems),
    }
  );

  // Seed Project B with casual items
  await fetch(
    "https://app.productgenius.io/hackathon/project/FittedAI-B/items/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 7cd2e0b1-8328-4838-91e8-6457b9bed2db",
      },
      body: JSON.stringify(casualItems),
    }
  );
}
```

### 3. Create and Promote Models (CRITICAL)

After seeding items, you need to create AI models:

```bash
# Create model for Project A
curl -X POST "https://app.productgenius.io/hackathon/FittedAI-A/model/create" \
  -H "Authorization: Bearer 7cd2e0b1-8328-4838-91e8-6457b9bed2db"

# Create model for Project B
curl -X POST "https://app.productgenius.io/hackathon/FittedAI-B/model/create" \
  -H "Authorization: Bearer 7cd2e0b1-8328-4838-91e8-6457b9bed2db"

# After models are created (check email for completion), promote them
# You'll need to get the model IDs from the list endpoint first
```

### 4. Improve Error Handling

Update the Gray Whale service to provide better error diagnostics:

```typescript
// In grayWhaleService.ts
async getRecommendations(preferences: UserPreferences): Promise<OutfitRecommendation[]> {
  try {
    if (grayWhaleApiClient.hasValidConfig()) {
      const apiRecs = await grayWhaleApiClient.fetchRecommendations(preferences);
      if (apiRecs && apiRecs.length > 0) return apiRecs;

      // Log specific Gray Whale issues
      console.warn('🐋 Gray Whale API returned empty recommendations - possible causes:');
      console.warn('  1. Project may not exist or have no items');
      console.warn('  2. Model may not be created or promoted');
      console.warn('  3. Access token may be invalid');
      console.warn('  4. Organization ID may be incorrect');
    } else {
      console.warn('🐋 Gray Whale API not configured - missing credentials');
    }

    return this.getMockRecommendations(preferences);
  } catch (error) {
    console.error('🐋 Gray Whale API Error Details:', {
      message: error.message,
      stack: error.stack,
      preferences: {
        eventType: preferences.eventType,
        projectKey: preferences.grayWhaleProjectKey,
        stylePrompt: preferences.stylePrompt?.substring(0, 50) + '...'
      }
    });
    throw error;
  }
}
```

### 5. Add Health Check Endpoint

Create a way to verify your Gray Whale setup:

```typescript
// Add to grayWhaleApiClient.ts
public async healthCheck(): Promise<{
  projectA: boolean;
  projectB: boolean;
  itemsA: number;
  itemsB: number;
}> {
  const results = {
    projectA: false,
    projectB: false,
    itemsA: 0,
    itemsB: 0
  };

  try {
    // Check Project A
    const responseA = await fetch(
      `${this.config?.serverURL}/hackathon/project/FittedAI-A`,
      { headers: this.buildHeaders() }
    );
    results.projectA = responseA.ok;

    if (results.projectA) {
      const itemsA = await fetch(
        `${this.config?.serverURL}/hackathon/project/FittedAI-A/items/list`,
        { headers: this.buildHeaders() }
      );
      const itemsDataA = await itemsA.json();
      results.itemsA = itemsDataA?.length || 0;
    }

    // Check Project B
    const responseB = await fetch(
      `${this.config?.serverURL}/hackathon/project/FittedAI-B`,
      { headers: this.buildHeaders() }
    );
    results.projectB = responseB.ok;

    if (results.projectB) {
      const itemsB = await fetch(
        `${this.config?.serverURL}/hackathon/project/FittedAI-B/items/list`,
        { headers: this.buildHeaders() }
      );
      const itemsDataB = await itemsB.json();
      results.itemsB = itemsDataB?.length || 0;
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }

  return results;
}
```

### 6. Enhanced Feedback Events

Improve the feedback system to send richer events:

```typescript
// Update feedback in RecommendationScreen.tsx
const enhancedFeedback = {
  type: "swipe_feedback",
  action: direction === "right" ? "like" : "dislike",
  outfit_id: currentId,
  timestamp: Date.now(),
  context: {
    event_type: preferences.eventType,
    style_prompt: preferences.stylePrompt,
    swipe_position: currentIndex,
    total_items: isCollectionsMode
      ? collections.length
      : recommendations.length,
    session_duration: Date.now() - sessionStartTime,
  },
};
```

### 7. Local Item Schema Enhancement

If you need to maintain local fallback data, ensure it matches Gray Whale's expected format:

```json
{
  "sets": [
    {
      "id": "local_formal_001",
      "title": "Classic Wedding Guest Outfit",
      "description": "Elegant ensemble perfect for wedding ceremonies and receptions",
      "image_url": "https://images.unsplash.com/photo-1566479179817-c0f2e2d4f2a6",
      "score": 0.92,
      "items": [
        {
          "id": "dress_001",
          "title": "Midi Wrap Dress",
          "brand": "Elegant Essentials",
          "price": 89.99,
          "category": "dress",
          "external_url": "https://amazon.com/dp/B08N5WRWNW",
          "image_url": "https://images.unsplash.com/photo-1566479179817-c0f2e2d4f2a6",
          "colors": ["navy", "burgundy", "emerald"],
          "sizes": ["XS", "S", "M", "L", "XL"]
        }
      ]
    }
  ]
}
```

## Implementation Priority

### Phase 1: Critical Setup (Do First)

1. ✅ Create Gray Whale projects A & B
2. ✅ Seed projects with fashion items (minimum 20-30 items each)
3. ✅ Create and promote models for both projects
4. ✅ Test API responses

### Phase 2: Validation (Do Next)

1. ✅ Add health check functionality
2. ✅ Improve error handling and logging
3. ✅ Test project switching logic
4. ✅ Validate item data mapping

### Phase 3: Optimization (Do Later)

1. ✅ Enhanced feedback events
2. ✅ Performance monitoring
3. ✅ Cache management
4. ✅ User preference learning

## Expected Results After Implementation

1. **Gray Whale API calls should return actual recommendations** instead of falling back to local collections
2. **Project switching should work** - formal events get different recommendations than casual events
3. **Feedback loop should improve recommendations** over time as users swipe
4. **Better error messages** when things go wrong
5. **Ability to diagnose issues** with the health check functionality

## Testing Checklist

- [ ] Verify projects exist: `GET /hackathon/project/FittedAI-A` and `GET /hackathon/project/FittedAI-B`
- [ ] Verify items exist: `GET /hackathon/project/FittedAI-A/items/list`
- [ ] Verify models exist and are promoted: `GET /hackathon/FittedAI-A/model/list`
- [ ] Test feed endpoint: `POST /hackathon/FittedAI-A/feed/{session_id}`
- [ ] Test feedback: Send swipe events and verify they're received
- [ ] Test project switching: Wedding prompt → Project A, casual prompt → Project B
- [ ] Test fallback: Temporarily break API config and verify fallbacks work

The main issue is likely that your Gray Whale projects don't exist or have no data. Once you set up the projects properly with items and models, the API should start returning real recommendations instead of falling back to local collections.
