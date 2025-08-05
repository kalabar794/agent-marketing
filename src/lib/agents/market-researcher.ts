import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';

export interface MarketResearchOutput {
  industry: string;
  trends: string[];
  competitors: string[];
  opportunities: string[];
  challenges: string[];
  keyInsights: string[];
  sources: string[];
}

export class MarketResearcher extends BaseAgent {
  public async execute(request: ContentGenerationRequest, context: any): Promise<MarketResearchOutput> {
    console.log(`🔍 [MarketResearcher] Starting execute() - timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 [MarketResearcher] Request details:`, {
      topic: request.topic,
      audience: request.targetAudience,
      contentType: request.contentType
    });
    
    console.log(`🔍 [MarketResearcher] Step 1: Building prompt...`);
    const prompt = this.buildPrompt(request);
    console.log(`🔍 [MarketResearcher] Step 1 completed: Prompt built (${prompt.length} chars)`);
    
    try {
      console.log(`🔍 [MarketResearcher] Step 2: Calling LLM...`);
      console.log(`🔍 [MarketResearcher] Step 2a: Pre-callLLM timestamp: ${new Date().toISOString()}`);
      
      const response = await this.callLLM(prompt);
      
      console.log(`🔍 [MarketResearcher] Step 2b: Post-callLLM timestamp: ${new Date().toISOString()}`);
      console.log(`🔍 [MarketResearcher] Step 2 completed: LLM response received (${response.length} chars)`);
      
      console.log(`🔍 [MarketResearcher] Step 3: Parsing response...`);
      const result = this.parseResponse(response);
      console.log(`🔍 [MarketResearcher] Step 3 completed: Response parsed successfully`);
      console.log(`🔍 [MarketResearcher] Final result summary:`, {
        industry: result.industry,
        trendsCount: result.trends?.length || 0,
        competitorsCount: result.competitors?.length || 0,
        opportunitiesCount: result.opportunities?.length || 0
      });
      
      console.log(`🔍 [MarketResearcher] Execute completed successfully - timestamp: ${new Date().toISOString()}`);
      return result;
    } catch (error) {
      console.error(`❌ [MarketResearcher] Execute failed - timestamp: ${new Date().toISOString()}`, error);
      console.error(`❌ [MarketResearcher] Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Market research failed: ${error}`);
    }
  }

  private buildPrompt(request: ContentGenerationRequest): string {
    return `You are a professional market researcher specializing in ${this.getIndustryFromTopic(request.topic)}. 

Conduct comprehensive market research for the following content project:

**Topic:** ${request.topic}
**Target Audience:** ${request.audience}
**Goals:** ${request.goals}
**Content Type:** ${request.contentType}

Please provide detailed market research including:

1. **Industry Overview**: Current state of the industry related to this topic
2. **Market Trends**: Top 5-7 current trends relevant to this topic
3. **Competitor Analysis**: Key competitors and their content strategies
4. **Market Opportunities**: Gaps and opportunities for content positioning
5. **Challenges & Pain Points**: Main challenges the target audience faces
6. **Key Insights**: Actionable insights for content creation
7. **Sources**: Where to find additional information

Format your response as a detailed JSON object with the following structure:
{
  "industry": "industry name",
  "trends": ["trend 1", "trend 2", ...],
  "competitors": ["competitor 1", "competitor 2", ...], 
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "challenges": ["challenge 1", "challenge 2", ...],
  "keyInsights": ["insight 1", "insight 2", ...],
  "sources": ["source 1", "source 2", ...]
}

Provide professional, actionable insights based on current market conditions.`;
  }

  private getIndustryFromTopic(topic: string): string {
    // Simple industry detection - could be enhanced with ML
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('marketing') || lowerTopic.includes('advertising')) return 'Digital Marketing';
    if (lowerTopic.includes('tech') || lowerTopic.includes('software') || lowerTopic.includes('ai')) return 'Technology';
    if (lowerTopic.includes('health') || lowerTopic.includes('medical')) return 'Healthcare';
    if (lowerTopic.includes('finance') || lowerTopic.includes('banking')) return 'Financial Services';
    if (lowerTopic.includes('real estate') || lowerTopic.includes('property')) return 'Real Estate';
    if (lowerTopic.includes('education') || lowerTopic.includes('learning')) return 'Education';
    if (lowerTopic.includes('retail') || lowerTopic.includes('ecommerce')) return 'Retail';
    if (lowerTopic.includes('food') || lowerTopic.includes('restaurant')) return 'Food & Beverage';
    
    return 'General Business';
  }

  private parseResponse(response: string): MarketResearchOutput {
    try {
      // Clean up the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const required = ['industry', 'trends', 'competitors', 'opportunities', 'challenges', 'keyInsights', 'sources'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return parsed as MarketResearchOutput;
    } catch (error) {
      // Fallback parsing if JSON fails
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): MarketResearchOutput {
    // Simple text parsing as fallback
    return {
      industry: 'Market Research',
      trends: this.extractListItems(response, 'trends'),
      competitors: this.extractListItems(response, 'competitors'),
      opportunities: this.extractListItems(response, 'opportunities'),
      challenges: this.extractListItems(response, 'challenges'),
      keyInsights: this.extractListItems(response, 'insights'),
      sources: ['Market analysis', 'Industry reports', 'Competitor research']
    };
  }

  private extractListItems(text: string, category: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(category)) {
        inSection = true;
        continue;
      }
      
      if (inSection && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
        items.push(line.replace(/^[-*\d.\s]+/, '').trim());
      } else if (inSection && line.trim() === '') {
        break;
      }
    }
    
    return items.length > 0 ? items : [`${category} analysis based on topic research`];
  }

  public async healthCheck(): Promise<boolean> {
    // Simple health check
    try {
      const testPrompt = "Provide a brief market overview for digital marketing.";
      await this.callLLM(testPrompt);
      return true;
    } catch {
      return false;
    }
  }
}