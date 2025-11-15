import { AIConfig } from '@theagent/core/dist/types';
import { createAIProviderConfigs, isProviderAvailable, loadEnvironmentConfig } from '@theagent/core/src/environment';
import { loadObservabilityConfig } from '@theagent/core/src/observability/config-loader';

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
     * @param requestedProvider - The AI provider to use
     * @param sessionName - Optional unique session name for observability tracing
     */
    getAIConfig(requestedProvider?: string, sessionName?: string): AIConfig | undefined {
        const provider = requestedProvider || this.envConfig.defaultProvider;

        console.log('🔍 Checking AI configuration...');
        console.log('Environment config:', {
            requestedProvider,
            defaultProvider: this.envConfig.defaultProvider,
            finalProvider: provider,
            ollamaBaseUrl: this.envConfig.ollama.baseUrl,
            ollamaModel: this.envConfig.ollama.model,
            openaiModel: this.envConfig.openai.model,
            openaiApiKey: this.envConfig.openai.apiKey ? '✅ Set' : '❌ Not set',
            sessionName: sessionName || 'default'
        });

        // Check if the requested provider is available
        if (!isProviderAvailable(provider, this.envConfig)) {
            console.log('❌ Requested AI provider not available:', provider);
            return undefined;
        }

        // Create provider configs
        const providerConfigs = createAIProviderConfigs(this.envConfig);
        const providerConfig = providerConfigs[provider];

        if (!providerConfig) {
            console.log('❌ No configuration found for provider:', provider);
            return undefined;
        }

        console.log('✅ AI configuration loaded successfully:', {
            provider: provider,
            model: providerConfig.model,
            baseUrl: providerConfig.baseUrl,
            apiKey: providerConfig.apiKey ? '✅ Set' : '❌ Not set'
        });

        // Build base AI config
        const aiConfig: AIConfig = {
            ...providerConfig,
            provider: provider // Make sure we include the provider name
        };

        // Load observability config and add unique sessionName if provided
        const observabilityConfig = loadObservabilityConfig();
        if (observabilityConfig?.enabled) {
            aiConfig.observability = {
                ...observabilityConfig,
                langfuse: {
                    ...observabilityConfig.langfuse,
                    // Override sessionName with unique identifier if provided
                    sessionName: sessionName || observabilityConfig.langfuse?.sessionName
                }
            };
            
            console.log('✅ Observability enabled with session:', sessionName || 'default');
        }

        return aiConfig;
    }
}

// Create and export a singleton instance
export const configService = new ConfigService();
