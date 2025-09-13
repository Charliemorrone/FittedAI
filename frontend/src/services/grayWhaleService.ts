// Gray Whale Algorithm Integration Service
import { UserPreferences, OutfitRecommendation, GrayWhaleResponse } from '../types';

export class GrayWhaleService {
  private static instance: GrayWhaleService;
  private baseUrl: string = 'https://api.graywhale.com'; // Replace with actual API endpoint

  public static getInstance(): GrayWhaleService {
    if (!GrayWhaleService.instance) {
      GrayWhaleService.instance = new GrayWhaleService();
    }
    return GrayWhaleService.instance;
  }

  /**
   * Get outfit recommendations using Gray Whale algorithm
   */
  async getRecommendations(preferences: UserPreferences): Promise<OutfitRecommendation[]> {
    try {
      // For hackathon demo, we'll use mock data
      // In production, this would call the actual Gray Whale API
      return this.getMockRecommendations(preferences);
      
      // Uncomment for actual API integration:
      /*
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GRAY_WHALE_API_KEY}`,
        },
        body: JSON.stringify({
          eventType: preferences.eventType,
          stylePrompt: preferences.stylePrompt,
          referenceImage: preferences.referenceImage,
          userPreferences: {
            sizePreferences: preferences.sizePreferences,
            colorPreferences: preferences.colorPreferences,
            priceRange: preferences.priceRange,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gray Whale API error: ${response.status}`);
      }

      const data: GrayWhaleResponse = await response.json();
      return data.recommendations;
      */
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to get recommendations from Gray Whale algorithm');
    }
  }

  /**
   * Update recommendations based on user feedback
   */
  async updateRecommendations(
    preferences: UserPreferences,
    likedOutfits: string[],
    dislikedOutfits: string[]
  ): Promise<OutfitRecommendation[]> {
    try {
      // For hackathon demo, return updated mock data
      return this.getMockRecommendations(preferences, likedOutfits, dislikedOutfits);
      
      // Uncomment for actual API integration:
      /*
      const response = await fetch(`${this.baseUrl}/recommendations/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GRAY_WHALE_API_KEY}`,
        },
        body: JSON.stringify({
          preferences,
          likedOutfits,
          dislikedOutfits,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gray Whale API error: ${response.status}`);
      }

      const data: GrayWhaleResponse = await response.json();
      return data.recommendations;
      */
    } catch (error) {
      console.error('Error updating recommendations:', error);
      throw new Error('Failed to update recommendations');
    }
  }

  /**
   * Mock recommendations for hackathon demo
   */
  private getMockRecommendations(
    preferences: UserPreferences,
    likedOutfits: string[] = [],
    dislikedOutfits: string[] = []
  ): OutfitRecommendation[] {
    // This would be replaced with actual Gray Whale algorithm integration
    const mockRecommendations: OutfitRecommendation[] = [
      {
        id: '1',
        items: [
          {
            id: 'item1',
            name: 'Elegant Black Dress',
            brand: 'Fashion Brand',
            price: 89.99,
            imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Dress',
            amazonUrl: 'https://amazon.com/dress1',
            category: 'top',
            colors: ['black'],
            sizes: ['S', 'M', 'L'],
          },
          {
            id: 'item2',
            name: 'Black Heels',
            brand: 'Shoe Brand',
            price: 129.99,
            imageUrl: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Heels',
            amazonUrl: 'https://amazon.com/heels1',
            category: 'shoes',
            colors: ['black'],
            sizes: ['7', '8', '9', '10'],
          },
        ],
        imageUrl: 'https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Outfit+1',
        eventType: preferences.eventType,
        styleDescription: preferences.stylePrompt,
        confidence: 0.85,
      },
      // Add more mock recommendations based on event type
    ];

    // Filter out disliked outfits and boost liked ones
    return mockRecommendations.filter(rec => !dislikedOutfits.includes(rec.id));
  }
}

export default GrayWhaleService.getInstance();
