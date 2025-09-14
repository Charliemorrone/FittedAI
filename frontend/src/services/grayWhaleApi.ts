// Gray Whale API client compatible with the ProductGenius hackathon skeleton
// This client mirrors the web skeleton's endpoint pattern:
//   POST {serverURL}/hackathon/{organizationId}/feed/{sessionId}
// with Authorization: Bearer {accessToken}
// For React Native, we cannot rely on window globals, so we pass config via Expo constants.

// Use dynamic require for Expo Constants to avoid hard dependency in non-Expo envs
let ExpoConstants: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require("expo-constants");
} catch (e) {
  ExpoConstants = {};
}
import { UserPreferences, OutfitRecommendation } from "../types";

type GrayWhaleApiConfig = {
  serverURL: string;
  organizationId: string;
  accessToken: string;
};

type GrayWhaleCard = any;

export class GrayWhaleApiClient {
  private sessionId: string;
  private config: GrayWhaleApiConfig | null;

  constructor() {
    this.sessionId = GrayWhaleApiClient.generateSessionId();
    const extra =
      (ExpoConstants as any)?.expoConfig?.extra ||
      (ExpoConstants as any)?.manifest?.extra ||
      {};
    const serverURL =
      (extra.GRAY_WHALE_SERVER_URL as string | undefined) ||
      (process.env.GRAY_WHALE_SERVER_URL as string | undefined);
    const organizationId =
      (extra.GRAY_WHALE_ORG_ID as string | undefined) ||
      (process.env.GRAY_WHALE_ORG_ID as string | undefined);
    const accessToken =
      (extra.GRAY_WHALE_ACCESS_TOKEN as string | undefined) ||
      (process.env.GRAY_WHALE_ACCESS_TOKEN as string | undefined);
    if (serverURL && organizationId && accessToken) {
      this.config = { serverURL, organizationId, accessToken };
    } else {
      this.config = null;
    }
  }

  public hasValidConfig(): boolean {
    return !!this.config;
  }

  public async fetchRecommendations(
    preferences: UserPreferences
  ): Promise<OutfitRecommendation[]> {
    if (!this.config) return [];
    const url = this.buildFeedUrl(preferences.grayWhaleProjectKey);
    const body = {
      page: 1,
      batch_count: 10,
      // Optionally pass preferences for server-side personalization
      preferences,
    };

    console.log("🐋 Gray Whale API Request:", {
      url,
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body, null, 2),
    });

    const response = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    console.log(
      "🐋 Gray Whale API Response Status:",
      response.status,
      response.statusText
    );

    const payloadText = await response.text();
    console.log("🐋 Gray Whale Raw Response:", payloadText);

    if (!payloadText) {
      console.warn("⚠️ Gray Whale API returned empty response");
      return [];
    }

    const payload = JSON.parse(payloadText);
    console.log(
      "🐋 Gray Whale Parsed Payload:",
      JSON.stringify(payload, null, 2)
    );

    const cards: GrayWhaleCard[] = payload?.cards || [];
    console.log("🐋 Gray Whale Cards Extracted:", cards.length, "cards");
    cards.forEach((card, idx) => {
      console.log(`🐋 Card ${idx + 1}:`, JSON.stringify(card, null, 2));
    });

    const recommendations = this.mapCardsToRecommendations(cards, preferences);
    console.log(
      "🐋 Final Mapped Recommendations:",
      recommendations.length,
      "recommendations"
    );
    recommendations.forEach((rec, idx) => {
      console.log(`🐋 Recommendation ${idx + 1}:`, {
        id: rec.id,
        styleDescription: rec.styleDescription,
        confidence: rec.confidence,
        itemsCount: rec.items.length,
        items: rec.items.map((item) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          category: item.category,
          amazonUrl: item.amazonUrl,
        })),
      });
    });

    return recommendations;
  }

  public async sendFeedback(
    actions: Array<{
      outfitId: string;
      action: "like" | "dislike";
      timestamp: number;
    }>
  ): Promise<void> {
    if (!this.config) {
      console.log("👤 No Gray Whale config - skipping feedback");
      return;
    }

    const url = this.buildFeedUrl();
    const body = {
      // The skeleton accepts an `events` array during pagination; we reuse the same structure here
      events: actions.map((a) => ({
        type: "feedback",
        action: a.action,
        outfit_id: a.outfitId,
        timestamp: a.timestamp,
      })),
    };

    console.log("👤 Sending Gray Whale Feedback:", {
      url,
      actionsCount: actions.length,
      actions: actions.map((a) => ({
        outfitId: a.outfitId,
        action: a.action,
        timestamp: new Date(a.timestamp).toISOString(),
        timestampRaw: a.timestamp,
      })),
      requestBody: JSON.stringify(body, null, 2),
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      });

      console.log("👤 Gray Whale Feedback Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("👤 Gray Whale Feedback Error Response:", errorText);
      } else {
        console.log("✅ Gray Whale Feedback sent successfully");
      }
    } catch (e) {
      // Non-fatal for UX; log and continue
      console.warn("👤 GrayWhale feedback send failed", e);
    }
  }

  private buildHeaders(): HeadersInit {
    if (!this.config) return {};
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.accessToken}`,
    };
  }

  private buildFeedUrl(projectKey?: "A" | "B"): string {
    if (!this.config) return "";
    const { serverURL, organizationId } = this.config;
    // Allow two projects by suffixing organization ID, e.g., myshop-A / myshop-B
    const org = projectKey ? `${organizationId}-${projectKey}` : organizationId;
    return `${serverURL}/hackathon/${org}/feed/${this.sessionId}`;
  }

  private mapCardsToRecommendations(
    cards: GrayWhaleCard[],
    preferences: UserPreferences
  ): OutfitRecommendation[] {
    // Enhanced mapping that includes shopping data for Gray Whale cards
    const recs: OutfitRecommendation[] = cards
      .map((card: any, idx: number) => {
        const imageUrl =
          card?.imageUrl ||
          card?.image_url ||
          card?.image ||
          card?.thumbnail ||
          "https://via.placeholder.com/300x500/6366f1/FFFFFF?text=Gray+Whale+Rec";

        const title =
          card?.title ||
          card?.name ||
          card?.heading ||
          "Gray Whale Recommendation";

        const confidence =
          typeof card?.score === "number"
            ? Math.max(0, Math.min(1, card.score))
            : 0.85; // Higher default confidence for Gray Whale

        const id = String(
          card?.id || card?.sku || card?.asin || `gw_${Date.now()}_${idx}`
        );

        // Extract shopping items from Gray Whale card structure
        const items = this.extractItemsFromCard(card, idx);

        return {
          id,
          items,
          imageUrl,
          eventType: preferences.eventType,
          styleDescription: title,
          confidence,
        } as OutfitRecommendation;
      })
      .filter(Boolean);
    return recs;
  }

  private extractItemsFromCard(card: any, idx: number): any[] {
    // Try to extract individual items from Gray Whale card
    // This handles various possible Gray Whale response structures

    const items: any[] = [];

    // Method 1: Check if card has items array
    if (Array.isArray(card?.items)) {
      return card.items.map((item: any, itemIdx: number) => ({
        id: item?.id || item?.sku || item?.asin || `gw_item_${idx}_${itemIdx}`,
        name:
          item?.title ||
          item?.name ||
          item?.product_name ||
          `Gray Whale Item ${itemIdx + 1}`,
        brand:
          item?.brand ||
          this.extractBrandFromTitle(item?.title || item?.name) ||
          "Brand",
        price:
          this.parsePrice(item?.price) ||
          this.estimatePriceByCategory(item?.category),
        imageUrl:
          item?.imageUrl ||
          item?.image_url ||
          item?.image ||
          item?.thumbnail ||
          `https://via.placeholder.com/300x400/6366f1/FFFFFF?text=${encodeURIComponent(
            item?.title || "Item"
          )}`,
        amazonUrl:
          item?.amazonUrl ||
          item?.external_url ||
          item?.product_url ||
          item?.url ||
          "#",
        category: this.mapToStandardCategory(item?.category || item?.type),
        colors: Array.isArray(item?.colors)
          ? item.colors
          : item?.color
          ? [item.color]
          : ["Multi"],
        sizes: Array.isArray(item?.sizes)
          ? item.sizes
          : this.getDefaultSizes(item?.category),
      }));
    }

    // Method 2: Check if card itself represents a single item
    if (card?.amazonUrl || card?.external_url || card?.product_url) {
      items.push({
        id: card?.id || card?.sku || card?.asin || `gw_single_${idx}`,
        name:
          card?.title ||
          card?.name ||
          card?.product_name ||
          "Gray Whale Recommendation",
        brand:
          card?.brand || this.extractBrandFromTitle(card?.title) || "Brand",
        price: this.parsePrice(card?.price) || 89.99,
        imageUrl:
          card?.imageUrl ||
          card?.image_url ||
          card?.image ||
          card?.thumbnail ||
          "https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Gray+Whale+Item",
        amazonUrl:
          card?.amazonUrl ||
          card?.external_url ||
          card?.product_url ||
          card?.url ||
          "#",
        category:
          this.mapToStandardCategory(card?.category || card?.type) || "top",
        colors: Array.isArray(card?.colors)
          ? card.colors
          : card?.color
          ? [card.color]
          : ["Multi"],
        sizes: Array.isArray(card?.sizes)
          ? card.sizes
          : this.getDefaultSizes(card?.category),
      });
    }

    // Method 3: If no items found, create a placeholder item for the outfit
    if (items.length === 0) {
      items.push({
        id: `gw_outfit_${idx}`,
        name: card?.title || card?.name || "Complete Gray Whale Outfit",
        brand: "Gray Whale",
        price: 149.99,
        imageUrl:
          card?.imageUrl ||
          card?.image_url ||
          card?.image ||
          "https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Complete+Outfit",
        amazonUrl: "#", // No direct purchase link for complete outfits
        category: "top" as const,
        colors: ["Multi"],
        sizes: ["M", "L"],
      });
    }

    return items;
  }

  private extractBrandFromTitle(title?: string): string {
    if (!title) return "Brand";
    const words = title.split(" ");
    return words.length > 1 ? words[0] : "Brand";
  }

  private parsePrice(priceStr: any): number | null {
    if (typeof priceStr === "number") return priceStr;
    if (typeof priceStr === "string") {
      const match = priceStr.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : null;
    }
    return null;
  }

  private estimatePriceByCategory(category?: string): number {
    const categoryPrices: Record<string, number> = {
      top: 79.99,
      bottom: 59.99,
      shoes: 89.99,
      accessories: 29.99,
    };
    return categoryPrices[category || "top"] || 79.99;
  }

  private mapToStandardCategory(
    category?: string
  ): "top" | "bottom" | "shoes" | "accessories" {
    if (!category) return "top";
    const lower = category.toLowerCase();
    if (
      lower.includes("shirt") ||
      lower.includes("top") ||
      lower.includes("dress") ||
      lower.includes("kurta") ||
      lower.includes("blazer")
    )
      return "top";
    if (
      lower.includes("pant") ||
      lower.includes("bottom") ||
      lower.includes("trouser") ||
      lower.includes("jean")
    )
      return "bottom";
    if (
      lower.includes("shoe") ||
      lower.includes("boot") ||
      lower.includes("sneaker") ||
      lower.includes("sandal")
    )
      return "shoes";
    return "accessories";
  }

  private getDefaultSizes(category?: string): string[] {
    const lower = (category || "").toLowerCase();
    if (
      lower.includes("shoe") ||
      lower.includes("boot") ||
      lower.includes("sneaker")
    ) {
      return ["7", "8", "9", "10", "11"];
    }
    if (
      lower.includes("pant") ||
      lower.includes("bottom") ||
      lower.includes("trouser")
    ) {
      return ["30", "32", "34", "36", "38"];
    }
    return ["XS", "S", "M", "L", "XL"];
  }

  private static generateSessionId(): string {
    // Lightweight UUID-like generator without external deps
    const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    return template.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

const grayWhaleApiClient = new GrayWhaleApiClient();
export default grayWhaleApiClient;
