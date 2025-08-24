import { VisionCapabilities } from '../../engine/ai-engine';

/**
 * OpenAI Model Utilities
 * Contains model-specific configurations and capabilities
 */
export class OpenAIModelUtils {
  /**
   * Map of OpenAI models and their vision capabilities
   */
  private static readonly MODEL_VISION_CAPABILITIES: Record<string, VisionCapabilities> = {
    // GPT-4 Vision models
    'gpt-4-vision-preview': {
      supportsImages: true,
      supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      maxImageSize: 20 * 1024 * 1024 // 20MB
    },
    'gpt-4o': {
      supportsImages: true,
      supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      maxImageSize: 20 * 1024 * 1024 // 20MB
    },
    'gpt-4o-mini': {
      supportsImages: true,
      supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      maxImageSize: 20 * 1024 * 1024 // 20MB
    },

    // Text-only models
    'gpt-4': {
      supportsImages: false,
      supportedFormats: []
    },
    'gpt-4-turbo': {
      supportsImages: false,
      supportedFormats: []
    },
    'gpt-3.5-turbo': {
      supportsImages: false,
      supportedFormats: []
    },
    'gpt-3.5-turbo-16k': {
      supportsImages: false,
      supportedFormats: []
    }
  };

  /**
   * Default vision capabilities for unknown models
   */
  private static readonly DEFAULT_VISION_CAPABILITIES: VisionCapabilities = {
    supportsImages: false,
    supportedFormats: []
  };

  /**
   * Get vision capabilities for a specific model
   */
  static getVisionCapabilities(model: string): VisionCapabilities {
    return this.MODEL_VISION_CAPABILITIES[model] || this.DEFAULT_VISION_CAPABILITIES;
  }

  /**
   * Check if a model supports vision
   */
  static supportsVision(model: string): boolean {
    return this.getVisionCapabilities(model).supportsImages;
  }

  /**
   * Get recommended models for different use cases
   */
  static getRecommendedModels() {
    return {
      textGeneration: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      visionAnalysis: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-vision-preview'],
      fastResponses: ['gpt-4o-mini', 'gpt-3.5-turbo'],
      complexReasoning: ['gpt-4o', 'gpt-4-turbo', 'gpt-4']
    };
  }

  /**
   * Convert images to base64 data URLs for OpenAI API
   */
  static convertImagesToBase64(images: Buffer[]): string[] {
    return images.map(imageBuffer => {
      // Detect image format (basic detection)
      const format = this.detectImageFormat(imageBuffer);
      const base64 = imageBuffer.toString('base64');
      return `data:image/${format};base64,${base64}`;
    });
  }

  /**
   * Basic image format detection
   */
  private static detectImageFormat(buffer: Buffer): string {
    // Check magic bytes for common formats
    if (buffer.length < 4) return 'png'; // Default fallback

    const header = buffer.subarray(0, 4);

    // PNG: 89 50 4E 47
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return 'png';
    }

    // JPEG: FF D8 FF
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      return 'jpeg';
    }

    // GIF: 47 49 46 38
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
      return 'gif';
    }

    // WebP: Check for RIFF and WEBP
    if (buffer.length >= 12) {
      const riff = buffer.subarray(0, 4);
      const webp = buffer.subarray(8, 12);
      if (riff.toString() === 'RIFF' && webp.toString() === 'WEBP') {
        return 'webp';
      }
    }

    return 'png'; // Default fallback
  }

  /**
   * Validate image size and format
   */
  static validateImage(buffer: Buffer, model: string): { valid: boolean; error?: string } {
    const capabilities = this.getVisionCapabilities(model);

    if (!capabilities.supportsImages) {
      return { valid: false, error: `Model ${model} does not support images` };
    }

    if (capabilities.maxImageSize && buffer.length > capabilities.maxImageSize) {
      return {
        valid: false,
        error: `Image size (${buffer.length} bytes) exceeds maximum allowed (${capabilities.maxImageSize} bytes)`
      };
    }

    const format = this.detectImageFormat(buffer);
    if (!capabilities.supportedFormats.includes(format)) {
      return {
        valid: false,
        error: `Image format ${format} is not supported. Supported formats: ${capabilities.supportedFormats.join(', ')}`
      };
    }

    return { valid: true };
  }
}
