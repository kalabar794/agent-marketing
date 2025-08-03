import { ContentGenerationRequest } from '@/types/content';
import { config } from '@/lib/config';

export abstract class BaseAgent {
  protected agentName: string;
  protected maxRetries: number = 3;
  protected timeout: number = 120000; // 2 minutes timeout (Background functions have 15 minutes total)
  protected usePromptCaching: boolean = true;
  protected maxOutputTokens: number = 8192; // Claude 4 supports up to 64K

  constructor(agentName: string) {
    this.agentName = agentName;
  }

  public abstract execute(request: ContentGenerationRequest, context: any): Promise<any>;

  protected async callLLM(prompt: string, options?: { 
    model?: string; 
    maxTokens?: number; 
    temperature?: number;
    useTools?: boolean;
    systemPrompt?: string;
    cachePrompt?: boolean;
  }): Promise<string> {
    
    // Quick fail if no API key configured
    if (!config.anthropicApiKey || config.anthropicApiKey === '') {
      console.log(`${this.agentName}: No API key configured, using fallback`);
      throw new Error('API key not configured - using fallback');
    }
    const {
      model = 'claude-4-sonnet',
      maxTokens = this.maxOutputTokens,
      temperature = 0.7,
      useTools = false,
      systemPrompt,
      cachePrompt = this.usePromptCaching
    } = options || {};

    // Build messages array with proper structure
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: cachePrompt ? [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ] : systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: cachePrompt ? [
        {
          type: 'text',
          text: prompt,
          cache_control: { type: 'ephemeral' }
        }
      ] : prompt
    });

    const requestBody: any = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages
    };

    // Add Claude 4 specific features
    if (cachePrompt) {
      requestBody.cache_control = { type: 'ephemeral' };
    }

    // Add tools if specified (for future tool use implementation)
    if (useTools) {
      requestBody.tools = this.getAvailableTools();
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicApiKey,
          'anthropic-version': '2024-06-01' // Updated for Claude 4 features
        };

        // Add beta features header for Claude 4 capabilities
        if (cachePrompt || useTools) {
          headers['anthropic-beta'] = 'prompt-caching-2024-07-31,tools-2024-04-04';
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers,
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

  protected getAvailableTools(): any[] {
    // Base tools available to all agents - can be overridden by specific agents
    return [
      {
        name: 'web_search',
        description: 'Search the web for current information and trends',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            num_results: { type: 'number', description: 'Number of results to return' }
          },
          required: ['query']
        }
      },
      {
        name: 'content_analysis',
        description: 'Analyze existing content for quality and optimization',
        input_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to analyze' },
            analysis_type: { type: 'string', enum: ['seo', 'readability', 'engagement'] }
          },
          required: ['content', 'analysis_type']
        }
      }
    ];
  }

  protected async executeToolCall(toolName: string, parameters: any): Promise<any> {
    // Basic tool execution - can be enhanced with actual implementations
    console.log(`Executing tool: ${toolName} with parameters:`, parameters);
    
    switch (toolName) {
      case 'web_search':
        return this.simulateWebSearch(parameters.query, parameters.num_results || 5);
      case 'content_analysis':
        return this.simulateContentAnalysis(parameters.content, parameters.analysis_type);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async simulateWebSearch(query: string, numResults: number): Promise<any> {
    // Placeholder for web search functionality
    return {
      query,
      results: Array.from({ length: Math.min(numResults, 3) }, (_, i) => ({
        title: `Search Result ${i + 1} for "${query}"`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `Relevant information about ${query} from search result ${i + 1}`
      }))
    };
  }

  private async simulateContentAnalysis(content: string, analysisType: string): Promise<any> {
    // Placeholder for content analysis functionality
    const wordCount = content.split(' ').length;
    
    return {
      analysis_type: analysisType,
      word_count: wordCount,
      readability_score: Math.min(100, 60 + (wordCount / 100) * 5),
      seo_score: Math.random() * 40 + 60,
      engagement_score: Math.random() * 30 + 70,
      suggestions: [
        'Consider adding more specific examples',
        'Improve keyword density for better SEO',
        'Add compelling call-to-action statements'
      ]
    };
  }

  protected formatToolUse(toolName: string, parameters: any): string {
    // Format tool use in XML format for Anthropic models
    return `<tool>${toolName}</tool><tool_input>${JSON.stringify(parameters)}</tool_input>`;
  }

  protected parseToolResponse(response: string): { toolCalls: any[], content: string } {
    // Parse tool calls from response (basic implementation)
    const toolCalls: any[] = [];
    let content = response;

    // Extract tool calls in XML format
    const toolMatches = response.matchAll(/<tool>(.*?)<\/tool><tool_input>(.*?)<\/tool_input>/g);
    
    for (const match of toolMatches) {
      try {
        toolCalls.push({
          name: match[1],
          parameters: JSON.parse(match[2])
        });
        content = content.replace(match[0], '');
      } catch (error) {
        console.warn('Failed to parse tool call:', match[0]);
      }
    }

    return { toolCalls, content: content.trim() };
  }
}