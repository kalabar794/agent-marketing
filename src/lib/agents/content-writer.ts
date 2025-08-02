import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { MarketResearchOutput } from './market-researcher';
import { AudienceAnalysisOutput } from './audience-analyzer';
import { ContentStrategyOutput } from './content-strategist';
import { SEOOptimizationOutput } from './ai-seo-optimizer';

export interface ContentWriterOutput {
  content: {
    title: string;
    subtitle?: string;
    introduction: string;
    mainContent: Array<{
      heading: string;
      subheading?: string;
      paragraphs: string[];
      bulletPoints?: string[];
      callouts?: Array<{
        type: 'tip' | 'warning' | 'info' | 'quote';
        content: string;
      }>;
    }>;
    conclusion: string;
    callToAction: string;
  };
  metadata: {
    wordCount: number;
    readingTime: number;
    keywordDensity: {
      primary: number;
      secondary: number;
    };
    tone: string;
    readabilityScore: number;
  };
  seoElements: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    headingStructure: Array<{
      level: number;
      text: string;
      keywords: string[];
    }>;
    internalLinks: Array<{
      anchor: string;
      url: string;
      context: string;
    }>;
    imageRecommendations: Array<{
      description: string;
      altText: string;
      placement: string;
    }>;
  };
  engagementElements: {
    hooks: string[];
    transitionPhrases: string[];
    socialProofElements: string[];
    urgencyCreators: string[];
    emotionalTriggers: string[];
  };
  brandAlignment: {
    voiceConsistency: number;
    messageAlignment: number;
    tonalAccuracy: number;
    brandKeywords: string[];
  };
  qualityMetrics: {
    originalityScore: number;
    relevanceScore: number;
    engagementScore: number;
    conversionPotential: number;
  };
}

export class ContentWriter extends BaseAgent {
  constructor() {
    super('Content Writer');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<ContentWriterOutput> {
    this.logExecution('Starting content writing');
    
    const marketResearch = context.previousOutputs?.['market-researcher'] as MarketResearchOutput;
    const audienceAnalysis = context.previousOutputs?.['audience-analyzer'] as AudienceAnalysisOutput;
    const contentStrategy = context.previousOutputs?.['content-strategist'] as ContentStrategyOutput;
    const seoOptimization = context.previousOutputs?.['ai-seo-optimizer'] as SEOOptimizationOutput;
    
    const prompt = this.buildPrompt(request, marketResearch, audienceAnalysis, contentStrategy, seoOptimization);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.8
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Content writing completed', { 
        wordCount: result.metadata.wordCount,
        sections: result.content.mainContent.length 
      });
      
      return result;
    } catch (error) {
      this.logExecution('Content writing failed', { error: error.message });
      throw new Error(`Content writing failed: ${error}`);
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    marketResearch?: MarketResearchOutput,
    audienceAnalysis?: AudienceAnalysisOutput,
    contentStrategy?: ContentStrategyOutput,
    seoOptimization?: SEOOptimizationOutput
  ): string {
    const marketContext = marketResearch ? `
Market Research Context:
- Industry: ${marketResearch.industry}
- Key Trends: ${marketResearch.trends.join(', ')}
- Opportunities: ${marketResearch.opportunities.join(', ')}
- Key Insights: ${marketResearch.keyInsights.join(', ')}
` : '';

    const audienceContext = audienceAnalysis ? `
Audience Context:
- Primary Persona: ${audienceAnalysis.primaryPersona.name}
- Pain Points: ${audienceAnalysis.primaryPersona.painPoints.join(', ')}
- Goals: ${audienceAnalysis.primaryPersona.goals.join(', ')}
- Values: ${audienceAnalysis.primaryPersona.psychographics.values.join(', ')}
- Content Preferences: ${audienceAnalysis.primaryPersona.contentPreferences.join(', ')}
` : '';

    const strategyContext = contentStrategy ? `
Content Strategy Context:
- Title: ${contentStrategy.outline.title}
- Key Messages: ${contentStrategy.strategy.keyMessages.join(', ')}
- Value Proposition: ${contentStrategy.strategy.valueProposition}
- Call to Action: ${contentStrategy.strategy.callToAction}
- Content Framework Hook: ${contentStrategy.contentFramework.hook}
- Problem Statement: ${contentStrategy.contentFramework.problemStatement}
- Solution Presentation: ${contentStrategy.contentFramework.solutionPresentation}
- Benefits: ${contentStrategy.contentFramework.benefitsHighlight.join(', ')}

Content Sections:
${contentStrategy.outline.sections.map(section => `
- ${section.heading} (${section.estimatedWordCount} words)
  Purpose: ${section.purpose}
  Key Points: ${section.keyPoints.join(', ')}
`).join('')}
` : '';

    const seoContext = seoOptimization ? `
SEO Guidelines:
- Primary Keywords: ${seoOptimization.keywordStrategy.primaryKeywords.map(k => k.keyword).join(', ')}
- Secondary Keywords: ${seoOptimization.keywordStrategy.secondaryKeywords.join(', ')}
- Focus Keyphrase: ${seoOptimization.onPageOptimization.focusKeyphrase}
- Target Keyword Density: ${seoOptimization.onPageOptimization.keywordDensity.target}%
- H1 Tag: ${seoOptimization.onPageOptimization.h1Tag}
- H2 Tags: ${seoOptimization.onPageOptimization.h2Tags.join(', ')}
- Meta Title: ${seoOptimization.onPageOptimization.metaTitle}
- Meta Description: ${seoOptimization.onPageOptimization.metaDescription}
` : '';

    return `You are a professional content writer specializing in ${request.contentType} content that converts.

Write compelling, engaging content for the following project:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
- Tone: ${request.tone || 'Professional and engaging'}
${request.brandGuidelines ? `- Brand Guidelines: ${request.brandGuidelines}` : ''}

${marketContext}
${audienceContext}
${strategyContext}
${seoContext}

Write high-quality content that includes:

1. **Main Content Structure**:
   - Compelling title and subtitle
   - Engaging introduction with hook
   - Well-structured main content sections
   - Strong conclusion with clear next steps
   - Powerful call-to-action

2. **Content Quality**:
   - Natural keyword integration
   - Engaging storytelling elements
   - Clear value propositions
   - Social proof integration
   - Actionable insights

3. **SEO Integration**:
   - Proper heading hierarchy
   - Natural keyword placement
   - Internal linking opportunities
   - Image recommendations with alt text

4. **Engagement Elements**:
   - Attention-grabbing hooks
   - Smooth transitions
   - Emotional triggers
   - Urgency creators

5. **Brand Alignment**:
   - Consistent brand voice
   - Message alignment
   - Appropriate tone
   - Brand keyword integration

Format your response as a detailed JSON object with the following structure:
{
  "content": {
    "title": "compelling title",
    "subtitle": "supporting subtitle",
    "introduction": "engaging introduction paragraph",
    "mainContent": [
      {
        "heading": "section heading",
        "subheading": "optional subheading",
        "paragraphs": ["paragraph 1", "paragraph 2", ...],
        "bulletPoints": ["point 1", "point 2", ...],
        "callouts": [
          {
            "type": "tip",
            "content": "helpful tip content"
          }
        ]
      }
    ],
    "conclusion": "strong conclusion paragraph",
    "callToAction": "compelling call to action"
  },
  "metadata": {
    "wordCount": 1500,
    "readingTime": 6,
    "keywordDensity": {
      "primary": 2.5,
      "secondary": 1.8
    },
    "tone": "professional",
    "readabilityScore": 75
  },
  "seoElements": {
    "metaTitle": "SEO-optimized title",
    "metaDescription": "compelling meta description",
    "focusKeyword": "primary keyword",
    "headingStructure": [
      {
        "level": 1,
        "text": "H1 heading",
        "keywords": ["keyword 1", "keyword 2"]
      }
    ],
    "internalLinks": [
      {
        "anchor": "link text",
        "url": "/related-page",
        "context": "where to place link"
      }
    ],
    "imageRecommendations": [
      {
        "description": "image description",
        "altText": "SEO-friendly alt text",
        "placement": "after introduction"
      }
    ]
  },
  "engagementElements": {
    "hooks": ["hook 1", "hook 2", ...],
    "transitionPhrases": ["transition 1", "transition 2", ...],
    "socialProofElements": ["proof 1", "proof 2", ...],
    "urgencyCreators": ["urgency 1", "urgency 2", ...],
    "emotionalTriggers": ["trigger 1", "trigger 2", ...]
  },
  "brandAlignment": {
    "voiceConsistency": 95,
    "messageAlignment": 90,
    "tonalAccuracy": 88,
    "brandKeywords": ["brand keyword 1", "brand keyword 2", ...]
  },
  "qualityMetrics": {
    "originalityScore": 96,
    "relevanceScore": 94,
    "engagementScore": 89,
    "conversionPotential": 87
  }
}

Write content that is original, engaging, and optimized for both human readers and search engines.`;
  }

  private parseResponse(response: string): ContentWriterOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'content', 'metadata', 'seoElements', 'engagementElements', 'brandAlignment', 'qualityMetrics'
      ]);

      // Validate content structure
      this.validateRequiredFields(parsed.content, [
        'title', 'introduction', 'mainContent', 'conclusion', 'callToAction'
      ]);

      // Ensure arrays exist
      if (!Array.isArray(parsed.content.mainContent)) {
        parsed.content.mainContent = [];
      }

      // Calculate word count if missing
      if (!parsed.metadata.wordCount) {
        parsed.metadata.wordCount = this.calculateWordCount(parsed.content);
      }

      // Calculate reading time if missing
      if (!parsed.metadata.readingTime) {
        parsed.metadata.readingTime = Math.ceil(parsed.metadata.wordCount / 250);
      }

      return this.sanitizeOutput(parsed) as ContentWriterOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): ContentWriterOutput {
    const title = this.extractTitle(response) || 'Engaging Content Title';
    const sections = this.extractContentSections(response);
    const wordCount = this.estimateWordCount(response);

    return {
      content: {
        title,
        subtitle: this.extractSubtitle(response),
        introduction: this.extractIntroduction(response) || 'Compelling introduction that hooks the reader and sets the stage for valuable insights ahead.',
        mainContent: sections,
        conclusion: this.extractConclusion(response) || 'In conclusion, these strategies will help you achieve your goals and create meaningful impact.',
        callToAction: this.extractCallToAction(response) || 'Ready to get started? Take action today and see the results for yourself.'
      },
      metadata: {
        wordCount,
        readingTime: Math.ceil(wordCount / 250),
        keywordDensity: {
          primary: 2.0,
          secondary: 1.5
        },
        tone: 'professional',
        readabilityScore: 75
      },
      seoElements: {
        metaTitle: title,
        metaDescription: `Discover ${title.toLowerCase()}. Expert insights and actionable strategies for success.`,
        focusKeyword: this.extractMainKeyword(response) || 'content strategy',
        headingStructure: [
          {
            level: 1,
            text: title,
            keywords: [this.extractMainKeyword(response) || 'content']
          },
          ...sections.map((section, index) => ({
            level: 2,
            text: section.heading,
            keywords: [`keyword ${index + 1}`]
          }))
        ],
        internalLinks: [
          {
            anchor: 'related resources',
            url: '/resources',
            context: 'in the main content'
          }
        ],
        imageRecommendations: [
          {
            description: 'Hero image representing the main topic',
            altText: `${title} illustration`,
            placement: 'after introduction'
          }
        ]
      },
      engagementElements: {
        hooks: [
          'Attention-grabbing opening question',
          'Surprising statistic or fact',
          'Relatable scenario'
        ],
        transitionPhrases: [
          'Now that we understand...',
          'Building on this concept...',
          'Here\'s the key insight...'
        ],
        socialProofElements: [
          'Industry expert testimonials',
          'Case study results',
          'User success stories'
        ],
        urgencyCreators: [
          'Limited-time insights',
          'First-mover advantage',
          'Immediate implementation benefits'
        ],
        emotionalTriggers: [
          'Aspiration for success',
          'Fear of missing out',
          'Desire for improvement'
        ]
      },
      brandAlignment: {
        voiceConsistency: 90,
        messageAlignment: 85,
        tonalAccuracy: 88,
        brandKeywords: ['expertise', 'innovation', 'results', 'quality']
      },
      qualityMetrics: {
        originalityScore: 92,
        relevanceScore: 89,
        engagementScore: 86,
        conversionPotential: 83
      }
    };
  }

  private extractTitle(text: string): string | null {
    const patterns = [
      /title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /^#\s+(.+)$/m,
      /^title:\s*(.+)$/m
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  private extractSubtitle(text: string): string | undefined {
    const match = text.match(/subtitle[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : undefined;
  }

  private extractIntroduction(text: string): string | null {
    const match = text.match(/introduction[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : null;
  }

  private extractConclusion(text: string): string | null {
    const match = text.match(/conclusion[\"']?\s*:\s*[\"']([^\"']+)[\"']/i);
    return match ? match[1] : null;
  }

  private extractCallToAction(text: string): string | null {
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

  private extractMainKeyword(text: string): string | null {
    const patterns = [
      /focus\s*keyword[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /primary\s*keyword[\"']?\s*:\s*[\"']([^\"']+)[\"']/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private extractContentSections(response: string): Array<any> {
    const sections = [];
    const lines = response.split('\n');
    let currentSection: any = null;
    
    for (const line of lines) {
      // Check for section headings
      if (line.match(/^##\s+/) || line.includes('heading')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: line.replace(/^##\s+/, '').trim() || 'Section Heading',
          paragraphs: [],
          bulletPoints: []
        };
      } else if (currentSection && line.trim() && !line.startsWith('#')) {
        if (line.startsWith('-') || line.startsWith('*')) {
          currentSection.bulletPoints.push(line.replace(/^[-*]\s+/, '').trim());
        } else if (line.length > 50) {
          currentSection.paragraphs.push(line.trim());
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Ensure we have at least basic sections
    if (sections.length === 0) {
      return [
        {
          heading: 'Understanding the Fundamentals',
          paragraphs: [
            'This section establishes the foundation and core concepts that readers need to understand.',
            'We explore the key principles and provide context for the strategies that follow.'
          ],
          bulletPoints: [
            'Core concept definition',
            'Historical context',
            'Current relevance'
          ]
        },
        {
          heading: 'Proven Strategies and Techniques',
          paragraphs: [
            'Here we dive deep into actionable strategies that have been proven to work.',
            'Each technique is backed by real-world examples and measurable results.'
          ],
          bulletPoints: [
            'Strategy implementation steps',
            'Best practices and tips',
            'Common pitfalls to avoid'
          ]
        },
        {
          heading: 'Implementation and Next Steps',
          paragraphs: [
            'The final section focuses on practical implementation and long-term success.',
            'We provide a clear roadmap for putting these insights into action.'
          ],
          bulletPoints: [
            'Step-by-step implementation guide',
            'Timeline recommendations',
            'Success measurement metrics'
          ]
        }
      ];
    }
    
    return sections;
  }

  private calculateWordCount(content: any): number {
    let wordCount = 0;
    
    if (content.title) wordCount += content.title.split(' ').length;
    if (content.subtitle) wordCount += content.subtitle.split(' ').length;
    if (content.introduction) wordCount += content.introduction.split(' ').length;
    if (content.conclusion) wordCount += content.conclusion.split(' ').length;
    if (content.callToAction) wordCount += content.callToAction.split(' ').length;
    
    if (content.mainContent) {
      content.mainContent.forEach((section: any) => {
        if (section.heading) wordCount += section.heading.split(' ').length;
        if (section.subheading) wordCount += section.subheading.split(' ').length;
        if (section.paragraphs) {
          section.paragraphs.forEach((para: string) => {
            wordCount += para.split(' ').length;
          });
        }
        if (section.bulletPoints) {
          section.bulletPoints.forEach((point: string) => {
            wordCount += point.split(' ').length;
          });
        }
      });
    }
    
    return wordCount;
  }

  private estimateWordCount(text: string): number {
    return text.split(/\s+/).length;
  }
}