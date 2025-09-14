// Gray Whale Algorithm Integration Service
import {
  UserPreferences,
  OutfitRecommendation,
  GrayWhaleResponse,
} from "../types";
import grayWhaleApiClient from "./grayWhaleApi";

export class GrayWhaleService {
  private static instance: GrayWhaleService;
  private baseUrl: string = "https://api.graywhale.com"; // Replace with actual API endpoint

  public static getInstance(): GrayWhaleService {
    if (!GrayWhaleService.instance) {
      GrayWhaleService.instance = new GrayWhaleService();
    }
    return GrayWhaleService.instance;
  }

  /**
   * Get outfit recommendations using Gray Whale algorithm
   */
  async getRecommendations(
    preferences: UserPreferences
  ): Promise<OutfitRecommendation[]> {
    try {
      // If configured, use the Gray Whale API client (ProductGenius hackathon feed)
      if (grayWhaleApiClient.hasValidConfig()) {
        console.log(
          "🔧 GrayWhaleService: API client has valid config, calling fetchRecommendations..."
        );
        const apiRecs = await grayWhaleApiClient.fetchRecommendations(
          preferences
        );
        console.log("🔧 GrayWhaleService: fetchRecommendations returned:", {
          hasResults: !!apiRecs,
          count: apiRecs?.length || 0,
          firstResult: apiRecs?.[0]
            ? {
                id: apiRecs[0].id,
                styleDescription: apiRecs[0].styleDescription,
                itemsCount: apiRecs[0].items?.length || 0,
              }
            : null,
        });
        if (apiRecs && apiRecs.length > 0) return apiRecs;
      } else {
        console.log("🔧 GrayWhaleService: API client has NO valid config");
      }
      // Fallback to mock data
      console.log("🔧 GrayWhaleService: Falling back to mock data");
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
      console.error("Error fetching recommendations:", error);
      throw new Error(
        "Failed to get recommendations from Gray Whale algorithm"
      );
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
      // TODO: If the backend supports incremental updates, wire here.
      // Fallback: return updated mock data filtered by feedback
      return this.getMockRecommendations(
        preferences,
        likedOutfits,
        dislikedOutfits
      );

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
      console.error("Error updating recommendations:", error);
      throw new Error("Failed to update recommendations");
    }
  }

  /**
   * Send like/dislike feedback events to Gray Whale API (non-blocking)
   */
  async sendFeedback(
    actions: Array<{
      outfitId: string;
      action: "like" | "dislike";
      timestamp: number;
    }>
  ): Promise<void> {
    try {
      if (grayWhaleApiClient.hasValidConfig()) {
        await grayWhaleApiClient.sendFeedback(actions);
      }
    } catch (error) {
      // Non-fatal; log and continue
      console.warn("GrayWhaleService.sendFeedback error", error);
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
        id: "1",
        items: [
          {
            id: "item1",
            name: "Elegant Black Dress",
            brand: "Fashion Brand",
            price: 89.99,
            imageUrl:
              "https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Dress",
            amazonUrl: "https://amazon.com/dress1",
            category: "top",
            colors: ["black"],
            sizes: ["S", "M", "L"],
          },
          {
            id: "item2",
            name: "Black Heels",
            brand: "Shoe Brand",
            price: 129.99,
            imageUrl:
              "https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Heels",
            amazonUrl: "https://amazon.com/heels1",
            category: "shoes",
            colors: ["black"],
            sizes: ["7", "8", "9", "10"],
          },
        ],
        imageUrl:
          "https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Outfit+1",
        eventType: preferences.eventType,
        styleDescription: preferences.stylePrompt,
        confidence: 0.85,
      },
      // Add more mock recommendations based on event type
    ];

    // Filter out disliked outfits and boost liked ones
    return mockRecommendations.filter(
      (rec) => !dislikedOutfits.includes(rec.id)
    );
  }
}

export default GrayWhaleService.getInstance();
