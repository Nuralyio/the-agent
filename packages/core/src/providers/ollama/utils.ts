export class OllamaModelUtils {
  static isVisionModel(modelName: string): boolean {
    return modelName.toLowerCase().includes('llava');
  }

  static isModelAvailable(modelName: string, availableModels: string[]): boolean {
    return availableModels.some(model => model.includes(modelName));
  }

  static getVisionCapabilities(modelName: string) {
    const isVision = this.isVisionModel(modelName);
    return {
      supportsImages: isVision,
      supportedFormats: isVision ? ['png', 'jpeg', 'jpg', 'webp'] : [],
      maxImageSize: isVision ? 20 * 1024 * 1024 : undefined
    };
  }

  static convertImagesToBase64(images: Buffer[]): string[] {
    return images.map(img => img.toString('base64'));
  }

  static isValidModelName(modelName: string): boolean {
    return typeof modelName === 'string' && modelName.length > 0 && !modelName.includes(' ');
  }

  static extractBaseModelName(fullModelName: string): string {
    return fullModelName.split(':')[0];
  }

  static extractModelTag(fullModelName: string): string | undefined {
    const parts = fullModelName.split(':');
    return parts.length > 1 ? parts[1] : undefined;
  }
}
