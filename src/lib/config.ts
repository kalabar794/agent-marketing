/**
 * Application configuration and environment validation
 */

interface Config {
  anthropicApiKey: string;
  nextPublicAppUrl: string;
  nodeEnv: string;
}

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function validateApiKey(apiKey: string | undefined): string {
  // Allow missing API key - will use demo mode
  if (!apiKey) {
    console.log('🎭 ANTHROPIC_API_KEY not found - will use demo mode');
    return '';
  }

  // Relax validation - accept various Anthropic key formats
  if (!apiKey.startsWith('sk-ant-')) {
    console.log('🎭 Unexpected API key format - will attempt to use but may fail');
    // Don't throw error, let API call fail naturally if invalid
  }

  if (apiKey.length < 30) {
    console.log('🎭 API key appears short - will attempt to use but may fail');
    // Don't throw error, let API call fail naturally if invalid
  }

  return apiKey;
}

function createConfig(): Config {
  try {
    return {
      anthropicApiKey: validateApiKey(process.env.ANTHROPIC_API_KEY),
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error('❌ Configuration Error:', error.message);
      console.error('💡 Setup Instructions:');
      console.error('   1. Copy .env.example to .env.local');
      console.error('   2. Add your Anthropic API key from https://console.anthropic.com/');
      console.error('   3. Restart the development server');
      throw error;
    }
    throw error;
  }
}

// Export the configuration
export const config = createConfig();
export { ConfigError };