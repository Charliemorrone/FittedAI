# Gray Whale API Reference for FittedAI

## Overview

The Gray Whale API is a hackathon-specific implementation of a recommendation system that provides personalized fashion recommendations based on user preferences and feedback. This document serves as a comprehensive reference for implementing the Gray Whale API in the FittedAI project.

## API Base Structure

The Gray Whale API follows the ProductGenius hackathon skeleton pattern:

- **Base URL**: Configurable server URL
- **Authentication**: Bearer token authorization
- **Project Management**: Supports dual project configuration (A/B)

## Core Endpoints

### 1. Project Management

#### Create Project

```
POST /hackathon/project/create
```

**Request Body:**

```json
{
  "project_name": "string (unique identifier)",
  "project_summary": "string (detailed description)",
  "hacker_email": "string (notification email)",
  "first_name": "string (optional)",
  "last_name": "string (optional)"
}
```

**Response:**

```json
{
  "project_name": "string",
  "project_summary": "string",
  "hacker_email": "string",
  "access_token": "string (secret)"
}
```

#### List Projects

```
GET /hackathon/project/list
```

#### Get Project Details

```
GET /hackathon/project/{project_name}
```

#### Update Project

```
PUT /hackathon/project/{project_name}/update
```

### 2. Genius Items (Product Catalog)

#### List Items

```
GET /hackathon/project/{project_name}/items/list?page=1&count=10
```

#### Get Item Details

```
GET /hackathon/project/{project_name}/items/{item_id}
```

#### Create Items

```
POST /hackathon/project/{project_name}/items/create
```

**Request Body:**

```json
[
  {
    "id": "string (optional UUID)",
    "title": "string (descriptive title)",
    "description": "string (detailed description - verbosity is key)",
    "image_url": "string (display image URL)",
    "external_url": "string (purchase/product URL)",
    "metadata": [
      {
        "key": "string",
        "value": "string"
      }
    ]
  }
]
```

#### Update Item

```
PUT /hackathon/project/{project_name}/items/{item_id}/update
```

#### Delete Item

```
DELETE /hackathon/project/{project_name}/items/{item_id}/delete
```

### 3. Model Management

#### List Instructions

```
GET /hackathon/{project_name}/model/instruction/list
```

#### Create Instructions

```
POST /hackathon/{project_name}/model/instruction/create
```

**Request Body:**

```json
{
  "instructions": [
    {
      "promptlet": "string (instruction text)"
    }
  ]
}
```

#### Create Model

```
POST /hackathon/{project_name}/model/create
```

_Note: This triggers model building and can take significant time_

#### Promote Model

```
POST /hackathon/{project_name}/model/{model_id}/promote
```

### 4. Feed (Recommendations)

#### Get Batch Recommendations (Item IDs Only)

```
POST /hackathon/{project_name}/batch/{session_id}
```

#### Get Feed Recommendations (Full Cards)

```
POST /hackathon/{project_name}/feed/{session_id}
```

**Request Body:**

```json
{
  "page": "number (optional, default: 1)",
  "batch_count": "number (optional, default: 10)",
  "events": [
    {
      "type": "string (event type)",
      "action": "string (like/dislike/view)",
      "outfit_id": "string (item identifier)",
      "timestamp": "number (unix timestamp)"
    }
  ],
  "search_prompt": "string (optional search filter)"
}
```

**Response Structure:**

```json
{
  "cards": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "image_url": "string",
      "external_url": "string",
      "score": "number (0-1 confidence)",
      "metadata": "object",
      "items": [
        {
          "id": "string",
          "title": "string",
          "brand": "string",
          "price": "number|string",
          "image_url": "string",
          "external_url": "string",
          "category": "string",
          "colors": ["string"],
          "sizes": ["string"]
        }
      ]
    }
  ]
}
```

## FittedAI Implementation Details

### Current Configuration

The app is configured to use Gray Whale API through environment variables:

- `GRAY_WHALE_SERVER_URL`: Base API server URL
- `GRAY_WHALE_ORG_ID`: Organization/project identifier
- `GRAY_WHALE_ACCESS_TOKEN`: Authentication token

### Project Selection Logic

The app implements dual project support:

- **Project A**: Used for wedding/formal events
- **Project B**: Used for all other events
- Logic: Keywords "wedding" or "formal" in user input → Project A, otherwise Project B

### Current Flow

1. **Input Screen**: User provides event type, style prompt, and reference image
2. **Recommendation Screen**:
   - Calls Gray Whale API with user preferences
   - Falls back to local collections if API fails
   - Falls back to mock data as final option
3. **Feedback Loop**: User swipes send feedback events to Gray Whale
4. **Auto-refresh**: Every 5 swipes triggers new recommendations based on feedback

### Data Mapping

The current implementation maps Gray Whale cards to FittedAI's outfit recommendation format:

```typescript
OutfitRecommendation {
  id: string,
  items: OutfitItem[],
  imageUrl: string,
  eventType: string,
  styleDescription: string,
  confidence: number
}

OutfitItem {
  id: string,
  name: string,
  brand: string,
  price: number,
  imageUrl: string,
  amazonUrl: string,
  category: 'top' | 'bottom' | 'shoes' | 'accessories',
  colors: string[],
  sizes: string[]
}
```

## Key Implementation Considerations

### 1. Session Management

- Each user session gets a unique session ID
- Session ID is used consistently across all API calls
- Feedback events are tied to the session for personalization

### 2. Fallback Strategy

The app implements a three-tier fallback:

1. **Primary**: Gray Whale API
2. **Secondary**: Local collections (JSON file)
3. **Tertiary**: Mock data

### 3. Event Tracking

User interactions are tracked and sent as feedback events:

- **Like/Dislike**: Swipe actions on recommendations
- **View**: Card display events
- **Purchase Intent**: Shopping button interactions

### 4. Error Handling

- API failures gracefully fall back to local data
- Network timeouts are handled appropriately
- Invalid responses are logged and handled

### 5. Performance Optimization

- Recommendations are cached locally
- Auto-refresh prevents stale data
- Parallel image loading with fallbacks

## Common Issues and Solutions

### Issue 1: Empty API Responses

**Problem**: Gray Whale API returns empty cards array
**Solution**: Ensure project has genius items and promoted model

### Issue 2: Image Loading Failures

**Problem**: Product images fail to load from Amazon URLs
**Solution**: Implement multiple image URL attempts with fallbacks

### Issue 3: Price Data Missing

**Problem**: Items returned without price information
**Solution**: Estimate prices by category or display "See Amazon for price"

### Issue 4: Category Mapping

**Problem**: Gray Whale categories don't match FittedAI categories
**Solution**: Implement category mapping function

## Best Practices

1. **Verbose Item Descriptions**: Gray Whale performs better with detailed item descriptions
2. **Consistent Feedback**: Send user interaction events consistently for better recommendations
3. **Model Management**: Regularly create and promote new models as data grows
4. **Error Logging**: Comprehensive logging for debugging API issues
5. **Graceful Degradation**: Always have fallback options for API failures

## Testing Recommendations

1. Test with real Gray Whale credentials
2. Verify project setup and model promotion
3. Test feedback loop functionality
4. Validate item data mapping
5. Test fallback scenarios
6. Performance test with large item catalogs

## Security Considerations

- Store API credentials securely (environment variables)
- Validate all API responses before processing
- Implement rate limiting to avoid API abuse
- Sanitize user input before sending to API
