import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { MarketResearchOutput } from './market-researcher';
import { AudienceAnalysisOutput } from './audience-analyzer';

export interface ContentStrategyOutput {
  strategy: {
    objective: string;
    keyMessages: string[];
    valueProposition: string;
    differentiators: string[];
    callToAction: string;
  };
  outline: {
    title: string;
    subtitle?: string;
    sections: Array<{
      heading: string;
      subheadings?: string[];
      keyPoints: string[];
      purpose: string;
      estimatedWordCount: number;
    }>;
    totalEstimatedWords: number;
  };
  contentFramework: {
    hook: string;
    problemStatement: string;
    solutionPresentation: string;
    benefitsHighlight: string[];
    socialProof: string[];
    objectionHandling: string[];
    urgencyCreation: string;
  };
  seoStrategy: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    longtailKeywords: string[];
    semanticKeywords: string[];
    keywordDensity: number;
    metaTitle: string;
    metaDescription: string;
  };
  distributionPlan: {
    primaryChannels: string[];
    contentAdaptations: Array<{
      platform: string;
      adaptations: string[];
      specificRequirements: string[];
    }>;
    publishingSchedule: {
      timing: string;
      frequency: string;
      optimal_days: string[];
    };
  };
  measurableGoals: {
    primary: string[];
    secondary: string[];
    kpis: string[];
    benchmarks: string[];
  };
}

export class ContentStrategist extends BaseAgent {
  constructor() {
    super('Content Strategist');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<ContentStrategyOutput> {
    this.logExecution('Starting content strategy development');
    
    const marketResearch = context.previousOutputs?.['market-researcher'] as MarketResearchOutput;
    const audienceAnalysis = context.previousOutputs?.['audience-analyzer'] as AudienceAnalysisOutput;
    
    const prompt = this.buildPrompt(request, marketResearch, audienceAnalysis);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.7
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Content strategy completed', { 
        sections: result.outline.sections.length,
        totalWords: result.outline.totalEstimatedWords 
      });
      
      return result;
    } catch (error) {
      this.logExecution('Content strategy failed', { error: error.message });
      throw new Error(`Content strategy development failed: ${error}`);
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest, 
    marketResearch?: MarketResearchOutput,
    audienceAnalysis?: AudienceAnalysisOutput
  ): string {
    const marketContext = marketResearch ? `
Market Research Context:
- Industry: ${marketResearch.industry}
- Key Trends: ${marketResearch.trends.join(', ')}
- Opportunities: ${marketResearch.opportunities.join(', ')}
- Challenges: ${marketResearch.challenges.join(', ')}
- Key Insights: ${marketResearch.keyInsights.join(', ')}
` : '';

    const audienceContext = audienceAnalysis ? `
Audience Analysis Context:
- Primary Persona: ${audienceAnalysis.primaryPersona.name}
- Pain Points: ${audienceAnalysis.primaryPersona.painPoints.join(', ')}
- Goals: ${audienceAnalysis.primaryPersona.goals.join(', ')}
- Preferred Channels: ${audienceAnalysis.primaryPersona.preferredChannels.join(', ')}
- Content Preferences: ${audienceAnalysis.primaryPersona.contentPreferences.join(', ')}
- Messaging Strategy: ${audienceAnalysis.recommendations.messagingStrategy.join(', ')}
- Recommended Content Types: ${audienceAnalysis.recommendations.contentTypes.join(', ')}
` : '';

    const keywordContext = request.keywords?.length ? `
Target Keywords: ${request.keywords.join(', ')}
` : '';

    const platformContext = request.platforms?.length ? `
Target Platforms: ${request.platforms.join(', ')}
` : '';

    return `You are a senior content strategist specializing in ${request.contentType} content creation.

Develop a comprehensive content strategy for the following project:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
${request.tone ? `- Preferred Tone: ${request.tone}` : ''}
${request.brandGuidelines ? `- Brand Guidelines: ${request.brandGuidelines}` : ''}

${marketContext}
${audienceContext}
${keywordContext}
${platformContext}

Create a detailed content strategy including:

1. **Content Strategy**:
   - Clear objective and key messages
   - Unique value proposition
   - Key differentiators
   - Compelling call-to-action

2. **Content Outline**:
   - Engaging title and subtitle
   - Detailed section breakdown with headings, subheadings, key points
   - Purpose for each section
   - Estimated word counts

3. **Content Framework**:
   - Attention-grabbing hook
   - Problem statement
   - Solution presentation
   - Benefits highlight
   - Social proof elements
   - Objection handling
   - Urgency creation

4. **SEO Strategy**:
   - Primary, secondary, and long-tail keywords
   - Semantic keywords
   - Optimal keyword density
   - Meta title and description

5. **Distribution Plan**:
   - Primary distribution channels
   - Platform-specific adaptations
   - Publishing schedule recommendations

6. **Measurable Goals**:
   - Primary and secondary objectives
   - Key performance indicators
   - Success benchmarks

Format your response as a detailed JSON object with the following structure:
{
  "strategy": {
    "objective": "clear content objective",
    "keyMessages": ["message 1", "message 2", ...],
    "valueProposition": "unique value proposition",
    "differentiators": ["differentiator 1", "differentiator 2", ...],
    "callToAction": "compelling CTA"
  },
  "outline": {
    "title": "engaging title",
    "subtitle": "supporting subtitle",
    "sections": [
      {
        "heading": "section heading",
        "subheadings": ["subheading 1", "subheading 2", ...],
        "keyPoints": ["point 1", "point 2", ...],
        "purpose": "section purpose",
        "estimatedWordCount": 300
      }
    ],
    "totalEstimatedWords": 1500
  },
  "contentFramework": {
    "hook": "attention-grabbing hook",
    "problemStatement": "problem statement",
    "solutionPresentation": "solution presentation",
    "benefitsHighlight": ["benefit 1", "benefit 2", ...],
    "socialProof": ["proof 1", "proof 2", ...],
    "objectionHandling": ["objection 1", "objection 2", ...],
    "urgencyCreation": "urgency element"
  },
  "seoStrategy": {
    "primaryKeywords": ["keyword 1", "keyword 2", ...],
    "secondaryKeywords": ["secondary 1", "secondary 2", ...],
    "longtailKeywords": ["longtail 1", "longtail 2", ...],
    "semanticKeywords": ["semantic 1", "semantic 2", ...],
    "keywordDensity": 2.5,
    "metaTitle": "SEO-optimized title",
    "metaDescription": "compelling meta description"
  },
  "distributionPlan": {
    "primaryChannels": ["channel 1", "channel 2", ...],
    "contentAdaptations": [
      {
        "platform": "platform name",
        "adaptations": ["adaptation 1", "adaptation 2", ...],
        "specificRequirements": ["requirement 1", "requirement 2", ...]
      }
    ],
    "publishingSchedule": {
      "timing": "optimal timing",
      "frequency": "publishing frequency",
      "optimal_days": ["day 1", "day 2", ...]
    }
  },
  "measurableGoals": {
    "primary": ["primary goal 1", "primary goal 2", ...],
    "secondary": ["secondary goal 1", "secondary goal 2", ...],
    "kpis": ["kpi 1", "kpi 2", ...],
    "benchmarks": ["benchmark 1", "benchmark 2", ...]
  }
}

Provide strategic, actionable content strategy that aligns with market insights and audience needs.`;
  }

  private parseResponse(response: string): ContentStrategyOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'strategy', 'outline', 'contentFramework', 'seoStrategy', 'distributionPlan', 'measurableGoals'
      ]);

      // Validate strategy structure
      this.validateRequiredFields(parsed.strategy, [
        'objective', 'keyMessages', 'valueProposition', 'differentiators', 'callToAction'
      ]);

      // Validate outline structure
      this.validateRequiredFields(parsed.outline, ['title', 'sections', 'totalEstimatedWords']);

      // Ensure sections is an array
      if (!Array.isArray(parsed.outline.sections)) {
        parsed.outline.sections = [];
      }

      // Calculate total word count if missing
      if (!parsed.outline.totalEstimatedWords) {
        parsed.outline.totalEstimatedWords = parsed.outline.sections.reduce(
          (total: number, section: any) => total + (section.estimatedWordCount || 200), 
          0
        );
      }

      return this.sanitizeOutput(parsed) as ContentStrategyOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): ContentStrategyOutput {
    const extractedTitle = this.extractTitle(response) || this.generateTitleFromTopic();
    const sections = this.extractSections(response);
    
    return {
      strategy: {
        objective: this.extractObjective(response) || `Create engaging ${this.getContentType()} content`,
        keyMessages: this.extractListItems(response, 'message') || ['Build trust', 'Provide value', 'Drive action'],
        valueProposition: this.extractValueProp(response) || 'Delivering exceptional value to our audience',
        differentiators: this.extractListItems(response, 'differentiator') || ['Unique approach', 'Expert insights'],
        callToAction: this.extractCTA(response) || 'Learn more about our solution'
      },
      outline: {
        title: extractedTitle,
        subtitle: this.extractSubtitle(response),
        sections: sections,
        totalEstimatedWords: sections.reduce((total, section) => total + section.estimatedWordCount, 0)
      },
      contentFramework: {
        hook: this.extractHook(response) || 'Compelling opening that grabs attention',
        problemStatement: 'Understanding the challenge our audience faces',
        solutionPresentation: 'How our approach solves the problem',
        benefitsHighlight: ['Improved efficiency', 'Better results', 'Cost savings'],
        socialProof: ['Customer testimonials', 'Case studies', 'Industry recognition'],
        objectionHandling: ['Address common concerns', 'Provide reassurance'],
        urgencyCreation: 'Limited time offer or immediate benefit'
      },
      seoStrategy: {
        primaryKeywords: this.extractKeywords(response, 'primary') || ['content marketing', 'strategy'],
        secondaryKeywords: this.extractKeywords(response, 'secondary') || ['audience engagement', 'conversion'],
        longtailKeywords: ['how to improve content strategy', 'best practices for content creation'],
        semanticKeywords: ['content optimization', 'digital marketing', 'audience targeting'],
        keywordDensity: 2.0,
        metaTitle: `${extractedTitle} | Complete Guide`,
        metaDescription: `Discover effective strategies for ${extractedTitle.toLowerCase()}. Expert insights and actionable tips.`
      },
      distributionPlan: {
        primaryChannels: ['Website', 'Email', 'Social Media'],
        contentAdaptations: [
          {
            platform: 'Blog',
            adaptations: ['Long-form content', 'SEO optimization'],
            specificRequirements: ['1500+ words', 'Internal links', 'Call-to-action']
          }
        ],
        publishingSchedule: {
          timing: 'Weekday mornings',
          frequency: 'Weekly',
          optimal_days: ['Tuesday', 'Wednesday', 'Thursday']
        }
      },
      measurableGoals: {
        primary: ['Increase engagement', 'Drive conversions'],
        secondary: ['Build brand awareness', 'Generate leads'],
        kpis: ['Page views', 'Time on page', 'Conversion rate', 'Social shares'],
        benchmarks: ['10% increase in engagement', '5% conversion rate', '1000+ page views']
      }
    };
  }

  private extractTitle(text: string): string | null {
    const titlePatterns = [
      /title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /^#\s+(.+)$/m,
      /^title:\s*(.+)$/m
    ];
    
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  private generateTitleFromTopic(): string {
    return `The Complete Guide to ${this.getTopic()}`;
  }

  private extractSections(text: string): Array<any> {
    const sections = [];
    const lines = text.split('\n');
    let currentSection: any = null;
    
    for (const line of lines) {
      // Check for section headings
      if (line.match(/^##\s+/) || line.includes('heading') || line.includes('section')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: line.replace(/^##\s+/, '').trim() || 'Section Heading',
          subheadings: [],
          keyPoints: [],
          purpose: 'Provide valuable information to the reader',
          estimatedWordCount: 300
        };
      } else if (currentSection && (line.startsWith('-') || line.startsWith('*'))) {
        currentSection.keyPoints.push(line.replace(/^[-*]\s+/, '').trim());
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Ensure we have at least basic sections
    if (sections.length === 0) {
      return [
        {
          heading: 'Introduction',
          subheadings: ['Overview', 'Key Benefits'],
          keyPoints: ['Set the context', 'Introduce main concepts'],
          purpose: 'Engage the reader and set expectations',
          estimatedWordCount: 250
        },
        {
          heading: 'Main Content',
          subheadings: ['Core Strategies', 'Implementation'],
          keyPoints: ['Present main ideas', 'Provide actionable insights'],
          purpose: 'Deliver the core value of the content',
          estimatedWordCount: 600
        },
        {
          heading: 'Conclusion',
          subheadings: ['Key Takeaways', 'Next Steps'],
          keyPoints: ['Summarize main points', 'Call to action'],
          purpose: 'Reinforce value and drive action',
          estimatedWordCount: 200
        }
      ];
    }
    
    return sections;
  }

  private extractObjective(text: string): string | null {
    const match = text.match(/objective[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : null;
  }

  private extractValueProp(text: string): string | null {
    const match = text.match(/value\s*proposition[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : null;
  }

  private extractCTA(text: string): string | null {
    const patterns = [
      /call\s*to\s*action[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /cta[\"']?\s*:\s*[\"']([^\"']+)[\"']/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private extractSubtitle(text: string): string | undefined {
    const match = text.match(/subtitle[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : undefined;
  }

  private extractHook(text: string): string | null {
    const match = text.match(/hook[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : null;
  }

  private extractKeywords(text: string, type: string): string[] {
    const pattern = new RegExp(`${type}\\s*keywords?[\"']?\\s*:\\s*\\[([^\\]]+)\\]`, 'i');
    const match = text.match(pattern);
    if (match) {
      return match[1].split(',').map(k => k.trim().replace(/[\"']/g, ''));
    }
    return [];
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

  private getTopic(): string {
    return 'Your Topic'; // This would be passed from context in real implementation
  }

  private getContentType(): string {
    return 'content'; // This would be passed from context in real implementation
  }
}