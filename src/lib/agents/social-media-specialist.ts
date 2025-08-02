import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { ContentEditorOutput } from './content-editor';
import { AudienceAnalysisOutput } from './audience-analyzer';
import { ContentStrategyOutput } from './content-strategist';

export interface SocialMediaSpecialistOutput {
  platforms: Array<{
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'pinterest';
    content: {
      posts: Array<{
        type: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
        content: string;
        caption?: string;
        hashtags: string[];
        engagement_hooks: string[];
        call_to_action: string;
        optimal_timing: string;
        content_pillars: string[];
      }>;
      campaign_strategy: {
        posting_frequency: string;
        content_mix: Record<string, number>;
        engagement_strategy: string[];
        community_management: string[];
      };
    };
    platform_specific: {
      character_limits: Record<string, number>;
      optimal_formats: string[];
      trending_elements: string[];
      algorithm_optimization: string[];
      engagement_tactics: string[];
    };
    analytics_focus: {
      key_metrics: string[];
      tracking_setup: string[];
      success_benchmarks: Array<{
        metric: string;
        target: string;
        timeframe: string;
      }>;
    };
  }>;
  cross_platform_strategy: {
    unified_messaging: string[];
    content_repurposing: Array<{
      source_platform: string;
      target_platforms: string[];
      adaptation_strategy: string;
    }>;
    campaign_coordination: {
      launch_sequence: string[];
      timing_strategy: string;
      message_consistency: string[];
    };
  };
  influencer_collaboration: {
    target_influencers: Array<{
      platform: string;
      type: 'micro' | 'macro' | 'nano' | 'mega';
      audience_fit: string;
      collaboration_type: string;
      expected_reach: string;
    }>;
    collaboration_templates: string[];
    partnership_strategies: string[];
  };
  community_building: {
    engagement_strategies: string[];
    user_generated_content: string[];
    community_guidelines: string[];
    crisis_management: string[];
  };
  paid_promotion: {
    ad_copy_variations: Array<{
      platform: string;
      copy: string;
      target_audience: string;
      objective: string;
    }>;
    targeting_strategies: string[];
    budget_recommendations: Array<{
      platform: string;
      budget_range: string;
      expected_reach: string;
      recommended_duration: string;
    }>;
  };
  content_calendar: {
    weekly_schedule: Array<{
      day: string;
      platforms: string[];
      content_type: string;
      theme: string;
    }>;
    seasonal_campaigns: string[];
    trending_opportunities: string[];
  };
}

export class SocialMediaSpecialist extends BaseAgent {
  constructor() {
    super('Social Media Specialist');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<SocialMediaSpecialistOutput> {
    this.logExecution('Starting social media content adaptation');
    
    const contentEditorOutput = context.previousOutputs?.['content-editor'] as ContentEditorOutput;
    const audienceAnalysis = context.previousOutputs?.['audience-analyzer'] as AudienceAnalysisOutput;
    const contentStrategy = context.previousOutputs?.['content-strategist'] as ContentStrategyOutput;
    
    if (!contentEditorOutput) {
      throw new Error('Content Editor output is required for social media adaptation');
    }
    
    const targetPlatforms = this.determineTargetPlatforms(request, audienceAnalysis);
    const prompt = this.buildPrompt(request, contentEditorOutput, audienceAnalysis, contentStrategy, targetPlatforms);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.7
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Social media adaptation completed', { 
        platforms: result.platforms.length,
        totalPosts: result.platforms.reduce((sum, p) => sum + p.content.posts.length, 0)
      });
      
      return result;
    } catch (error) {
      this.logExecution('Social media adaptation failed', { error: error.message });
      throw new Error(`Social media adaptation failed: ${error}`);
    }
  }

  private determineTargetPlatforms(request: ContentGenerationRequest, audienceAnalysis?: AudienceAnalysisOutput): string[] {
    // Use provided platforms or determine from audience analysis
    if (request.platforms && request.platforms.length > 0) {
      return request.platforms;
    }
    
    if (audienceAnalysis) {
      const preferredChannels = audienceAnalysis.primaryPersona.preferredChannels;
      return preferredChannels.filter(channel => 
        ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'pinterest'].includes(channel.toLowerCase())
      );
    }
    
    // Default platforms based on content type
    switch (request.contentType) {
      case 'blog':
        return ['linkedin', 'twitter', 'facebook'];
      case 'social':
        return ['instagram', 'twitter', 'linkedin', 'facebook'];
      case 'landing':
        return ['facebook', 'linkedin', 'twitter'];
      default:
        return ['linkedin', 'twitter', 'facebook'];
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    contentEditorOutput: ContentEditorOutput,
    audienceAnalysis?: AudienceAnalysisOutput,
    contentStrategy?: ContentStrategyOutput,
    targetPlatforms: string[] = []
  ): string {
    const mainContent = JSON.stringify(contentEditorOutput.editedContent, null, 2);
    
    const audienceContext = audienceAnalysis ? `
Audience Context:
- Primary Persona: ${audienceAnalysis.primaryPersona.name}
- Interests: ${audienceAnalysis.primaryPersona.psychographics.interests.join(', ')}
- Preferred Channels: ${audienceAnalysis.primaryPersona.preferredChannels.join(', ')}
- Content Preferences: ${audienceAnalysis.primaryPersona.contentPreferences.join(', ')}
- Goals: ${audienceAnalysis.primaryPersona.goals.join(', ')}
- Pain Points: ${audienceAnalysis.primaryPersona.painPoints.join(', ')}
` : '';

    const strategyContext = contentStrategy ? `
Content Strategy Context:
- Key Messages: ${contentStrategy.strategy.keyMessages.join(', ')}
- Value Proposition: ${contentStrategy.strategy.valueProposition}
- Call to Action: ${contentStrategy.strategy.callToAction}
- Distribution Channels: ${contentStrategy.distributionPlan.primaryChannels.join(', ')}
` : '';

    return `You are a social media specialist with expertise in multi-platform content adaptation and viral marketing strategies.

Adapt the following content for social media platforms with maximum engagement and conversion potential:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
- Target Platforms: ${targetPlatforms.join(', ') || 'LinkedIn, Twitter, Facebook'}
${request.tone ? `- Brand Tone: ${request.tone}` : ''}

${audienceContext}
${strategyContext}

**Source Content to Adapt:**
${mainContent}

Create comprehensive social media content strategy including:

1. **Platform-Specific Content**:
   - Tailored posts for each platform
   - Optimal formats and lengths
   - Platform-native features utilization
   - Algorithm optimization strategies

2. **Engagement Optimization**:
   - Compelling hooks and captions
   - Strategic hashtag usage
   - Call-to-action optimization
   - Community engagement tactics

3. **Content Repurposing**:
   - Multi-format adaptations
   - Cross-platform synergies
   - Content multiplication strategies
   - Timing and sequencing

4. **Community Building**:
   - User-generated content strategies
   - Influencer collaboration opportunities
   - Community management guidelines
   - Crisis response protocols

5. **Paid Promotion Strategy**:
   - Ad copy variations
   - Targeting recommendations
   - Budget allocation
   - Campaign optimization

6. **Performance Tracking**:
   - Platform-specific metrics
   - Success benchmarks
   - Analytics setup
   - ROI measurement

Format your response as a detailed JSON object:
{
  "platforms": [
    {
      "platform": "linkedin",
      "content": {
        "posts": [
          {
            "type": "text",
            "content": "engaging post content",
            "caption": "compelling caption",
            "hashtags": ["#hashtag1", "#hashtag2", ...],
            "engagement_hooks": ["hook 1", "hook 2", ...],
            "call_to_action": "clear CTA",
            "optimal_timing": "Tuesday 9-10 AM",
            "content_pillars": ["education", "inspiration", ...]
          }
        ],
        "campaign_strategy": {
          "posting_frequency": "3-4 times per week",
          "content_mix": {
            "educational": 40,
            "promotional": 20,
            "engaging": 30,
            "curated": 10
          },
          "engagement_strategy": ["strategy 1", "strategy 2", ...],
          "community_management": ["guideline 1", "guideline 2", ...]
        }
      },
      "platform_specific": {
        "character_limits": {
          "post": 3000,
          "headline": 150
        },
        "optimal_formats": ["text posts", "articles", "videos"],
        "trending_elements": ["industry insights", "thought leadership"],
        "algorithm_optimization": ["tip 1", "tip 2", ...],
        "engagement_tactics": ["tactic 1", "tactic 2", ...]
      },
      "analytics_focus": {
        "key_metrics": ["impressions", "engagement rate", "click-through rate"],
        "tracking_setup": ["setup 1", "setup 2", ...],
        "success_benchmarks": [
          {
            "metric": "engagement rate",
            "target": "5%+",
            "timeframe": "30 days"
          }
        ]
      }
    }
  ],
  "cross_platform_strategy": {
    "unified_messaging": ["consistent brand voice", "cohesive narrative"],
    "content_repurposing": [
      {
        "source_platform": "blog",
        "target_platforms": ["linkedin", "twitter"],
        "adaptation_strategy": "break into bite-sized insights"
      }
    ],
    "campaign_coordination": {
      "launch_sequence": ["step 1", "step 2", ...],
      "timing_strategy": "staggered release across platforms",
      "message_consistency": ["consistent 1", "consistent 2", ...]
    }
  },
  "influencer_collaboration": {
    "target_influencers": [
      {
        "platform": "linkedin",
        "type": "micro",
        "audience_fit": "professional audience match",
        "collaboration_type": "content collaboration",
        "expected_reach": "10K-50K"
      }
    ],
    "collaboration_templates": ["template 1", "template 2", ...],
    "partnership_strategies": ["strategy 1", "strategy 2", ...]
  },
  "community_building": {
    "engagement_strategies": ["strategy 1", "strategy 2", ...],
    "user_generated_content": ["ugc idea 1", "ugc idea 2", ...],
    "community_guidelines": ["guideline 1", "guideline 2", ...],
    "crisis_management": ["response 1", "response 2", ...]
  },
  "paid_promotion": {
    "ad_copy_variations": [
      {
        "platform": "facebook",
        "copy": "compelling ad copy",
        "target_audience": "audience segment",
        "objective": "conversion"
      }
    ],
    "targeting_strategies": ["strategy 1", "strategy 2", ...],
    "budget_recommendations": [
      {
        "platform": "linkedin",
        "budget_range": "$500-1000/month",
        "expected_reach": "5K-15K",
        "recommended_duration": "4-6 weeks"
      }
    ]
  },
  "content_calendar": {
    "weekly_schedule": [
      {
        "day": "Monday",
        "platforms": ["linkedin"],
        "content_type": "educational",
        "theme": "industry insights"
      }
    ],
    "seasonal_campaigns": ["campaign 1", "campaign 2", ...],
    "trending_opportunities": ["trend 1", "trend 2", ...]
  }
}

Create viral-worthy social content that drives engagement, builds community, and achieves business objectives.`;
  }

  private parseResponse(response: string): SocialMediaSpecialistOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'platforms', 'cross_platform_strategy', 'influencer_collaboration', 
        'community_building', 'paid_promotion', 'content_calendar'
      ]);

      // Ensure platforms is an array
      if (!Array.isArray(parsed.platforms)) {
        parsed.platforms = [];
      }

      // If no platforms, create default ones
      if (parsed.platforms.length === 0) {
        parsed.platforms = this.createDefaultPlatforms();
      }

      return this.sanitizeOutput(parsed) as SocialMediaSpecialistOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private createDefaultPlatforms(): Array<any> {
    return [
      {
        platform: 'linkedin',
        content: {
          posts: [
            {
              type: 'text',
              content: 'Professional insight adapted from main content',
              hashtags: ['#industry', '#insights', '#leadership'],
              engagement_hooks: ['Did you know...', 'Here\'s what most people miss...'],
              call_to_action: 'What\'s your experience with this?',
              optimal_timing: 'Tuesday-Thursday 9-10 AM',
              content_pillars: ['education', 'thought leadership']
            }
          ],
          campaign_strategy: {
            posting_frequency: '3-4 times per week',
            content_mix: {
              educational: 40,
              promotional: 20,
              engaging: 30,
              curated: 10
            },
            engagement_strategy: ['Ask questions', 'Share insights', 'Engage with comments'],
            community_management: ['Respond within 2 hours', 'Share valuable resources']
          }
        },
        platform_specific: {
          character_limits: {
            post: 3000,
            headline: 150
          },
          optimal_formats: ['text posts', 'articles', 'videos', 'documents'],
          trending_elements: ['industry insights', 'career advice', 'business tips'],
          algorithm_optimization: ['Native video', 'Document posts', 'Engagement within first hour'],
          engagement_tactics: ['Industry hashtags', 'Professional storytelling', 'Data-driven insights']
        },
        analytics_focus: {
          key_metrics: ['impressions', 'engagement rate', 'click-through rate', 'profile views'],
          tracking_setup: ['LinkedIn Analytics', 'UTM parameters', 'Conversion tracking'],
          success_benchmarks: [
            {
              metric: 'engagement rate',
              target: '5%+',
              timeframe: '30 days'
            }
          ]
        }
      }
    ];
  }

  private fallbackParse(response: string): SocialMediaSpecialistOutput {
    return {
      platforms: [
        {
          platform: 'linkedin',
          content: {
            posts: [
              {
                type: 'text',
                content: this.extractSocialContent(response, 'linkedin') || 'Professional insights from our latest content. Key takeaways that every industry professional should know.',
                hashtags: this.extractHashtags(response) || ['#industry', '#insights', '#professional'],
                engagement_hooks: ['Did you know...', 'Here\'s what most people miss...'],
                call_to_action: 'What\'s your take on this?',
                optimal_timing: 'Tuesday-Thursday 9-10 AM',
                content_pillars: ['education', 'thought leadership']
              }
            ],
            campaign_strategy: {
              posting_frequency: '3-4 times per week',
              content_mix: {
                educational: 40,
                promotional: 20,
                engaging: 30,
                curated: 10
              },
              engagement_strategy: ['Ask thought-provoking questions', 'Share industry insights', 'Engage authentically'],
              community_management: ['Respond to comments promptly', 'Share valuable resources', 'Build relationships']
            }
          },
          platform_specific: {
            character_limits: {
              post: 3000,
              headline: 150
            },
            optimal_formats: ['Text posts', 'LinkedIn Articles', 'Native video', 'Document posts'],
            trending_elements: ['Industry analysis', 'Career development', 'Business strategy'],
            algorithm_optimization: ['Post during peak hours', 'Use native video', 'Encourage early engagement'],
            engagement_tactics: ['Industry-specific hashtags', 'Professional storytelling', 'Data-driven content']
          },
          analytics_focus: {
            key_metrics: ['Impressions', 'Engagement rate', 'Click-through rate', 'Profile views'],
            tracking_setup: ['LinkedIn Analytics', 'UTM tracking', 'Conversion pixels'],
            success_benchmarks: [
              {
                metric: 'engagement rate',
                target: '5%+',
                timeframe: '30 days'
              },
              {
                metric: 'click-through rate',
                target: '2%+',
                timeframe: '30 days'
              }
            ]
          }
        },
        {
          platform: 'twitter',
          content: {
            posts: [
              {
                type: 'text',
                content: this.extractSocialContent(response, 'twitter') || 'Quick insights from our latest research. Thread with actionable tips below 🧵',
                hashtags: this.extractHashtags(response) || ['#tips', '#insights', '#strategy'],
                engagement_hooks: ['🧵 THREAD:', 'Quick question:', 'Hot take:'],
                call_to_action: 'Retweet if you agree 👇',
                optimal_timing: 'Monday-Friday 9 AM, 1 PM, 3 PM',
                content_pillars: ['tips', 'insights', 'engagement']
              }
            ],
            campaign_strategy: {
              posting_frequency: '5-7 times per week',
              content_mix: {
                educational: 35,
                promotional: 15,
                engaging: 35,
                curated: 15
              },
              engagement_strategy: ['Use threads for complex topics', 'Engage in industry conversations', 'Share quick tips'],
              community_management: ['Respond quickly', 'Retweet relevant content', 'Join trending conversations']
            }
          },
          platform_specific: {
            character_limits: {
              post: 280,
              thread: 25
            },
            optimal_formats: ['Text tweets', 'Threads', 'Images', 'Videos'],
            trending_elements: ['Industry hashtags', 'Current events', 'Quick tips'],
            algorithm_optimization: ['Engage within first 15 minutes', 'Use trending hashtags', 'Encourage retweets'],
            engagement_tactics: ['Thread strategies', 'Quote tweets', 'Twitter polls']
          },
          analytics_focus: {
            key_metrics: ['Impressions', 'Engagement rate', 'Retweets', 'Profile clicks'],
            tracking_setup: ['Twitter Analytics', 'Link tracking', 'Hashtag monitoring'],
            success_benchmarks: [
              {
                metric: 'engagement rate',
                target: '3%+',
                timeframe: '30 days'
              }
            ]
          }
        }
      ],
      cross_platform_strategy: {
        unified_messaging: ['Consistent brand voice', 'Cohesive value proposition', 'Aligned key messages'],
        content_repurposing: [
          {
            source_platform: 'blog',
            target_platforms: ['linkedin', 'twitter', 'facebook'],
            adaptation_strategy: 'Break long-form content into platform-appropriate snippets and insights'
          }
        ],
        campaign_coordination: {
          launch_sequence: ['LinkedIn article first', 'Twitter thread follow-up', 'Facebook discussion post'],
          timing_strategy: 'Staggered release over 48 hours for maximum reach',
          message_consistency: ['Core value proposition', 'Key takeaways', 'Call-to-action alignment']
        }
      },
      influencer_collaboration: {
        target_influencers: [
          {
            platform: 'linkedin',
            type: 'micro',
            audience_fit: 'Industry professionals and decision makers',
            collaboration_type: 'Content collaboration and cross-promotion',
            expected_reach: '10K-50K qualified professionals'
          }
        ],
        collaboration_templates: [
          'Guest article exchange',
          'Expert quote inclusion',
          'Joint webinar promotion',
          'Resource sharing partnership'
        ],
        partnership_strategies: [
          'Value-first approach',
          'Mutual benefit focus',
          'Long-term relationship building',
          'Content co-creation'
        ]
      },
      community_building: {
        engagement_strategies: [
          'Regular community Q&A sessions',
          'Industry discussion facilitation',
          'User-generated content campaigns',
          'Expert AMAs and interviews'
        ],
        user_generated_content: [
          'Success story sharing',
          'Tips and tricks submissions',
          'Before/after transformations',
          'Community challenges'
        ],
        community_guidelines: [
          'Respectful professional discourse',
          'Value-driven contributions',
          'No spam or self-promotion',
          'Constructive feedback culture'
        ],
        crisis_management: [
          'Acknowledge concerns promptly',
          'Provide transparent communication',
          'Offer solutions and next steps',
          'Follow up on resolutions'
        ]
      },
      paid_promotion: {
        ad_copy_variations: [
          {
            platform: 'linkedin',
            copy: 'Discover the strategies top professionals use to achieve exceptional results',
            target_audience: 'Industry professionals and decision makers',
            objective: 'lead generation'
          },
          {
            platform: 'facebook',
            copy: 'Transform your approach with proven strategies that deliver real results',
            target_audience: 'Business owners and entrepreneurs',
            objective: 'website traffic'
          }
        ],
        targeting_strategies: [
          'Lookalike audiences based on current customers',
          'Interest-based targeting for industry professionals',
          'Behavioral targeting for content engagement',
          'Retargeting website visitors and content consumers'
        ],
        budget_recommendations: [
          {
            platform: 'linkedin',
            budget_range: '$500-1000/month',
            expected_reach: '5K-15K qualified professionals',
            recommended_duration: '4-6 weeks for optimization'
          },
          {
            platform: 'facebook',
            budget_range: '$300-700/month',
            expected_reach: '10K-30K targeted users',
            recommended_duration: '6-8 weeks for comprehensive testing'
          }
        ]
      },
      content_calendar: {
        weekly_schedule: [
          {
            day: 'Monday',
            platforms: ['linkedin'],
            content_type: 'educational',
            theme: 'industry insights and trends'
          },
          {
            day: 'Tuesday',
            platforms: ['twitter', 'linkedin'],
            content_type: 'tips',
            theme: 'actionable advice and quick wins'
          },
          {
            day: 'Wednesday',
            platforms: ['facebook', 'linkedin'],
            content_type: 'engaging',
            theme: 'discussion starters and community engagement'
          },
          {
            day: 'Thursday',
            platforms: ['twitter', 'linkedin'],
            content_type: 'promotional',
            theme: 'product/service highlights and case studies'
          },
          {
            day: 'Friday',
            platforms: ['linkedin', 'twitter'],
            content_type: 'curated',
            theme: 'industry news and thought leadership'
          }
        ],
        seasonal_campaigns: [
          'New Year goal-setting campaign',
          'Industry conference coverage',
          'End-of-quarter insights',
          'Holiday networking events'
        ],
        trending_opportunities: [
          'Industry event live-tweeting',
          'Trending hashtag participation',
          'Current events commentary',
          'Seasonal business topics'
        ]
      }
    };
  }

  private extractSocialContent(text: string, platform: string): string | null {
    const pattern = new RegExp(`${platform}[\\s\\S]*?content[\"']?\\s*:\\s*[\"']([^\"']+)[\"']`, 'i');
    const match = text.match(pattern);
    return match ? match[1] : null;
  }

  private extractHashtags(text: string): string[] {
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches && hashtagMatches.length > 0) {
      return hashtagMatches.slice(0, 5); // Limit to 5 hashtags
    }
    return [];
  }
}