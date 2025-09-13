// Core types for the FittedAI fashion recommendation app

export interface EventType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface OutfitItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  amazonUrl: string;
  category: "top" | "bottom" | "shoes" | "accessories";
  colors: string[];
  sizes: string[];
}

export interface OutfitRecommendation {
  id: string;
  items: OutfitItem[];
  imageUrl: string;
  eventType: string;
  styleDescription: string;
  confidence: number;
  isLiked?: boolean;
}

export interface UserPreferences {
  eventType: string;
  stylePrompt: string;
  referenceImage?: string;
  likedOutfits: string[];
  dislikedOutfits: string[];
  sizePreferences: {
    top: string;
    bottom: string;
    shoes: string;
  };
  colorPreferences: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface SwipeAction {
  outfitId: string;
  action: "like" | "dislike";
  timestamp: number;
}

export interface PurchaseItem {
  outfitId: string;
  items: OutfitItem[];
  totalPrice: number;
  amazonUrls: string[];
}

// Navigation types
export type RootStackParamList = {
  SplashScreen: undefined;
  InputScreen: undefined;
  CameraScreen: undefined;
  RecommendationScreen: {
    preferences: UserPreferences;
  };
  PurchaseScreen: {
    purchaseItem: PurchaseItem;
  };
};

// API Response types
export interface GrayWhaleResponse {
  recommendations: OutfitRecommendation[];
  nextBatch?: boolean;
  algorithmVersion: string;
}

export interface AmazonProductResponse {
  asin: string;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  availability: boolean;
}
