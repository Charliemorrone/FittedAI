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

    console.log("🔍 GRAY WHALE CONFIG DEBUG:", {
      ExpoConstants: !!ExpoConstants,
      expoConfig: !!(ExpoConstants as any)?.expoConfig,
      manifest: !!(ExpoConstants as any)?.manifest,
      extra: extra,
      extraKeys: Object.keys(extra || {}),
    });

    const serverURL =
      (extra.GRAY_WHALE_SERVER_URL as string | undefined) ||
      (process.env.GRAY_WHALE_SERVER_URL as string | undefined);
    const organizationId =
      (extra.GRAY_WHALE_ORG_ID as string | undefined) ||
      (process.env.GRAY_WHALE_ORG_ID as string | undefined);
    const accessToken =
      (extra.GRAY_WHALE_ACCESS_TOKEN as string | undefined) ||
      (process.env.GRAY_WHALE_ACCESS_TOKEN as string | undefined);

    console.log("🔍 EXTRACTED CONFIG VALUES:", {
      serverURL: serverURL || "MISSING",
      organizationId: organizationId || "MISSING",
      accessToken: accessToken ? "PRESENT" : "MISSING",
    });

    if (serverURL && organizationId && accessToken) {
      this.config = { serverURL, organizationId, accessToken };
      console.log("✅ Gray Whale config successfully created");
    } else {
      // TEMPORARY FALLBACK: Use hardcoded values if Expo Constants fails
      console.log("❌ Gray Whale config FAILED - using hardcoded fallback");
      this.config = {
        serverURL: "https://app.productgenius.io",
        organizationId: "FittedAI",
        accessToken: "7cd2e0b1-8328-4838-91e8-6457b9bed2db",
      };
      console.log("🔧 Using hardcoded Gray Whale config as fallback");
    }
  }

  public hasValidConfig(): boolean {
    return !!this.config;
  }

  /**
   * Start a new session - generates new session ID for fresh recommendations
   */
  public startNewSession(): void {
    this.sessionId = GrayWhaleApiClient.generateSessionId();
    console.log("🔄 Gray Whale: Started new session:", this.sessionId);
  }

  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string {
    return this.sessionId;
  }

  public async fetchRecommendations(
    preferences: UserPreferences,
    page: number = 1,
    batchCount: number = 3
  ): Promise<OutfitRecommendation[]> {
    if (!this.config) return [];
    const url = this.buildFeedUrl(preferences.grayWhaleProjectKey);
    const body = {
      page: page,
      batch_count: batchCount,
      // Primary prompt/query that drives recommendations
      prompt: preferences.stylePrompt || "",
      query: preferences.stylePrompt || "",
      // Event context for better recommendations
      event_type: preferences.eventType,
      // Optionally pass full preferences for server-side personalization
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
      // Fix the events structure to match Gray Whale's expected format
      events: actions.map((a) => ({
        event: a.action === "like" ? "item_liked" : "item_disliked", // Required: event name
        properties: {
          // Required: event properties for Gray Whale API
          organization_id: this.config!.organizationId, // Required
          visitor_id: this.sessionId, // Use session ID as visitor ID
          id: a.outfitId, // Required: item identifier
          item_id: a.outfitId,
          outfit_id: a.outfitId,
          action: a.action,
          timestamp: a.timestamp,
          session_id: this.sessionId,
          weight: a.action === "like" ? 1.0 : -1.0, // Required: positive for like, negative for dislike
          payload: {
            // Required: additional event data
            event_type: "swipe_feedback",
            source: "mobile_app",
            platform: "react_native",
          },
        },
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
      eventsStructure: body.events.map((event) => ({
        event: event.event,
        propertiesKeys: Object.keys(event.properties),
        properties: event.properties,
      })),
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
    // Temporarily disable A/B project logic - use main project only
    const org = organizationId; // Always use base organization ID
    return `${serverURL}/hackathon/${org}/feed/${this.sessionId}`;
  }

  private mapCardsToRecommendations(
    cards: GrayWhaleCard[],
    preferences: UserPreferences
  ): OutfitRecommendation[] {
    // Enhanced mapping that handles Gray Whale's actual API response structure
    const recs: OutfitRecommendation[] = cards
      .map((card: any, idx: number) => {
        // CORRECT STRUCTURE: Use product.product_url as main outfit image, with smart fallbacks
        let imageUrl = card?.product?.product_url;

        // If product_url is empty, try to use the first image from attributes as fallback
        if (!imageUrl || imageUrl.trim() === "") {
          const imageUrlAttribute = card?.product?.attributes?.find(
            (attr: any) =>
              attr.name === "image_url" || attr.name === "image_urls"
          );
          if (imageUrlAttribute?.value) {
            const firstImage = imageUrlAttribute.value.split(", ")[0]?.trim();
            if (firstImage) {
              imageUrl = firstImage;
              console.log(
                "🖼️ Using first attribute image as main image:",
                firstImage
              );
            }
          }
        }

        // Final fallback to placeholder
        if (!imageUrl || imageUrl.trim() === "") {
          imageUrl =
            "https://via.placeholder.com/300x500/6366f1/FFFFFF?text=Gray+Whale+Rec";
        }

        const title =
          card?.product?.title || card?.title || "Gray Whale Recommendation";
        const description =
          card?.product?.body ||
          card?.product?.summary ||
          card?.description ||
          title;

        // Use score from card or default confidence
        const confidence =
          typeof card?.score === "number"
            ? Math.max(0, Math.min(1, card.score))
            : 0.85; // Higher default confidence for Gray Whale

        const id = String(
          card?.id || card?.product?.sku || `gw_${Date.now()}_${idx}`
        );

        // Extract shopping items from Gray Whale card's product.attributes structure
        const items = this.extractItemsFromCard(card, idx);

        return {
          id,
          items,
          imageUrl,
          eventType: preferences.eventType,
          styleDescription: description,
          confidence,
        } as OutfitRecommendation;
      })
      .filter(Boolean);

    console.log("🎯 FINAL RECOMMENDATIONS DEBUG:", {
      originalCardsCount: cards.length,
      mappedRecsCount: recs.length,
      recommendations: recs.map((rec) => ({
        id: rec.id,
        styleDescription: rec.styleDescription,
        confidence: rec.confidence,
        itemsCount: rec.items.length,
        mainImageUrl: rec.imageUrl,
        items: rec.items.map((item) => ({
          name: item.name,
          category: item.category,
          price: item.price,
          amazonUrl: item.amazonUrl,
          imageUrl: item.imageUrl,
        })),
      })),
    });

    return recs;
  }

  private extractItemsFromCard(card: any, idx: number): any[] {
    // Handle CORRECT Gray Whale API structure with product.attributes containing comma-separated arrays
    const items: any[] = [];

    if (!card?.product?.attributes || !Array.isArray(card.product.attributes)) {
      console.warn("🔍 No product.attributes found in card:", card?.id);
      return this.createFallbackItem(card, idx);
    }

    // Extract comma-separated image URLs and external URLs from product.attributes
    // Handle both singular and plural attribute names
    const imageUrlAttribute = card.product.attributes.find(
      (attr: any) => attr.name === "image_url" || attr.name === "image_urls"
    );
    const externalUrlAttribute = card.product.attributes.find(
      (attr: any) =>
        attr.name === "external_url" || attr.name === "external_urls"
    );
    const typeAttribute = card.product.attributes.find(
      (attr: any) => attr.name === "type"
    );
    const styleAttribute = card.product.attributes.find(
      (attr: any) => attr.name === "style"
    );
    const colorAttribute = card.product.attributes.find(
      (attr: any) => attr.name === "color"
    );

    // Parse comma-separated arrays
    const imageUrls = imageUrlAttribute?.value
      ? imageUrlAttribute.value.split(", ").map((url: string) => url.trim())
      : [];
    const externalUrls = externalUrlAttribute?.value
      ? externalUrlAttribute.value.split(", ").map((url: string) => url.trim())
      : [];
    const types = typeAttribute?.value
      ? typeAttribute.value.split(", ").map((type: string) => type.trim())
      : [];
    const styles = styleAttribute?.value
      ? styleAttribute.value.split(", ").map((style: string) => style.trim())
      : [];
    const colors = colorAttribute?.value
      ? colorAttribute.value.split(", ").map((color: string) => color.trim())
      : ["Multi"];

    console.log("🔍 PARSING PRODUCT ATTRIBUTES:", {
      cardId: card?.id,
      productTitle: card?.product?.title,
      imageUrlsCount: imageUrls.length,
      externalUrlsCount: externalUrls.length,
      typesCount: types.length,
      imageUrls: imageUrls,
      externalUrls: externalUrls,
      types: types,
      styles: styles,
      colors: colors,
    });

    // Create items by matching arrays (assume they're in same order)
    const maxItems = Math.max(
      imageUrls.length,
      externalUrls.length,
      types.length
    );

    for (let i = 0; i < maxItems; i++) {
      const itemType = types[i] || `Item ${i + 1}`;
      const itemStyle = styles[i] || "";
      const itemImageUrl =
        imageUrls[i] ||
        `https://via.placeholder.com/300x400/6366f1/FFFFFF?text=${encodeURIComponent(
          itemType
        )}`;
      const itemExternalUrl = externalUrls[i] || "#";

      items.push({
        id: `${card.id}_item_${i}`,
        name: this.generateItemName(itemType, itemStyle, card.product.title),
        brand: this.extractBrandFromTitle(card.product.title) || "Gray Whale",
        price: 0, // No price data available - will show "See Amazon for price"
        imageUrl: itemImageUrl,
        amazonUrl: itemExternalUrl,
        category: this.mapTypeToCategory(itemType),
        colors: colors,
        sizes: this.getDefaultSizes(itemType),
      });
    }

    console.log("🔍 EXTRACTED ITEMS:", {
      cardId: card?.id,
      itemsCreated: items.length,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        amazonUrl: item.amazonUrl,
        imageUrl: item.imageUrl,
      })),
    });

    // If no items were created, create a fallback
    if (items.length === 0) {
      return this.createFallbackItem(card, idx);
    }

    return items;
  }

  private createFallbackItem(card: any, idx: number): any[] {
    // Smart image selection for fallback items too
    let fallbackImageUrl = card?.product?.product_url;

    if (!fallbackImageUrl || fallbackImageUrl.trim() === "") {
      const imageUrlAttribute = card?.product?.attributes?.find(
        (attr: any) => attr.name === "image_url" || attr.name === "image_urls"
      );
      if (imageUrlAttribute?.value) {
        const firstImage = imageUrlAttribute.value.split(", ")[0]?.trim();
        if (firstImage) {
          fallbackImageUrl = firstImage;
        }
      }
    }

    if (!fallbackImageUrl || fallbackImageUrl.trim() === "") {
      fallbackImageUrl =
        "https://via.placeholder.com/300x400/6366f1/FFFFFF?text=Complete+Outfit";
    }

    return [
      {
        id: `gw_outfit_${idx}`,
        name:
          card?.product?.title || card?.title || "Complete Gray Whale Outfit",
        brand: "Gray Whale",
        price: 149.99,
        imageUrl: fallbackImageUrl,
        amazonUrl: "#", // No direct purchase link for complete outfits
        category: "top" as const,
        colors: ["Multi"],
        sizes: ["M", "L"],
      },
    ];
  }

  private generateItemName(
    type: string,
    style: string,
    outfitTitle: string
  ): string {
    // Create descriptive names based on type and style
    const typeNames: Record<string, string> = {
      pants: "Pants",
      Pants: "Pants",
      kurta: "Kurta",
      Kurta: "Kurta",
      "Kurta Set": "Kurta Set",
      "kurta set": "Kurta Set",
      shoes: "Shoes",
      Shoes: "Shoes",
      Loafers: "Loafers",
      loafers: "Loafers",
      Mule: "Mules",
      mule: "Mules",
      Mules: "Mules",
      Sherwani: "Sherwani",
      sherwani: "Sherwani",
      Mojari: "Mojari Shoes",
      mojari: "Mojari Shoes",
    };

    const baseName =
      typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);

    if (style) {
      return `${style} ${baseName}`;
    }

    return baseName;
  }

  private getItemNameFromType(type: string, outfitTitle: string): string {
    const typeNames: Record<string, string> = {
      black_pant: "Black Pants",
      pajama: "Kurta Pajama Set",
      shoes: "Traditional Shoes",
      kurta: "Silk Kurta",
      pant: "Pants",
      shirt: "Shirt",
      dress: "Dress",
      jacket: "Jacket",
    };
    return (
      typeNames[type] ||
      `${type.charAt(0).toUpperCase() + type.slice(1)} from ${outfitTitle}`
    );
  }

  private mapTypeToCategory(
    type: string
  ): "top" | "bottom" | "shoes" | "accessories" {
    const lower = type.toLowerCase();
    if (
      lower.includes("pant") ||
      lower.includes("pajama") ||
      lower.includes("trouser")
    )
      return "bottom";
    if (
      lower.includes("shoe") ||
      lower.includes("boot") ||
      lower.includes("sandal") ||
      lower.includes("loafer") ||
      lower.includes("mule") ||
      lower.includes("mojari") ||
      lower.includes("jutti")
    )
      return "shoes";
    if (
      lower.includes("kurta") ||
      lower.includes("shirt") ||
      lower.includes("dress") ||
      lower.includes("jacket") ||
      lower.includes("blazer") ||
      lower.includes("sherwani")
    )
      return "top";
    return "accessories";
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
