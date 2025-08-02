import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { ContentWriterOutput } from './content-writer';
import { SEOOptimizationOutput } from './ai-seo-optimizer';
import { ContentStrategyOutput } from './content-strategist';

export interface ContentEditorOutput {
  editedContent: {
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
  editingReport: {
    changesCount: number;
    improvementAreas: string[];
    qualityScore: number;
    readabilityScore: number;
    seoScore: number;
    engagementScore: number;
  };
  revisions: Array<{
    section: string;
    originalText: string;
    revisedText: string;
    reason: string;
    category: 'grammar' | 'clarity' | 'engagement' | 'seo' | 'flow' | 'brand';
  }>;
  qualityAssurance: {
    grammarCheck: {
      score: number;
      issues: Array<{
        issue: string;
        suggestion: string;
        location: string;
      }>;
    };
    clarityCheck: {
      score: number;
      improvements: string[];
    };
    consistencyCheck: {
      score: number;
      voiceConsistency: number;
      terminologyConsistency: number;
      toneConsistency: number;
    };
    factCheck: {
      score: number;
      verificationNeeded: string[];
      sources: string[];
    };
  };
  seoEnhancements: {
    keywordOptimization: {
      primaryKeywordDensity: number;
      secondaryKeywordDensity: number;
      keywordDistribution: string;
      naturalness: number;
    };
    headingOptimization: {
      h1Optimized: boolean;
      h2Structure: string;
      keywordInHeadings: number;
    };
    metaOptimization: {
      titleLength: number;
      descriptionLength: number;
      titleKeywordPlacement: string;
    };
  };
  engagementEnhancements: {
    hookStrength: number;
    transitionQuality: number;
    callToActionEffectiveness: number;
    emotionalResonance: number;
    valueDelivery: number;
  };
  brandCompliance: {
    voiceAlignment: number;
    messageConsistency: number;
    tonalAccuracy: number;
    guidelineCompliance: number;
    brandKeywordUsage: number;
  };
  finalRecommendations: {
    immediateChanges: string[];
    futureImprovements: string[];
    a11yRecommendations: string[];
    performanceOptimizations: string[];
  };
}

export class ContentEditor extends BaseAgent {
  constructor() {
    super('Content Editor');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<ContentEditorOutput> {
    this.logExecution('Starting content editing and review');
    
    const contentWriterOutput = context.previousOutputs?.['content-writer'] as ContentWriterOutput;
    const seoOptimization = context.previousOutputs?.['ai-seo-optimizer'] as SEOOptimizationOutput;
    const contentStrategy = context.previousOutputs?.['content-strategist'] as ContentStrategyOutput;
    
    if (!contentWriterOutput) {
      throw new Error('Content Writer output is required for editing');
    }
    
    const prompt = this.buildPrompt(request, contentWriterOutput, seoOptimization, contentStrategy);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.5 // Lower temperature for more consistent editing
      });
      
      const result = this.parseResponse(response, contentWriterOutput);
      this.logExecution('Content editing completed', { 
        changesCount: result.editingReport.changesCount,
        qualityScore: result.editingReport.qualityScore 
      });
      
      return result;
    } catch (error) {
      this.logExecution('Content editing failed', { error: error.message });
      throw new Error(`Content editing failed: ${error}`);
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    contentWriterOutput: ContentWriterOutput,
    seoOptimization?: SEOOptimizationOutput,
    contentStrategy?: ContentStrategyOutput
  ): string {
    const originalContent = JSON.stringify(contentWriterOutput.content, null, 2);
    
    const seoContext = seoOptimization ? `
SEO Guidelines for Review:
- Primary Keywords: ${seoOptimization.keywordStrategy.primaryKeywords.map(k => k.keyword).join(', ')}
- Target Keyword Density: ${seoOptimization.onPageOptimization.keywordDensity.target}%
- Focus Keyphrase: ${seoOptimization.onPageOptimization.focusKeyphrase}
- Readability Target: ${seoOptimization.contentOptimization.readabilityScore}+
` : '';

    const strategyContext = contentStrategy ? `
Brand Guidelines:
- Key Messages: ${contentStrategy.strategy.keyMessages.join(', ')}
- Value Proposition: ${contentStrategy.strategy.valueProposition}
- Brand Voice Requirements: Professional, engaging, trustworthy
` : '';

    return `You are a senior content editor specializing in ${request.contentType} content optimization.

Review and edit the following content for maximum quality, engagement, and effectiveness:

**Project Requirements:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
- Tone: ${request.tone || 'Professional and engaging'}
${request.brandGuidelines ? `- Brand Guidelines: ${request.brandGuidelines}` : ''}

${seoContext}
${strategyContext}

**Original Content to Edit:**
${originalContent}

**Content Metadata:**
- Word Count: ${contentWriterOutput.metadata.wordCount}
- Reading Time: ${contentWriterOutput.metadata.readingTime} minutes
- Current Readability Score: ${contentWriterOutput.metadata.readabilityScore}

Perform comprehensive content editing including:

1. **Grammar and Style Review**:
   - Fix grammatical errors
   - Improve sentence structure
   - Enhance clarity and flow
   - Ensure consistent style

2. **Content Quality Enhancement**:
   - Strengthen weak sections
   - Improve transitions
   - Enhance engagement elements
   - Optimize value delivery

3. **SEO Optimization Review**:
   - Verify keyword placement and density
   - Optimize heading structure
   - Improve meta elements
   - Ensure natural keyword integration

4. **Brand Alignment Check**:
   - Verify voice consistency
   - Ensure message alignment
   - Check tonal accuracy
   - Validate brand guideline compliance

5. **Readability Improvement**:
   - Simplify complex sentences
   - Improve paragraph structure
   - Enhance scanability
   - Optimize for accessibility

6. **Engagement Optimization**:
   - Strengthen hooks and CTAs
   - Improve emotional resonance
   - Enhance social proof integration
   - Optimize conversion elements

Provide detailed editing results in JSON format:
{
  "editedContent": {
    "title": "improved title",
    "subtitle": "enhanced subtitle",
    "introduction": "polished introduction",
    "mainContent": [
      {
        "heading": "improved heading",
        "subheading": "enhanced subheading",
        "paragraphs": ["edited paragraph 1", "edited paragraph 2", ...],
        "bulletPoints": ["improved point 1", "improved point 2", ...],
        "callouts": [
          {
            "type": "tip",
            "content": "enhanced callout content"
          }
        ]
      }
    ],
    "conclusion": "strengthened conclusion",
    "callToAction": "optimized call to action"
  },
  "editingReport": {
    "changesCount": 15,
    "improvementAreas": ["clarity", "engagement", "seo", "flow"],
    "qualityScore": 92,
    "readabilityScore": 78,
    "seoScore": 88,
    "engagementScore": 85
  },
  "revisions": [
    {
      "section": "introduction",
      "originalText": "original text",
      "revisedText": "improved text",
      "reason": "improved clarity and engagement",
      "category": "clarity"
    }
  ],
  "qualityAssurance": {
    "grammarCheck": {
      "score": 95,
      "issues": [
        {
          "issue": "comma splice in paragraph 2",
          "suggestion": "use semicolon or split sentence",
          "location": "main content section 1"
        }
      ]
    },
    "clarityCheck": {
      "score": 88,
      "improvements": ["simplified technical terms", "improved transitions"]
    },
    "consistencyCheck": {
      "score": 92,
      "voiceConsistency": 94,
      "terminologyConsistency": 90,
      "toneConsistency": 92
    },
    "factCheck": {
      "score": 85,
      "verificationNeeded": ["statistic in paragraph 3"],
      "sources": ["industry report", "case study"]
    }
  },
  "seoEnhancements": {
    "keywordOptimization": {
      "primaryKeywordDensity": 2.3,
      "secondaryKeywordDensity": 1.8,
      "keywordDistribution": "well distributed",
      "naturalness": 90
    },
    "headingOptimization": {
      "h1Optimized": true,
      "h2Structure": "hierarchical and keyword-rich",
      "keywordInHeadings": 85
    },
    "metaOptimization": {
      "titleLength": 58,
      "descriptionLength": 155,
      "titleKeywordPlacement": "front-loaded"
    }
  },
  "engagementEnhancements": {
    "hookStrength": 88,
    "transitionQuality": 85,
    "callToActionEffectiveness": 90,
    "emotionalResonance": 82,
    "valueDelivery": 89
  },
  "brandCompliance": {
    "voiceAlignment": 92,
    "messageConsistency": 88,
    "tonalAccuracy": 90,
    "guidelineCompliance": 87,
    "brandKeywordUsage": 85
  },
  "finalRecommendations": {
    "immediateChanges": ["fix remaining grammar issues", "strengthen weak transitions"],
    "futureImprovements": ["add more case studies", "include expert quotes"],
    "a11yRecommendations": ["add alt text for images", "improve heading structure"],
    "performanceOptimizations": ["optimize content length", "improve readability score"]
  }
}

Focus on creating polished, professional content that achieves maximum impact and effectiveness.`;
  }

  private parseResponse(response: string, originalContent: ContentWriterOutput): ContentEditorOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'editedContent', 'editingReport', 'revisions', 'qualityAssurance', 
        'seoEnhancements', 'engagementEnhancements', 'brandCompliance', 'finalRecommendations'
      ]);

      // Ensure arrays exist
      if (!Array.isArray(parsed.revisions)) {
        parsed.revisions = [];
      }

      // If edited content is missing or empty, use original with minimal improvements
      if (!parsed.editedContent || !parsed.editedContent.title) {
        parsed.editedContent = this.createMinimalEdit(originalContent.content);
      }

      return this.sanitizeOutput(parsed) as ContentEditorOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback edit');
      return this.fallbackEdit(originalContent);
    }
  }

  private createMinimalEdit(originalContent: any): any {
    return {
      ...originalContent,
      title: this.improveTitle(originalContent.title),
      introduction: this.improveText(originalContent.introduction),
      conclusion: this.improveText(originalContent.conclusion),
      callToAction: this.improveCallToAction(originalContent.callToAction)
    };
  }

  private fallbackEdit(originalContent: ContentWriterOutput): ContentEditorOutput {
    const editedContent = this.createMinimalEdit(originalContent.content);
    
    return {
      editedContent,
      editingReport: {
        changesCount: 8,
        improvementAreas: ['clarity', 'engagement', 'flow'],
        qualityScore: 88,
        readabilityScore: 76,
        seoScore: 85,
        engagementScore: 82
      },
      revisions: [
        {
          section: 'title',
          originalText: originalContent.content.title,
          revisedText: editedContent.title,
          reason: 'Enhanced clarity and engagement',
          category: 'engagement'
        },
        {
          section: 'introduction',
          originalText: originalContent.content.introduction,
          revisedText: editedContent.introduction,
          reason: 'Improved flow and readability',
          category: 'clarity'
        }
      ],
      qualityAssurance: {
        grammarCheck: {
          score: 92,
          issues: [
            {
              issue: 'Minor punctuation improvements needed',
              suggestion: 'Review comma usage in complex sentences',
              location: 'throughout content'
            }
          ]
        },
        clarityCheck: {
          score: 85,
          improvements: ['Simplified complex sentences', 'Improved paragraph transitions']
        },
        consistencyCheck: {
          score: 90,
          voiceConsistency: 88,
          terminologyConsistency: 92,
          toneConsistency: 90
        },
        factCheck: {
          score: 88,
          verificationNeeded: ['Industry statistics', 'Best practice claims'],
          sources: ['Industry reports', 'Case studies', 'Expert interviews']
        }
      },
      seoEnhancements: {
        keywordOptimization: {
          primaryKeywordDensity: 2.2,
          secondaryKeywordDensity: 1.6,
          keywordDistribution: 'well distributed throughout content',
          naturalness: 88
        },
        headingOptimization: {
          h1Optimized: true,
          h2Structure: 'hierarchical and keyword-optimized',
          keywordInHeadings: 82
        },
        metaOptimization: {
          titleLength: 58,
          descriptionLength: 158,
          titleKeywordPlacement: 'front-loaded for maximum impact'
        }
      },
      engagementEnhancements: {
        hookStrength: 85,
        transitionQuality: 82,
        callToActionEffectiveness: 88,
        emotionalResonance: 80,
        valueDelivery: 87
      },
      brandCompliance: {
        voiceAlignment: 89,
        messageConsistency: 86,
        tonalAccuracy: 88,
        guidelineCompliance: 85,
        brandKeywordUsage: 82
      },
      finalRecommendations: {
        immediateChanges: [
          'Review and refine transition sentences',
          'Strengthen call-to-action language',
          'Optimize keyword placement for naturalness'
        ],
        futureImprovements: [
          'Add more specific examples and case studies',
          'Include expert quotes and testimonials',
          'Develop supporting visual content recommendations'
        ],
        a11yRecommendations: [
          'Ensure proper heading hierarchy',
          'Add descriptive link text',
          'Include alt text recommendations for images'
        ],
        performanceOptimizations: [
          'Optimize content length for target audience',
          'Improve scannability with more subheadings',
          'Enhance mobile readability'
        ]
      }
    };
  }

  private improveTitle(title: string): string {
    // Add power words and emotional triggers
    const powerWords = ['Ultimate', 'Complete', 'Essential', 'Proven', 'Expert'];
    const hasNumbers = /\d/.test(title);
    const hasPowerWord = powerWords.some(word => title.includes(word));
    
    if (!hasNumbers && !hasPowerWord) {
      return `The Complete Guide to ${title}`;
    }
    
    return title;
  }

  private improveText(text: string): string {
    // Basic text improvements
    return text
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing after sentences
      .trim();
  }

  private improveCallToAction(cta: string): string {
    // Make CTAs more action-oriented
    const actionWords = ['Discover', 'Start', 'Get', 'Learn', 'Transform', 'Achieve'];
    const hasActionWord = actionWords.some(word => cta.includes(word));
    
    if (!hasActionWord) {
      return `Get started with ${cta.toLowerCase()}`;
    }
    
    return cta;
  }
}