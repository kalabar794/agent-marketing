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
  // During build time (Next.js build phase), defer API key validation
  // Check for Next.js build phase or missing API key in production
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isBuildTime = isNextBuildPhase || (process.env.NODE_ENV === 'production' && !process.env.ANTHROPIC_API_KEY);
  
  if (isBuildTime) {
    console.log('🏗️ Build phase detected - deferring API key validation to runtime');
    return {
      anthropicApiKey: '', // Empty string during build
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

  // During development or when API key is available, validate it
  if (process.env.NODE_ENV === 'development' && process.env.ANTHROPIC_API_KEY) {
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

  // Default: defer validation
  console.log('🏗️ Deferring API key validation to runtime');
  return {
    anthropicApiKey: '', // Empty string, will be validated at runtime
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

// Export the configuration
export const config = createConfig();

// Export a function to validate config at runtime
export function validateConfigAtRuntime(): void {
  if (!config.anthropicApiKey) {
    // Try multiple approaches to get the API key in different serverless contexts
    let apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Netlify Functions environment variable access strategies
    if (!apiKey) {
      // Strategy 1: Try different variable names that might be used
      const possibleNames = [
        'ANTHROPIC_API_KEY',
        'anthropic_api_key', 
        'CLAUDE_API_KEY',
        'claude_api_key'
      ];
      
      for (const name of possibleNames) {
        if (process.env[name]) {
          apiKey = process.env[name];
          console.log(`✅ Found API key under name: ${name}`);
          break;
        }
      }
    }
    
    // Strategy 2: Search through all environment variables for any that might be the API key
    if (!apiKey) {
      const envKeys = Object.keys(process.env);
      for (const key of envKeys) {
        const value = process.env[key];
        if (value && value.startsWith('sk-ant-') && value.length > 50) {
          apiKey = value;
          console.log(`✅ Found API key by pattern matching: ${key}`);
          break;
        }
      }
    }
    
    // Strategy 3: For development/local, allow override from a local config
    if (!apiKey && process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode - API key must be in environment variables');
    }
    
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
      console.log('Available env vars (filtered):', Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('anthropic') || 
        key.toLowerCase().includes('claude') ||
        key.toLowerCase().includes('api')
      ));
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('Total env vars:', Object.keys(process.env).length);
      
      // Show first few chars of any sk- prefixed variables for debugging
      const skKeys = Object.keys(process.env).filter(key => {
        const val = process.env[key];
        return val && val.startsWith && val.startsWith('sk-');
      });
      console.log('Keys with sk- values:', skKeys);
      
      throw new ConfigError('ANTHROPIC_API_KEY is required at runtime - check Netlify environment variables');
    }
    
    try {
      // Update the config with runtime value
      (config as any).anthropicApiKey = validateApiKey(apiKey);
      console.log('✅ API key validated successfully at runtime');
    } catch (error) {
      console.error('❌ API key validation failed:', error);
      throw error;
    }
  }
}

export { ConfigError };