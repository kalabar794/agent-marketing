import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { MarketResearchOutput } from './market-researcher';
import { AudienceAnalysisOutput } from './audience-analyzer';
import { ContentStrategyOutput } from './content-strategist';

export interface SEOOptimizationOutput {
  keywordStrategy: {
    primaryKeywords: Array<{
      keyword: string;
      searchVolume: string;
      difficulty: string;
      intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
      priority: 'high' | 'medium' | 'low';
    }>;
    secondaryKeywords: string[];
    longtailKeywords: string[];
    semanticKeywords: string[];
    lsiKeywords: string[];
    keywordClusters: Array<{
      cluster: string;
      keywords: string[];
      searchIntent: string;
    }>;
  };
  onPageOptimization: {
    metaTitle: string;
    metaDescription: string;
    h1Tag: string;
    h2Tags: string[];
    h3Tags: string[];
    urlSlug: string;
    focusKeyphrase: string;
    keywordDensity: {
      target: number;
      primary: number;
      secondary: number;
    };
    internalLinkingSuggestions: string[];
    imageAltTags: string[];
    schemaMarkup: {
      type: string;
      properties: Record<string, any>;
    };
  };
  contentOptimization: {
    titleVariations: string[];
    headingOptimizations: Array<{
      original: string;
      optimized: string;
      reasoning: string;
    }>;
    contentGaps: string[];
    competitorAnalysis: {
      topCompetitors: string[];
      contentGaps: string[];
      opportunities: string[];
    };
    readabilityScore: number;
    readabilityRecommendations: string[];
  };
  aiSearchOptimization: {
    answerEngineOptimization: {
      featuredSnippetTargets: string[];
      faqSuggestions: Array<{
        question: string;
        answer: string;
      }>;
      conversationalQueries: string[];
    };
    voiceSearchOptimization: {
      naturalLanguageQueries: string[];
      questionBasedContent: string[];
      localOptimization: string[];
    };
    entityOptimization: {
      primaryEntities: string[];
      entityRelationships: string[];
      topicalAuthority: string[];
    };
  };
  technicalSEO: {
    crawlability: string[];
    pagespeedRecommendations: string[];
    mobileOptimization: string[];
    coreWebVitals: {
      lcpRecommendations: string[];
      fidRecommendations: string[];
      clsRecommendations: string[];
    };
  };
  linkBuildingStrategy: {
    targetDomains: string[];
    outreachTemplates: string[];
    contentAssets: string[];
    linkWorthyAngles: string[];
  };
  performanceTracking: {
    kpis: string[];
    trackingSetup: string[];
    reportingSchedule: string;
    successMetrics: Array<{
      metric: string;
      target: string;
      timeframe: string;
    }>;
  };
}

export class AISEOOptimizer extends BaseAgent {
  constructor() {
    super('AI SEO Optimizer');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<SEOOptimizationOutput> {
    this.logExecution('Starting AI SEO optimization');
    
    const marketResearch = context.previousOutputs?.['market-researcher'] as MarketResearchOutput;
    const audienceAnalysis = context.previousOutputs?.['audience-analyzer'] as AudienceAnalysisOutput;
    const contentStrategy = context.previousOutputs?.['content-strategist'] as ContentStrategyOutput;
    
    const prompt = this.buildPrompt(request, marketResearch, audienceAnalysis, contentStrategy);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.6
      });
      
      const result = this.parseResponse(response);
      this.logExecution('SEO optimization completed', { 
        primaryKeywords: result.keywordStrategy.primaryKeywords.length,
        metaTitle: result.onPageOptimization.metaTitle.length 
      });
      
      return result;
    } catch (error) {
      this.logExecution('SEO optimization failed', { error: error.message });
      throw new Error(`SEO optimization failed: ${error}`);
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    marketResearch?: MarketResearchOutput,
    audienceAnalysis?: AudienceAnalysisOutput,
    contentStrategy?: ContentStrategyOutput
  ): string {
    const marketContext = marketResearch ? `
Market Research Context:
- Industry: ${marketResearch.industry}
- Key Trends: ${marketResearch.trends.join(', ')}
- Competitors: ${marketResearch.competitors.join(', ')}
` : '';

    const audienceContext = audienceAnalysis ? `
Audience Context:
- Primary Persona: ${audienceAnalysis.primaryPersona.name}
- Pain Points: ${audienceAnalysis.primaryPersona.painPoints.join(', ')}
- Preferred Channels: ${audienceAnalysis.primaryPersona.preferredChannels.join(', ')}
` : '';

    const strategyContext = contentStrategy ? `
Content Strategy Context:
- Title: ${contentStrategy.outline.title}
- Primary Keywords: ${contentStrategy.seoStrategy.primaryKeywords.join(', ')}
- Meta Title: ${contentStrategy.seoStrategy.metaTitle}
- Meta Description: ${contentStrategy.seoStrategy.metaDescription}
- Content Sections: ${contentStrategy.outline.sections.map(s => s.heading).join(', ')}
` : '';

    const existingKeywords = request.keywords?.length ? `
Provided Keywords: ${request.keywords.join(', ')}
` : '';

    return `You are an advanced AI SEO specialist with expertise in both traditional and AI-powered search optimization.

Optimize the following content for maximum search visibility:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
${request.tone ? `- Tone: ${request.tone}` : ''}

${marketContext}
${audienceContext}
${strategyContext}
${existingKeywords}

Provide comprehensive SEO optimization including:

1. **Keyword Strategy**:
   - Primary keywords with search volume, difficulty, and intent analysis
   - Secondary and long-tail keywords
   - Semantic and LSI keywords
   - Keyword clustering for topical authority

2. **On-Page Optimization**:
   - Optimized meta title and description
   - Header tag structure (H1, H2, H3)
   - URL slug optimization
   - Keyword density recommendations
   - Internal linking suggestions
   - Schema markup recommendations

3. **Content Optimization**:
   - Title variations for A/B testing
   - Heading optimizations
   - Content gap analysis
   - Competitor analysis insights
   - Readability improvements

4. **AI Search Optimization**:
   - Answer engine optimization (Google, ChatGPT, Perplexity)
   - Featured snippet targeting
   - FAQ suggestions for AI queries
   - Voice search optimization
   - Entity and topical authority building

5. **Technical SEO**:
   - Crawlability recommendations
   - Page speed optimization
   - Core Web Vitals improvements
   - Mobile optimization

6. **Link Building Strategy**:
   - Target domains for outreach
   - Content assets for link attraction
   - Link-worthy angles

7. **Performance Tracking**:
   - Key metrics to monitor
   - Tracking setup recommendations
   - Success benchmarks

Format your response as a detailed JSON object with the following structure:
{
  "keywordStrategy": {
    "primaryKeywords": [
      {
        "keyword": "keyword phrase",
        "searchVolume": "volume estimate",
        "difficulty": "low/medium/high",
        "intent": "informational/commercial/transactional/navigational",
        "priority": "high/medium/low"
      }
    ],
    "secondaryKeywords": ["keyword 1", "keyword 2", ...],
    "longtailKeywords": ["longtail 1", "longtail 2", ...],
    "semanticKeywords": ["semantic 1", "semantic 2", ...],
    "lsiKeywords": ["lsi 1", "lsi 2", ...],
    "keywordClusters": [
      {
        "cluster": "cluster name",
        "keywords": ["keyword 1", "keyword 2", ...],
        "searchIntent": "intent description"
      }
    ]
  },
  "onPageOptimization": {
    "metaTitle": "optimized meta title",
    "metaDescription": "optimized meta description",
    "h1Tag": "optimized H1",
    "h2Tags": ["H2 tag 1", "H2 tag 2", ...],
    "h3Tags": ["H3 tag 1", "H3 tag 2", ...],
    "urlSlug": "optimized-url-slug",
    "focusKeyphrase": "primary focus keyword",
    "keywordDensity": {
      "target": 2.5,
      "primary": 2.0,
      "secondary": 1.5
    },
    "internalLinkingSuggestions": ["suggestion 1", "suggestion 2", ...],
    "imageAltTags": ["alt tag 1", "alt tag 2", ...],
    "schemaMarkup": {
      "type": "Article",
      "properties": {
        "headline": "article headline",
        "author": "author name",
        "datePublished": "publication date"
      }
    }
  },
  "contentOptimization": {
    "titleVariations": ["title 1", "title 2", ...],
    "headingOptimizations": [
      {
        "original": "original heading",
        "optimized": "optimized heading",
        "reasoning": "optimization reasoning"
      }
    ],
    "contentGaps": ["gap 1", "gap 2", ...],
    "competitorAnalysis": {
      "topCompetitors": ["competitor 1", "competitor 2", ...],
      "contentGaps": ["gap 1", "gap 2", ...],
      "opportunities": ["opportunity 1", "opportunity 2", ...]
    },
    "readabilityScore": 75,
    "readabilityRecommendations": ["recommendation 1", "recommendation 2", ...]
  },
  "aiSearchOptimization": {
    "answerEngineOptimization": {
      "featuredSnippetTargets": ["question 1", "question 2", ...],
      "faqSuggestions": [
        {
          "question": "FAQ question",
          "answer": "concise answer"
        }
      ],
      "conversationalQueries": ["query 1", "query 2", ...]
    },
    "voiceSearchOptimization": {
      "naturalLanguageQueries": ["query 1", "query 2", ...],
      "questionBasedContent": ["question 1", "question 2", ...],
      "localOptimization": ["local tip 1", "local tip 2", ...]
    },
    "entityOptimization": {
      "primaryEntities": ["entity 1", "entity 2", ...],
      "entityRelationships": ["relationship 1", "relationship 2", ...],
      "topicalAuthority": ["authority area 1", "authority area 2", ...]
    }
  },
  "technicalSEO": {
    "crawlability": ["recommendation 1", "recommendation 2", ...],
    "pagespeedRecommendations": ["speed tip 1", "speed tip 2", ...],
    "mobileOptimization": ["mobile tip 1", "mobile tip 2", ...],
    "coreWebVitals": {
      "lcpRecommendations": ["lcp tip 1", "lcp tip 2", ...],
      "fidRecommendations": ["fid tip 1", "fid tip 2", ...],
      "clsRecommendations": ["cls tip 1", "cls tip 2", ...]
    }
  },
  "linkBuildingStrategy": {
    "targetDomains": ["domain 1", "domain 2", ...],
    "outreachTemplates": ["template 1", "template 2", ...],
    "contentAssets": ["asset 1", "asset 2", ...],
    "linkWorthyAngles": ["angle 1", "angle 2", ...]
  },
  "performanceTracking": {
    "kpis": ["kpi 1", "kpi 2", ...],
    "trackingSetup": ["setup 1", "setup 2", ...],
    "reportingSchedule": "monthly",
    "successMetrics": [
      {
        "metric": "organic traffic",
        "target": "25% increase",
        "timeframe": "3 months"
      }
    ]
  }
}

Provide cutting-edge SEO optimization that works for both traditional and AI-powered search engines.`;
  }

  private parseResponse(response: string): SEOOptimizationOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'keywordStrategy', 'onPageOptimization', 'contentOptimization', 
        'aiSearchOptimization', 'technicalSEO', 'linkBuildingStrategy', 'performanceTracking'
      ]);

      // Ensure arrays exist
      if (!Array.isArray(parsed.keywordStrategy.primaryKeywords)) {
        parsed.keywordStrategy.primaryKeywords = [];
      }

      return this.sanitizeOutput(parsed) as SEOOptimizationOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): SEOOptimizationOutput {
    const extractedTitle = this.extractMetaTitle(response) || 'Optimized Content Title';
    const extractedKeywords = this.extractKeywordsList(response, 'keyword') || ['content marketing', 'strategy'];

    return {
      keywordStrategy: {
        primaryKeywords: extractedKeywords.slice(0, 3).map(keyword => ({
          keyword,
          searchVolume: 'Medium',
          difficulty: 'Medium',
          intent: 'informational' as const,
          priority: 'high' as const
        })),
        secondaryKeywords: extractedKeywords.slice(3, 8),
        longtailKeywords: [
          `how to ${extractedKeywords[0]}`,
          `best ${extractedKeywords[0]} strategies`,
          `${extractedKeywords[0]} guide for beginners`
        ],
        semanticKeywords: ['optimization', 'strategy', 'best practices', 'guide'],
        lsiKeywords: ['digital marketing', 'content creation', 'audience engagement'],
        keywordClusters: [
          {
            cluster: 'Primary Topic',
            keywords: extractedKeywords.slice(0, 3),
            searchIntent: 'Users seeking comprehensive information about the topic'
          }
        ]
      },
      onPageOptimization: {
        metaTitle: extractedTitle,
        metaDescription: `Discover the ultimate guide to ${extractedKeywords[0]}. Expert insights, proven strategies, and actionable tips for success.`,
        h1Tag: extractedTitle,
        h2Tags: [
          'Introduction to the Topic',
          'Key Strategies and Techniques',
          'Implementation Best Practices',
          'Common Challenges and Solutions',
          'Conclusion and Next Steps'
        ],
        h3Tags: [
          'Getting Started',
          'Advanced Techniques',
          'Tools and Resources',
          'Measuring Success'
        ],
        urlSlug: this.generateSlug(extractedTitle),
        focusKeyphrase: extractedKeywords[0],
        keywordDensity: {
          target: 2.5,
          primary: 2.0,
          secondary: 1.5
        },
        internalLinkingSuggestions: [
          'Link to related blog posts',
          'Link to product/service pages',
          'Link to resource pages',
          'Link to case studies'
        ],
        imageAltTags: [
          `${extractedKeywords[0]} infographic`,
          `${extractedKeywords[0]} diagram`,
          `${extractedKeywords[0]} example screenshot`
        ],
        schemaMarkup: {
          type: 'Article',
          properties: {
            headline: extractedTitle,
            author: 'Content Team',
            datePublished: new Date().toISOString()
          }
        }
      },
      contentOptimization: {
        titleVariations: [
          extractedTitle,
          `The Complete Guide to ${extractedKeywords[0]}`,
          `Master ${extractedKeywords[0]}: A Step-by-Step Guide`,
          `${extractedKeywords[0]} Strategies That Actually Work`
        ],
        headingOptimizations: [
          {
            original: 'Introduction',
            optimized: `Why ${extractedKeywords[0]} Matters in 2025`,
            reasoning: 'Includes target keyword and adds temporal relevance'
          }
        ],
        contentGaps: [
          'Industry-specific examples',
          'Step-by-step tutorials',
          'Common mistake prevention',
          'Tool recommendations'
        ],
        competitorAnalysis: {
          topCompetitors: ['Industry leader 1', 'Industry leader 2', 'Emerging competitor'],
          contentGaps: ['Advanced techniques', 'Recent updates', 'Case studies'],
          opportunities: ['Unique angle', 'Better examples', 'More comprehensive coverage']
        },
        readabilityScore: 75,
        readabilityRecommendations: [
          'Use shorter sentences',
          'Add more subheadings',
          'Include bullet points',
          'Simplify complex terms'
        ]
      },
      aiSearchOptimization: {
        answerEngineOptimization: {
          featuredSnippetTargets: [
            `What is ${extractedKeywords[0]}?`,
            `How to implement ${extractedKeywords[0]}?`,
            `Best practices for ${extractedKeywords[0]}`
          ],
          faqSuggestions: [
            {
              question: `What is ${extractedKeywords[0]}?`,
              answer: `${extractedKeywords[0]} is a strategic approach to creating and distributing valuable content to attract and engage your target audience.`
            },
            {
              question: `How long does ${extractedKeywords[0]} take to show results?`,
              answer: `Most businesses see initial results from ${extractedKeywords[0]} within 3-6 months, with significant improvements after 6-12 months of consistent effort.`
            }
          ],
          conversationalQueries: [
            `Tell me about ${extractedKeywords[0]}`,
            `How can I get better at ${extractedKeywords[0]}?`,
            `What are the benefits of ${extractedKeywords[0]}?`
          ]
        },
        voiceSearchOptimization: {
          naturalLanguageQueries: [
            `How do I start with ${extractedKeywords[0]}?`,
            `What are the best tools for ${extractedKeywords[0]}?`,
            `Why is ${extractedKeywords[0]} important for my business?`
          ],
          questionBasedContent: [
            `What is ${extractedKeywords[0]}?`,
            `How does ${extractedKeywords[0]} work?`,
            `When should I use ${extractedKeywords[0]}?`
          ],
          localOptimization: [
            'Include location-specific examples',
            'Mention local business applications',
            'Use region-specific case studies'
          ]
        },
        entityOptimization: {
          primaryEntities: [extractedKeywords[0], 'digital marketing', 'business strategy'],
          entityRelationships: [
            `${extractedKeywords[0]} → business growth`,
            `${extractedKeywords[0]} → customer engagement`,
            `${extractedKeywords[0]} → ROI improvement`
          ],
          topicalAuthority: [
            'Industry expertise',
            'Thought leadership',
            'Best practices',
            'Innovation trends'
          ]
        }
      },
      technicalSEO: {
        crawlability: [
          'Ensure clean URL structure',
          'Optimize internal linking',
          'Create XML sitemap',
          'Use proper robots.txt'
        ],
        pagespeedRecommendations: [
          'Optimize images',
          'Minimize CSS/JS',
          'Enable compression',
          'Use CDN'
        ],
        mobileOptimization: [
          'Responsive design',
          'Fast mobile loading',
          'Touch-friendly navigation',
          'Mobile-first indexing ready'
        ],
        coreWebVitals: {
          lcpRecommendations: ['Optimize largest contentful paint', 'Preload key resources'],
          fidRecommendations: ['Minimize JavaScript execution', 'Use efficient event handlers'],
          clsRecommendations: ['Reserve space for images', 'Avoid layout shifts']
        }
      },
      linkBuildingStrategy: {
        targetDomains: [
          'Industry publications',
          'Relevant blogs',
          'Resource pages',
          'Partner websites'
        ],
        outreachTemplates: [
          'Guest post proposal',
          'Resource page inclusion',
          'Broken link replacement',
          'Expert quote request'
        ],
        contentAssets: [
          'Comprehensive guides',
          'Industry research',
          'Infographics',
          'Tool resources'
        ],
        linkWorthyAngles: [
          'Original research data',
          'Unique industry insights',
          'Comprehensive resource compilation',
          'Expert interviews'
        ]
      },
      performanceTracking: {
        kpis: [
          'Organic traffic growth',
          'Keyword rankings',
          'Click-through rates',
          'Conversion rates',
          'Backlink acquisition'
        ],
        trackingSetup: [
          'Google Analytics 4',
          'Google Search Console',
          'Keyword tracking tools',
          'Backlink monitoring',
          'Core Web Vitals tracking'
        ],
        reportingSchedule: 'Monthly with weekly check-ins',
        successMetrics: [
          {
            metric: 'Organic traffic',
            target: '25% increase',
            timeframe: '3 months'
          },
          {
            metric: 'Target keyword rankings',
            target: 'Top 10 positions',
            timeframe: '6 months'
          },
          {
            metric: 'Featured snippets',
            target: '3 featured snippets',
            timeframe: '6 months'
          }
        ]
      }
    };
  }

  private extractMetaTitle(text: string): string | null {
    const patterns = [
      /meta\s*title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private extractKeywordsList(text: string, category: string): string[] {
    const pattern = new RegExp(`${category}s?[\"']?\\s*:\\s*\\[([^\\]]+)\\]`, 'i');
    const match = text.match(pattern);
    if (match) {
      return match[1].split(',').map(k => k.trim().replace(/[\"']/g, ''));
    }
    
    // Fallback to line-by-line extraction
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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}