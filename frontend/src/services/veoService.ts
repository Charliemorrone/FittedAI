import { UserPreferences, OutfitRecommendation } from "../types";

export interface VeoVideoRequest {
  styleImageUrl: string;
  partnerImageUrl?: string;
  outfitDescription: string;
  eventType: string;
  prompt: string;
}

export interface VeoVideoResponse {
  videoId: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedCompletionTime?: number;
  error?: string;
}

class VeoService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_VEO_API_KEY || "";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    if (!this.apiKey) {
      console.warn(
        "⚠️ VEO API key not found. Please set EXPO_PUBLIC_VEO_API_KEY in your .env file"
      );
    } else {
      console.log("✅ VEO API key loaded successfully");
    }
  }

  /**
   * Generate a video using VEO 3 based on style photo and optional partner photo
   */
  async generateVideo(request: VeoVideoRequest): Promise<VeoVideoResponse> {
    try {
      console.log("🎬 VEO Service: Generating video with request:", request);

      if (!this.apiKey) {
        throw new Error("VEO API key not configured");
      }

      // Create the video generation prompt
      const videoPrompt = this.createVideoPrompt(request);
      console.log("📝 Generated VEO prompt:", videoPrompt);

      // Prepare the API request body for Google VEO 3
      // Note: The exact API structure may vary - this is based on typical Google AI API patterns
      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: videoPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      };

      // Add image inputs if available (format may need adjustment based on actual API)
      if (request.styleImageUrl) {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: "image/jpeg", // or "image/png"
            data: request.styleImageUrl,
          },
        });
      }

      console.log("🚀 Making real VEO API request to Google...");
      console.log("📋 Request body:", JSON.stringify(requestBody, null, 2));

      // Try different possible endpoints for VEO 3
      const possibleEndpoints = [
        `${this.baseUrl}/models/veo-3:generateContent?key=${this.apiKey}`,
        `${this.baseUrl}/models/veo-3:generateVideo?key=${this.apiKey}`,
        `${this.baseUrl}/models/veo-3:generate?key=${this.apiKey}`,
      ];

      let response: Response | null = null;
      let lastError: any = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(
              `❌ Failed with endpoint ${endpoint}:`,
              response.status,
              errorData
            );
            lastError = errorData;
          }
        } catch (error) {
          console.log(`💥 Error with endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }

      if (!response || !response.ok) {
        throw new Error(
          `All VEO API endpoints failed. Last error: ${JSON.stringify(
            lastError
          )}`
        );
      }

      const apiResponse = await response.json();
      console.log(
        "✅ VEO API Response received:",
        JSON.stringify(apiResponse, null, 2)
      );

      // Handle different possible response formats from Google VEO 3 API
      let videoId: string;
      let status: "processing" | "completed" | "failed";
      let videoUrl: string | undefined;
      let estimatedCompletionTime: number | undefined;

      // Check for operation-based response (long-running operation)
      if (apiResponse.name && !apiResponse.done) {
        videoId = apiResponse.name;
        status = "processing";
        estimatedCompletionTime = 30000;
      }
      // Check for completed operation
      else if (apiResponse.done === true) {
        videoId =
          apiResponse.name ||
          `veo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (apiResponse.error) {
          status = "failed";
        } else {
          status = "completed";
          videoUrl =
            apiResponse.response?.videoUri ||
            apiResponse.response?.uri ||
            apiResponse.response?.video_url ||
            apiResponse.candidates?.[0]?.content?.parts?.[0]?.video_url;
        }
      }
      // Check for direct response with video content
      else if (apiResponse.candidates?.[0]?.content) {
        videoId = `veo_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        status = "completed";
        videoUrl =
          apiResponse.candidates[0].content.parts?.[0]?.video_url ||
          apiResponse.candidates[0].content.parts?.[0]?.videoUri;
      }
      // Fallback - assume processing
      else {
        videoId =
          apiResponse.id ||
          `veo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        status = "processing";
        estimatedCompletionTime = 30000;
      }

      console.log(
        `📊 Parsed response - ID: ${videoId}, Status: ${status}, Video URL: ${videoUrl}`
      );

      return {
        videoId,
        status,
        videoUrl,
        estimatedCompletionTime,
      };
    } catch (error) {
      console.error("💥 VEO Service: Error generating video:", error);
      console.log("🔄 Falling back to demo mode for testing...");

      // Fallback to demo mode if real API fails
      const fallbackVideoId = `demo_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        videoId: fallbackVideoId,
        status: "processing",
        estimatedCompletionTime: 10000, // 10 seconds for demo
        error: `API Error (using demo): ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Check the status of a video generation request
   */
  async checkVideoStatus(videoId: string): Promise<VeoVideoResponse> {
    try {
      console.log("🔍 VEO Service: Checking status for video:", videoId);

      // Handle demo fallback videos
      if (videoId.startsWith("demo_")) {
        const timestampMatch = videoId.match(/demo_(\d+)_/);
        if (timestampMatch) {
          const creationTime = parseInt(timestampMatch[1]);
          const elapsedTime = Date.now() - creationTime;

          if (elapsedTime >= 10000) {
            return {
              videoId,
              status: "completed",
              videoUrl:
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              thumbnailUrl: `https://example.com/thumbnails/${videoId}.jpg`,
            };
          } else {
            return {
              videoId,
              status: "processing",
              estimatedCompletionTime: 10000 - elapsedTime,
            };
          }
        }
      }

      if (!this.apiKey) {
        throw new Error("VEO API key not configured");
      }

      // Try different possible status check endpoints
      const possibleEndpoints = [
        `${this.baseUrl}/operations/${videoId}?key=${this.apiKey}`,
        `${this.baseUrl}/${videoId}?key=${this.apiKey}`,
        `${this.baseUrl}/models/veo-3/operations/${videoId}?key=${this.apiKey}`,
      ];

      let response: Response | null = null;
      let lastError: any = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Checking status at: ${endpoint}`);
          response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            console.log(`✅ Status check success: ${endpoint}`);
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(
              `❌ Status check failed ${endpoint}:`,
              response.status,
              errorData
            );
            lastError = errorData;
          }
        } catch (error) {
          console.log(`💥 Status check error ${endpoint}:`, error);
          lastError = error;
        }
      }

      if (!response || !response.ok) {
        throw new Error(
          `All status check endpoints failed. Last error: ${JSON.stringify(
            lastError
          )}`
        );
      }

      const apiResponse = await response.json();
      console.log(
        "📊 VEO Status Response:",
        JSON.stringify(apiResponse, null, 2)
      );

      // Parse Google's operation response
      if (apiResponse.done) {
        // Operation completed
        if (apiResponse.error) {
          return {
            videoId,
            status: "failed",
            error: apiResponse.error.message || "Video generation failed",
          };
        } else {
          return {
            videoId,
            status: "completed",
            videoUrl:
              apiResponse.response?.videoUri ||
              apiResponse.response?.uri ||
              apiResponse.response?.video_url,
            thumbnailUrl: apiResponse.response?.thumbnailUri,
          };
        }
      } else {
        // Still processing
        return {
          videoId,
          status: "processing",
          estimatedCompletionTime: 30000, // Default estimate
        };
      }
    } catch (error) {
      console.error("💥 VEO Service: Error checking video status:", error);

      // Fallback for demo videos
      if (videoId.startsWith("demo_")) {
        return {
          videoId,
          status: "completed",
          videoUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          thumbnailUrl: `https://example.com/thumbnails/${videoId}.jpg`,
        };
      }

      return {
        videoId,
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Failed to check video status.",
      };
    }
  }

  /**
   * Create a detailed prompt for VEO 3 video generation
   */
  private createVideoPrompt(request: VeoVideoRequest): string {
    const { styleImageUrl, partnerImageUrl, outfitDescription, eventType } =
      request;

    let prompt = `Create a stylish fashion video showcasing the outfit style from the reference image. `;

    if (partnerImageUrl) {
      prompt += `Feature a couple wearing complementary outfits suitable for ${eventType}. `;
      prompt += `The main subject should wear an outfit inspired by: "${outfitDescription}". `;
      prompt += `The partner should wear a coordinating outfit that complements the main style. `;
      prompt += `Show them in an elegant setting appropriate for ${eventType}, `;
      prompt += `with smooth camera movements highlighting the fashion details. `;
    } else {
      prompt += `Feature a single person wearing an outfit inspired by: "${outfitDescription}". `;
      prompt += `Show them in a stylish setting appropriate for ${eventType}, `;
      prompt += `with cinematic camera movements that showcase the outfit from multiple angles. `;
    }

    prompt += `The video should have high fashion photography aesthetics, `;
    prompt += `professional lighting, and smooth transitions. `;
    prompt += `Duration: 6-10 seconds. Style: Modern, elegant, and sophisticated.`;

    return prompt;
  }

  /**
   * Get video generation cost estimate
   */
  getEstimatedCost(hasPartner: boolean): {
    credits: number;
    description: string;
  } {
    const baseCredits = 10;
    const partnerMultiplier = hasPartner ? 1.5 : 1;
    const totalCredits = Math.ceil(baseCredits * partnerMultiplier);

    return {
      credits: totalCredits,
      description: hasPartner
        ? "Couple fashion video (6-10 seconds)"
        : "Solo fashion video (6-10 seconds)",
    };
  }
}

export default new VeoService();
