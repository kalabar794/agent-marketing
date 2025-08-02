import { ContentGenerationRequest } from '@/types/content';
import { config } from '@/lib/config';

export abstract class BaseAgent {
  protected agentName: string;
  protected maxRetries: number = 3;
  protected timeout: number = 30000; // 30 seconds

  constructor(agentName: string) {
    this.agentName = agentName;
  }

  public abstract execute(request: ContentGenerationRequest, context: any): Promise<any>;

  protected async callLLM(prompt: string, options?: { 
    model?: string; 
    maxTokens?: number; 
    temperature?: number; 
  }): Promise<string> {
    const {
      model = 'claude-3-5-sonnet-20241022',
      maxTokens = 4000,
      temperature = 0.7
    } = options || {};

    const requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text;
        } else {
          throw new Error('Invalid response format from Claude API');
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${this.timeout}ms`);
        }

        console.warn(`${this.agentName} LLM call attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`${this.agentName} failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  protected async callLLMWithFallback(prompt: string, fallbackResponse: any): Promise<string> {
    try {
      return await this.callLLM(prompt);
    } catch (error) {
      console.error(`${this.agentName} LLM call failed, using fallback:`, error);
      return JSON.stringify(fallbackResponse);
    }
  }

  protected extractJSONFromResponse(response: string): any {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try parsing the entire response
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to extract JSON from response: ${error}`);
    }
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  protected sanitizeOutput(data: any): any {
    // Remove any potentially harmful content
    if (typeof data === 'string') {
      return data.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeOutput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeOutput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const testPrompt = `Respond with exactly this JSON: {"status": "healthy", "agent": "${this.agentName}"}`;
      const response = await this.callLLM(testPrompt, { maxTokens: 100, temperature: 0 });
      const parsed = this.extractJSONFromResponse(response);
      return parsed.status === 'healthy' && parsed.agent === this.agentName;
    } catch (error) {
      console.error(`Health check failed for ${this.agentName}:`, error);
      return false;
    }
  }

  protected logExecution(stage: string, data?: any): void {
    console.log(`[${this.agentName}] ${stage}`, data ? JSON.stringify(data, null, 2) : '');
  }

  protected getExecutionTimestamp(): string {
    return new Date().toISOString();
  }
}