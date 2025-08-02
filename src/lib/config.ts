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
  if (!apiKey) {
    throw new ConfigError(
      'ANTHROPIC_API_KEY is required. Please add your Claude API key to .env.local'
    );
  }

  if (!apiKey.startsWith('sk-ant-api03-')) {
    throw new ConfigError(
      'Invalid ANTHROPIC_API_KEY format. Expected format: sk-ant-api03-...'
    );
  }

  if (apiKey.length < 50) {
    throw new ConfigError(
      'ANTHROPIC_API_KEY appears to be incomplete. Please check your API key.'
    );
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