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

    const response = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    const payloadText = await response.text();
    if (!payloadText) return [];
    const payload = JSON.parse(payloadText);
    const cards: GrayWhaleCard[] = payload?.cards || [];
    return this.mapCardsToRecommendations(cards, preferences);
  }

  public async sendFeedback(
    actions: Array<{
      outfitId: string;
      action: "like" | "dislike";
      timestamp: number;
    }>
  ): Promise<void> {
    if (!this.config) return;
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
    try {
      await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      });
    } catch (e) {
      // Non-fatal for UX; log and continue
      console.warn("GrayWhale feedback send failed", e);
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
    // Best-effort mapping since card schema may vary by deployment.
    // We try common fields for image and title.
    const recs: OutfitRecommendation[] = cards
      .map((card: any, idx: number) => {
        const imageUrl =
          card?.imageUrl ||
          card?.image_url ||
          card?.image ||
          card?.thumbnail ||
          "https://via.placeholder.com/300x500/6366f1/FFFFFF?text=Recommendation";
        const title =
          card?.title || card?.name || card?.heading || "Recommended Look";
        const confidence =
          typeof card?.score === "number"
            ? Math.max(0, Math.min(1, card.score))
            : 0.8;
        const id = String(
          card?.id || card?.sku || card?.asin || `gw_${Date.now()}_${idx}`
        );
        return {
          id,
          items: [],
          imageUrl,
          eventType: preferences.eventType,
          styleDescription: title,
          confidence,
        } as OutfitRecommendation;
      })
      .filter(Boolean);
    return recs;
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
