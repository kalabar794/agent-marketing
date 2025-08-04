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
  // Require API key - no demo mode
  if (!apiKey || apiKey.trim() === '') {
    throw new ConfigError('ANTHROPIC_API_KEY is required. Please add your Anthropic API key to .env.local');
  }

  // Validate Anthropic key format
  if (!apiKey.startsWith('sk-ant-')) {
    throw new ConfigError('Invalid ANTHROPIC_API_KEY format. Expected key starting with "sk-ant-"');
  }

  if (apiKey.length < 50) {
    throw new ConfigError('ANTHROPIC_API_KEY appears to be too short. Please check your API key.');
  }

  console.log('✅ ANTHROPIC_API_KEY validated successfully');
  return apiKey;
}

function createConfig(): Config {
  // During build time, allow missing API key
  const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.ANTHROPIC_API_KEY;
  
  if (isBuildTime) {
    console.log('🏗️ Build time detected - deferring API key validation to runtime');
    return {
      anthropicApiKey: '', // Empty string during build
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

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

// Export a function to validate config at runtime
export function validateConfigAtRuntime(): void {
  if (!config.anthropicApiKey) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ConfigError('ANTHROPIC_API_KEY is required at runtime');
    }
    // Update the config with runtime value
    (config as any).anthropicApiKey = validateApiKey(apiKey);
  }
}

export { ConfigError };