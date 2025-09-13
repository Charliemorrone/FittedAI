import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTO_STORAGE_KEY = "@FittedAI:referencePhoto";

export class PhotoStorageService {
  /**
   * Save a reference photo URI to local storage
   */
  static async saveReferencePhoto(uri: string): Promise<void> {
    console.log("💾 PhotoStorageService: Saving photo with URI:", uri);
    try {
      await AsyncStorage.setItem(PHOTO_STORAGE_KEY, uri);
      console.log(
        "✅ PhotoStorageService: Photo saved successfully to AsyncStorage"
      );
    } catch (error) {
      console.error(
        "💥 PhotoStorageService: Error saving reference photo:",
        error
      );
      throw new Error("Failed to save photo");
    }
  }

  /**
   * Get the saved reference photo URI from local storage
   */
  static async getReferencePhoto(): Promise<string | null> {
    console.log("🔍 PhotoStorageService: Retrieving photo from storage...");
    try {
      const uri = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
      console.log("🔍 PhotoStorageService: Retrieved URI:", uri);
      return uri;
    } catch (error) {
      console.error(
        "💥 PhotoStorageService: Error retrieving reference photo:",
        error
      );
      return null;
    }
  }

  /**
   * Clear the saved reference photo from local storage
   */
  static async clearReferencePhoto(): Promise<void> {
    console.log("🗑️ PhotoStorageService: Clearing photo from storage...");
    try {
      await AsyncStorage.removeItem(PHOTO_STORAGE_KEY);
      console.log(
        "✅ PhotoStorageService: Photo cleared successfully from AsyncStorage"
      );
    } catch (error) {
      console.error(
        "💥 PhotoStorageService: Error clearing reference photo:",
        error
      );
      throw new Error("Failed to clear photo");
    }
  }

  /**
   * Check if a reference photo exists in storage
   */
  static async hasReferencePhoto(): Promise<boolean> {
    try {
      const uri = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
      return uri !== null;
    } catch (error) {
      console.error("Error checking for reference photo:", error);
      return false;
    }
  }
}
