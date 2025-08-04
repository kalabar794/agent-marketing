import { ContentGenerationRequest } from '@/types/content';
import { config } from '@/lib/config';
import Anthropic from '@anthropic-ai/sdk';

export abstract class BaseAgent {
  protected agentName: string;
  protected maxRetries: number = 3;
  protected timeout: number = 180000; // 3 minutes timeout for comprehensive content generation
  protected usePromptCaching: boolean = true;
  protected maxOutputTokens: number = 8192; // Industry standard for comprehensive marketing content (1500-2000 words)

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
  }): Promise<string> {
    
    // API key is validated at config load time - no need to check again
    console.log(`[${this.agentName}] Starting LLM call with validated API key`);

    const {
      model = 'claude-sonnet-4-20250514', // Use Claude Sonnet 4 (latest)
      maxTokens = this.maxOutputTokens, // Use full token allowance for comprehensive content
      temperature = 0.3, // Optimized for consistent, high-quality marketing copy
      useTools = false,
      systemPrompt
    } = options || {};

    // Initialize Anthropic client with proper error handling
    const anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.agentName}] Calling Claude API (attempt ${attempt}/${this.maxRetries})`);
        
        const requestOptions: Anthropic.MessageCreateParams = {
          model,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9, // Add top_p for better sampling
          messages
        };

        // Add system prompt if provided
        if (systemPrompt) {
          requestOptions.system = systemPrompt;
        }

        // Add tools if specified
        if (useTools) {
          requestOptions.tools = this.getAvailableTools();
        }

        const response = await anthropic.messages.create(requestOptions);
        
        // Log token usage for cost monitoring (API best practice)
        if (response.usage) {
          console.log(`[${this.agentName}] Token usage - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);
          const estimatedCost = (response.usage.input_tokens * 0.003 + response.usage.output_tokens * 0.015) / 1000; // Claude Sonnet 4 pricing
          console.log(`[${this.agentName}] Estimated cost: $${estimatedCost.toFixed(4)}`);
        }
        
        // Check stop reason
        if (response.stop_reason && response.stop_reason !== 'end_turn' && response.stop_reason !== 'tool_use') {
          throw new Error(`Claude stop_reason=${response.stop_reason}`);
        }
        
        // Extract text from response
        const textContent = response.content.find(content => content.type === 'text');
        if (textContent && 'text' in textContent) {
          console.log(`[${this.agentName}] Claude API call successful`);
          return textContent.text;
        } else {
          throw new Error('No text content found in Claude response');
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[${this.agentName}] LLM call attempt ${attempt} failed:`, {
          model,
          maxTokens,
          temperature,
          agentName: this.agentName,
          error: lastError.message
        });
        
        if (attempt < this.maxRetries) {
          // Exponential backoff with rate limiting best practices
          const baseDelay = Math.pow(2, attempt) * 1000;
          // Add jitter to avoid thundering herd (API best practice)
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          console.log(`[${this.agentName}] Retrying in ${delay.toFixed(0)}ms... (attempt ${attempt}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`${this.agentName} failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  protected async callLLMWithFallback(prompt: string, fallbackResponse: any): Promise<string> {
    // No more fallbacks - let real errors surface
    return await this.callLLM(prompt);
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