/**
 * Utility functions for Ollama model operations
 */
export class OllamaModelUtils {
  /**
   * Check if a model supports vision capabilities (llava models)
   */
  static isVisionModel(modelName: string): boolean {
    return modelName.toLowerCase().includes('llava');
  }

  /**
   * Check if a specific model is available in the provided model list
   */
  static isModelAvailable(modelName: string, availableModels: string[]): boolean {
    return availableModels.some(model => model.includes(modelName));
  }

  /**
   * Get vision capabilities for a model
   */
  static getVisionCapabilities(modelName: string) {
    const isVision = this.isVisionModel(modelName);
    return {
      supportsImages: isVision,
      supportedFormats: isVision ? ['png', 'jpeg', 'jpg', 'webp'] : [],
      maxImageSize: isVision ? 20 * 1024 * 1024 : undefined // 20MB
    };
  }

  /**
   * Convert images to base64 strings for Ollama API
   */
  static convertImagesToBase64(images: Buffer[]): string[] {
    return images.map(img => img.toString('base64'));
  }

  /**
   * Validate model name format
   */
  static isValidModelName(modelName: string): boolean {
    // Basic validation - should be more comprehensive based on Ollama's naming rules
    return typeof modelName === 'string' && modelName.length > 0 && !modelName.includes(' ');
  }

  /**
   * Extract model name from full model string (e.g., "llama3.2:8b" -> "llama3.2")
   */
  static extractBaseModelName(fullModelName: string): string {
    return fullModelName.split(':')[0];
  }

  /**
   * Extract model tag from full model string (e.g., "llama3.2:8b" -> "8b")
   */
  static extractModelTag(fullModelName: string): string | undefined {
    const parts = fullModelName.split(':');
    return parts.length > 1 ? parts[1] : undefined;
  }
}
