import { createAIProviderConfigs, isProviderAvailable, loadEnvironmentConfig } from '@theagent/core/dist/config/environment';
import { AIConfig } from '@theagent/core/dist/types';

/**
 * Configuration service for handling environment and AI configuration
 */
export class ConfigService {
    private envConfig: ReturnType<typeof loadEnvironmentConfig>;

    constructor() {
        this.envConfig = loadEnvironmentConfig();
    }

    /**
     * Get environment configuration
     */
    getEnvironmentConfig() {
        return this.envConfig;
    }

    /**
     * Get AI configuration from environment
     */
    getAIConfig(): AIConfig | undefined {
        console.log('🔍 Checking AI configuration...');
        console.log('Environment config:', {
            defaultProvider: this.envConfig.defaultProvider,
            ollamaBaseUrl: this.envConfig.ollama.baseUrl,
            ollamaModel: this.envConfig.ollama.model
        });

        // Check if the default provider is available
        if (!isProviderAvailable(this.envConfig.defaultProvider, this.envConfig)) {
            console.log('❌ Default AI provider not available:', this.envConfig.defaultProvider);
            return undefined;
        }

        // Create provider configs
        const providerConfigs = createAIProviderConfigs(this.envConfig);
        const defaultProviderConfig = providerConfigs[this.envConfig.defaultProvider];

        if (!defaultProviderConfig) {
            console.log('❌ No configuration found for default provider:', this.envConfig.defaultProvider);
            return undefined;
        }

        console.log('✅ AI configuration loaded successfully:', {
            provider: this.envConfig.defaultProvider,
            model: defaultProviderConfig.model,
            baseUrl: defaultProviderConfig.baseUrl
        });

        return {
            provider: 'ollama',
            ...defaultProviderConfig
        };
    }
}

// Singleton instance
export const configService = new ConfigService();
