import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { MarketResearchOutput } from './market-researcher';

export interface AudienceAnalysisOutput {
  primaryPersona: {
    name: string;
    demographics: {
      age: string;
      gender: string;
      income: string;
      education: string;
      location: string;
    };
    psychographics: {
      values: string[];
      interests: string[];
      lifestyle: string[];
      attitudes: string[];
    };
    painPoints: string[];
    goals: string[];
    preferredChannels: string[];
    contentPreferences: string[];
  };
  secondaryPersonas: Array<{
    name: string;
    keyCharacteristics: string[];
    uniqueNeeds: string[];
  }>;
  audienceInsights: {
    size: string;
    growth: string;
    engagement: string;
    conversionFactors: string[];
    contentGaps: string[];
  };
  recommendations: {
    messagingStrategy: string[];
    contentTypes: string[];
    tonalGuidance: string[];
    channelPriority: string[];
  };
}

export class AudienceAnalyzer extends BaseAgent {
  constructor() {
    super('Audience Analyzer');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<AudienceAnalysisOutput> {
    this.logExecution('Starting audience analysis');
    
    const marketResearch = context.previousOutputs?.['market-researcher'] as MarketResearchOutput;
    const prompt = this.buildPrompt(request, marketResearch);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.6
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Audience analysis completed', { personaCount: result.secondaryPersonas.length + 1 });
      
      return result;
    } catch (error) {
      this.logExecution('Audience analysis failed', { error: error.message });
      throw new Error(`Audience analysis failed: ${error}`);
    }
  }

  private buildPrompt(request: ContentGenerationRequest, marketResearch?: MarketResearchOutput): string {
    const industryContext = marketResearch ? `
Industry Context from Market Research:
- Industry: ${marketResearch.industry}
- Key Trends: ${marketResearch.trends.join(', ')}
- Market Opportunities: ${marketResearch.opportunities.join(', ')}
- Challenges: ${marketResearch.challenges.join(', ')}
` : '';

    return `You are an expert audience researcher and persona developer specializing in ${request.audience} demographics.

Conduct comprehensive audience analysis for the following content project:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
${request.tone ? `- Preferred Tone: ${request.tone}` : ''}

${industryContext}

Please provide detailed audience analysis including:

1. **Primary Persona Development**:
   - Create a detailed primary persona with name, demographics, psychographics
   - Include pain points, goals, preferred communication channels
   - Specify content preferences and consumption habits

2. **Secondary Personas** (2-3 additional personas):
   - Identify key secondary audience segments
   - Highlight unique characteristics and needs for each

3. **Audience Insights**:
   - Market size and growth potential
   - Engagement patterns and preferences
   - Key factors that drive conversions
   - Content gaps in the market

4. **Strategic Recommendations**:
   - Messaging strategy recommendations
   - Optimal content types and formats
   - Tonal guidance for communication
   - Channel prioritization

Format your response as a detailed JSON object with the following structure:
{
  "primaryPersona": {
    "name": "persona name",
    "demographics": {
      "age": "age range",
      "gender": "gender distribution",
      "income": "income range",
      "education": "education level",
      "location": "geographic focus"
    },
    "psychographics": {
      "values": ["value 1", "value 2", ...],
      "interests": ["interest 1", "interest 2", ...],
      "lifestyle": ["lifestyle 1", "lifestyle 2", ...],
      "attitudes": ["attitude 1", "attitude 2", ...]
    },
    "painPoints": ["pain point 1", "pain point 2", ...],
    "goals": ["goal 1", "goal 2", ...],
    "preferredChannels": ["channel 1", "channel 2", ...],
    "contentPreferences": ["preference 1", "preference 2", ...]
  },
  "secondaryPersonas": [
    {
      "name": "secondary persona name",
      "keyCharacteristics": ["characteristic 1", "characteristic 2", ...],
      "uniqueNeeds": ["need 1", "need 2", ...]
    }
  ],
  "audienceInsights": {
    "size": "market size description",
    "growth": "growth potential",
    "engagement": "engagement patterns",
    "conversionFactors": ["factor 1", "factor 2", ...],
    "contentGaps": ["gap 1", "gap 2", ...]
  },
  "recommendations": {
    "messagingStrategy": ["strategy 1", "strategy 2", ...],
    "contentTypes": ["type 1", "type 2", ...],
    "tonalGuidance": ["tone 1", "tone 2", ...],
    "channelPriority": ["channel 1", "channel 2", ...]
  }
}

Provide actionable, data-driven insights that will guide content creation strategy.`;
  }

  private parseResponse(response: string): AudienceAnalysisOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required fields
      this.validateRequiredFields(parsed, [
        'primaryPersona', 'secondaryPersonas', 'audienceInsights', 'recommendations'
      ]);

      // Validate primary persona structure
      this.validateRequiredFields(parsed.primaryPersona, [
        'name', 'demographics', 'psychographics', 'painPoints', 'goals', 'preferredChannels', 'contentPreferences'
      ]);

      // Ensure arrays are properly formatted
      if (!Array.isArray(parsed.secondaryPersonas)) {
        parsed.secondaryPersonas = [];
      }

      return this.sanitizeOutput(parsed) as AudienceAnalysisOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): AudienceAnalysisOutput {
    return {
      primaryPersona: {
        name: this.extractPersonaName(response) || 'Target Customer',
        demographics: {
          age: this.extractDemographic(response, 'age') || '25-45',
          gender: this.extractDemographic(response, 'gender') || 'Mixed',
          income: this.extractDemographic(response, 'income') || 'Middle to Upper-Middle Class',
          education: this.extractDemographic(response, 'education') || 'College Educated',
          location: this.extractDemographic(response, 'location') || 'Urban/Suburban'
        },
        psychographics: {
          values: this.extractListItems(response, 'values') || ['Quality', 'Efficiency', 'Innovation'],
          interests: this.extractListItems(response, 'interests') || ['Technology', 'Business', 'Growth'],
          lifestyle: this.extractListItems(response, 'lifestyle') || ['Busy Professional', 'Early Adopter'],
          attitudes: this.extractListItems(response, 'attitudes') || ['Solution-Oriented', 'Research-Driven']
        },
        painPoints: this.extractListItems(response, 'pain') || ['Time Constraints', 'Information Overload'],
        goals: this.extractListItems(response, 'goals') || ['Improve Efficiency', 'Achieve Success'],
        preferredChannels: this.extractListItems(response, 'channels') || ['Email', 'Social Media', 'Web'],
        contentPreferences: this.extractListItems(response, 'content') || ['How-to Guides', 'Case Studies']
      },
      secondaryPersonas: [
        {
          name: 'Secondary Audience',
          keyCharacteristics: ['Emerging Market Segment'],
          uniqueNeeds: ['Specialized Solutions']
        }
      ],
      audienceInsights: {
        size: 'Growing market segment',
        growth: 'Positive growth trajectory',
        engagement: 'High engagement on relevant content',
        conversionFactors: ['Trust', 'Value Demonstration', 'Social Proof'],
        contentGaps: ['Educational Content', 'Industry-Specific Examples']
      },
      recommendations: {
        messagingStrategy: ['Focus on Benefits', 'Use Clear Language', 'Include Social Proof'],
        contentTypes: ['Blog Posts', 'Case Studies', 'Video Content'],
        tonalGuidance: ['Professional', 'Helpful', 'Trustworthy'],
        channelPriority: ['Website', 'Email', 'LinkedIn']
      }
    };
  }

  private extractPersonaName(text: string): string | null {
    const nameMatch = text.match(/name[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return nameMatch ? nameMatch[1] : null;
  }

  private extractDemographic(text: string, type: string): string | null {
    const pattern = new RegExp(`${type}[\"']?\\s*:\\s*[\"']([^\"']+)[\"']`, 'i');
    const match = text.match(pattern);
    return match ? match[1] : null;
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
    
    return items;
  }
}