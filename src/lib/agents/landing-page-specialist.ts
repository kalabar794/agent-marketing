import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { ContentEditorOutput } from './content-editor';
import { AudienceAnalysisOutput } from './audience-analyzer';
import { ContentStrategyOutput } from './content-strategist';
import { SEOOptimizationOutput } from './ai-seo-optimizer';

export interface LandingPageSpecialistOutput {
  page_structure: {
    hero_section: {
      headline: string;
      subheadline: string;
      value_proposition: string;
      hero_image: {
        description: string;
        alt_text: string;
        style_guide: string;
      };
      cta_button: {
        text: string;
        color: string;
        placement: string;
        action: string;
      };
    };
    sections: Array<{
      type: 'benefits' | 'features' | 'testimonials' | 'faq' | 'pricing' | 'about' | 'contact';
      title: string;
      content: string;
      layout: string;
      visual_elements: string[];
      conversion_elements: string[];
    }>;
    footer: {
      content: string;
      links: string[];
      contact_info: string[];
      trust_signals: string[];
    };
  };
  conversion_optimization: {
    headline_variations: Array<{
      version: string;
      focus: string;
      emotional_trigger: string;
      urgency_level: 'low' | 'medium' | 'high';
    }>;
    cta_variations: Array<{
      text: string;
      style: string;
      placement: string;
      expected_conversion_lift: string;
    }>;
    trust_building: {
      social_proof: string[];
      credibility_indicators: string[];
      risk_reduction: string[];
      testimonial_strategy: string[];
    };
    urgency_scarcity: {
      time_based: string[];
      quantity_based: string[];
      exclusivity_based: string[];
      implementation_guide: string[];
    };
  };
  user_experience: {
    page_flow: {
      attention_sequence: string[];
      reading_pattern: string;
      interaction_points: string[];
      conversion_path: string[];
    };
    mobile_optimization: {
      responsive_design: string[];
      touch_targets: string[];
      loading_optimization: string[];
      mobile_specific_features: string[];
    };
    accessibility: {
      wcag_compliance: string[];
      screen_reader_optimization: string[];
      keyboard_navigation: string[];
      color_contrast: string[];
    };
    performance: {
      loading_speed: string[];
      core_web_vitals: string[];
      image_optimization: string[];
      script_optimization: string[];
    };
  };
  a_b_testing_strategy: {
    primary_tests: Array<{
      element: string;
      variations: string[];
      hypothesis: string;
      success_metric: string;
      test_duration: string;
    }>;
    secondary_tests: Array<{
      element: string;
      variations: string[];
      priority: 'high' | 'medium' | 'low';
    }>;
    testing_roadmap: {
      phase_1: string[];
      phase_2: string[];
      phase_3: string[];
      success_criteria: string[];
    };
  };
  analytics_tracking: {
    conversion_goals: Array<{
      name: string;
      type: 'macro' | 'micro';
      value: string;
      tracking_method: string;
    }>;
    heatmap_focus: string[];
    user_flow_tracking: string[];
    attribution_setup: string[];
  };
  technical_implementation: {
    page_speed: {
      optimization_checklist: string[];
      critical_resources: string[];
      lazy_loading: string[];
      caching_strategy: string[];
    };
    seo_technical: {
      meta_tags: Record<string, string>;
      structured_data: Record<string, any>;
      canonical_url: string;
      robots_directives: string[];
    };
    conversion_tracking: {
      google_analytics: string[];
      facebook_pixel: string[];
      custom_events: string[];
      goal_funnels: string[];
    };
  };
  content_recommendations: {
    headline_psychology: string[];
    copywriting_principles: string[];
    visual_hierarchy: string[];
    persuasion_techniques: string[];
  };
  media_recommendations: Array<{
    type: 'image' | 'video' | 'graphic' | 'icon';
    description: string;
    placement: string;
    specifications: Record<string, string>;
    purpose: string;
  }>;
}

export class LandingPageSpecialist extends BaseAgent {
  constructor() {
    super('Landing Page Specialist');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<LandingPageSpecialistOutput> {
    this.logExecution('Starting landing page optimization');
    
    const contentEditorOutput = context.previousOutputs?.['content-editor'] as ContentEditorOutput;
    const audienceAnalysis = context.previousOutputs?.['audience-analyzer'] as AudienceAnalysisOutput;
    const contentStrategy = context.previousOutputs?.['content-strategist'] as ContentStrategyOutput;
    const seoOptimization = context.previousOutputs?.['ai-seo-optimizer'] as SEOOptimizationOutput;
    
    if (!contentEditorOutput) {
      throw new Error('Content Editor output is required for landing page optimization');
    }
    
    const prompt = this.buildPrompt(request, contentEditorOutput, audienceAnalysis, contentStrategy, seoOptimization);
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 4000,
        temperature: 0.6
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Landing page optimization completed', { 
        sections: result.page_structure.sections.length,
        ctaVariations: result.conversion_optimization.cta_variations.length
      });
      
      return result;
    } catch (error) {
      this.logExecution('Landing page optimization failed', { error: error.message });
      throw new Error(`Landing page optimization failed: ${error}`);
    }
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    contentEditorOutput: ContentEditorOutput,
    audienceAnalysis?: AudienceAnalysisOutput,
    contentStrategy?: ContentStrategyOutput,
    seoOptimization?: SEOOptimizationOutput
  ): string {
    const sourceContent = JSON.stringify(contentEditorOutput.editedContent, null, 2);
    
    const audienceContext = audienceAnalysis ? `
Audience Insights:
- Primary Persona: ${audienceAnalysis.primaryPersona.name}
- Pain Points: ${audienceAnalysis.primaryPersona.painPoints.join(', ')}
- Goals: ${audienceAnalysis.primaryPersona.goals.join(', ')}
- Values: ${audienceAnalysis.primaryPersona.psychographics.values.join(', ')}
- Decision Factors: ${audienceAnalysis.recommendations.messagingStrategy.join(', ')}
` : '';

    const strategyContext = contentStrategy ? `
Content Strategy:
- Value Proposition: ${contentStrategy.strategy.valueProposition}
- Key Messages: ${contentStrategy.strategy.keyMessages.join(', ')}
- Call to Action: ${contentStrategy.strategy.callToAction}
- Differentiators: ${contentStrategy.strategy.differentiators.join(', ')}
- Benefits: ${contentStrategy.contentFramework.benefitsHighlight.join(', ')}
- Social Proof: ${contentStrategy.contentFramework.socialProof.join(', ')}
` : '';

    const seoContext = seoOptimization ? `
SEO Requirements:
- Primary Keywords: ${seoOptimization.keywordStrategy.primaryKeywords.map(k => k.keyword).join(', ')}
- Meta Title: ${seoOptimization.onPageOptimization.metaTitle}
- Meta Description: ${seoOptimization.onPageOptimization.metaDescription}
- H1 Tag: ${seoOptimization.onPageOptimization.h1Tag}
` : '';

    return `You are a landing page conversion specialist with expertise in high-converting page design and optimization.

Create a comprehensive landing page strategy for maximum conversion rates:

**Project Details:**
- Topic: ${request.topic}
- Target Audience: ${request.audience}
- Goals: ${request.goals}
- Content Type: ${request.contentType}
${request.tone ? `- Brand Tone: ${request.tone}` : ''}
${request.brandGuidelines ? `- Brand Guidelines: ${request.brandGuidelines}` : ''}

${audienceContext}
${strategyContext}
${seoContext}

**Source Content:**
${sourceContent}

Design a high-converting landing page including:

1. **Page Structure**:
   - Compelling hero section with clear value proposition
   - Strategic section layout for optimal conversion flow
   - Trust-building elements and social proof
   - Multiple conversion opportunities

2. **Conversion Optimization**:
   - Multiple headline and CTA variations for testing
   - Trust-building and credibility elements
   - Urgency and scarcity techniques
   - Objection handling and risk reduction

3. **User Experience**:
   - Optimal page flow and reading patterns
   - Mobile-first responsive design
   - Accessibility compliance
   - Performance optimization

4. **A/B Testing Strategy**:
   - Priority testing elements
   - Hypothesis-driven test variations
   - Phased testing roadmap
   - Success metrics and criteria

5. **Technical Implementation**:
   - SEO optimization requirements
   - Analytics and conversion tracking
   - Page speed optimization
   - Cross-browser compatibility

6. **Media Recommendations**:
   - Strategic visual elements
   - Image and video specifications
   - Conversion-focused design elements
   - Brand-compliant visual hierarchy

Format your response as a detailed JSON object:
{
  "page_structure": {
    "hero_section": {
      "headline": "compelling headline",
      "subheadline": "supporting subheadline",
      "value_proposition": "clear value proposition",
      "hero_image": {
        "description": "hero image description",
        "alt_text": "SEO-friendly alt text",
        "style_guide": "visual style requirements"
      },
      "cta_button": {
        "text": "action-oriented CTA",
        "color": "brand-aligned color",
        "placement": "optimal placement",
        "action": "conversion action"
      }
    },
    "sections": [
      {
        "type": "benefits",
        "title": "section title",
        "content": "section content",
        "layout": "layout description",
        "visual_elements": ["element 1", "element 2", ...],
        "conversion_elements": ["element 1", "element 2", ...]
      }
    ],
    "footer": {
      "content": "footer content",
      "links": ["link 1", "link 2", ...],
      "contact_info": ["info 1", "info 2", ...],
      "trust_signals": ["signal 1", "signal 2", ...]
    }
  },
  "conversion_optimization": {
    "headline_variations": [
      {
        "version": "headline version",
        "focus": "focus area",
        "emotional_trigger": "trigger type",
        "urgency_level": "medium"
      }
    ],
    "cta_variations": [
      {
        "text": "CTA text",
        "style": "button style",
        "placement": "placement location",
        "expected_conversion_lift": "lift percentage"
      }
    ],
    "trust_building": {
      "social_proof": ["proof 1", "proof 2", ...],
      "credibility_indicators": ["indicator 1", "indicator 2", ...],
      "risk_reduction": ["reduction 1", "reduction 2", ...],
      "testimonial_strategy": ["strategy 1", "strategy 2", ...]
    },
    "urgency_scarcity": {
      "time_based": ["time element 1", "time element 2", ...],
      "quantity_based": ["quantity element 1", "quantity element 2", ...],
      "exclusivity_based": ["exclusivity 1", "exclusivity 2", ...],
      "implementation_guide": ["guide 1", "guide 2", ...]
    }
  },
  "user_experience": {
    "page_flow": {
      "attention_sequence": ["step 1", "step 2", ...],
      "reading_pattern": "F-pattern or Z-pattern",
      "interaction_points": ["point 1", "point 2", ...],
      "conversion_path": ["path step 1", "path step 2", ...]
    },
    "mobile_optimization": {
      "responsive_design": ["requirement 1", "requirement 2", ...],
      "touch_targets": ["target 1", "target 2", ...],
      "loading_optimization": ["optimization 1", "optimization 2", ...],
      "mobile_specific_features": ["feature 1", "feature 2", ...]
    },
    "accessibility": {
      "wcag_compliance": ["compliance 1", "compliance 2", ...],
      "screen_reader_optimization": ["optimization 1", "optimization 2", ...],
      "keyboard_navigation": ["navigation 1", "navigation 2", ...],
      "color_contrast": ["contrast 1", "contrast 2", ...]
    },
    "performance": {
      "loading_speed": ["speed tip 1", "speed tip 2", ...],
      "core_web_vitals": ["vital 1", "vital 2", ...],
      "image_optimization": ["image tip 1", "image tip 2", ...],
      "script_optimization": ["script tip 1", "script tip 2", ...]
    }
  },
  "a_b_testing_strategy": {
    "primary_tests": [
      {
        "element": "headline",
        "variations": ["variation 1", "variation 2"],
        "hypothesis": "test hypothesis",
        "success_metric": "conversion rate",
        "test_duration": "2-4 weeks"
      }
    ],
    "secondary_tests": [
      {
        "element": "test element",
        "variations": ["variation 1", "variation 2"],
        "priority": "medium"
      }
    ],
    "testing_roadmap": {
      "phase_1": ["test 1", "test 2", ...],
      "phase_2": ["test 1", "test 2", ...],
      "phase_3": ["test 1", "test 2", ...],
      "success_criteria": ["criteria 1", "criteria 2", ...]
    }
  },
  "analytics_tracking": {
    "conversion_goals": [
      {
        "name": "primary conversion",
        "type": "macro",
        "value": "monetary or percentage",
        "tracking_method": "tracking setup"
      }
    ],
    "heatmap_focus": ["area 1", "area 2", ...],
    "user_flow_tracking": ["flow 1", "flow 2", ...],
    "attribution_setup": ["setup 1", "setup 2", ...]
  },
  "technical_implementation": {
    "page_speed": {
      "optimization_checklist": ["check 1", "check 2", ...],
      "critical_resources": ["resource 1", "resource 2", ...],
      "lazy_loading": ["element 1", "element 2", ...],
      "caching_strategy": ["strategy 1", "strategy 2", ...]
    },
    "seo_technical": {
      "meta_tags": {
        "title": "optimized title",
        "description": "optimized description"
      },
      "structured_data": {
        "type": "WebPage",
        "properties": {}
      },
      "canonical_url": "canonical URL",
      "robots_directives": ["directive 1", "directive 2", ...]
    },
    "conversion_tracking": {
      "google_analytics": ["setup 1", "setup 2", ...],
      "facebook_pixel": ["setup 1", "setup 2", ...],
      "custom_events": ["event 1", "event 2", ...],
      "goal_funnels": ["funnel 1", "funnel 2", ...]
    }
  },
  "content_recommendations": {
    "headline_psychology": ["principle 1", "principle 2", ...],
    "copywriting_principles": ["principle 1", "principle 2", ...],
    "visual_hierarchy": ["hierarchy 1", "hierarchy 2", ...],
    "persuasion_techniques": ["technique 1", "technique 2", ...]
  },
  "media_recommendations": [
    {
      "type": "image",
      "description": "media description",
      "placement": "placement location",
      "specifications": {
        "format": "WebP",
        "size": "1200x800",
        "optimization": "90% quality"
      },
      "purpose": "conversion purpose"
    }
  ]
}

Create a landing page strategy that maximizes conversions through psychology-driven design and data-backed optimization.`;
  }

  private parseResponse(response: string): LandingPageSpecialistOutput {
    try {
      const parsed = this.extractJSONFromResponse(response);
      
      // Validate required top-level fields
      this.validateRequiredFields(parsed, [
        'page_structure', 'conversion_optimization', 'user_experience', 
        'a_b_testing_strategy', 'analytics_tracking', 'technical_implementation',
        'content_recommendations', 'media_recommendations'
      ]);

      // Ensure arrays exist
      if (!Array.isArray(parsed.page_structure.sections)) {
        parsed.page_structure.sections = [];
      }

      if (!Array.isArray(parsed.media_recommendations)) {
        parsed.media_recommendations = [];
      }

      return this.sanitizeOutput(parsed) as LandingPageSpecialistOutput;
    } catch (error) {
      this.logExecution('JSON parsing failed, using fallback');
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): LandingPageSpecialistOutput {
    const extractedHeadline = this.extractHeadline(response) || 'Transform Your Business with Our Proven Solution';
    const extractedCTA = this.extractCTA(response) || 'Get Started Today';

    return {
      page_structure: {
        hero_section: {
          headline: extractedHeadline,
          subheadline: 'Discover the strategy that industry leaders use to achieve exceptional results',
          value_proposition: 'Get measurable results in 30 days or less with our proven system',
          hero_image: {
            description: 'Professional hero image showing success and transformation',
            alt_text: `${extractedHeadline} - Professional solution`,
            style_guide: 'Clean, modern design with brand colors and professional photography'
          },
          cta_button: {
            text: extractedCTA,
            color: 'Primary brand color (orange #FF6900)',
            placement: 'Above the fold, prominently displayed',
            action: 'Lead to conversion form or next step'
          }
        },
        sections: [
          {
            type: 'benefits',
            title: 'Why Choose Our Solution',
            content: 'Compelling benefits that address your target audience\'s main pain points and desires',
            layout: 'Three-column layout with icons and benefit statements',
            visual_elements: ['Benefit icons', 'Supporting graphics', 'Trust indicators'],
            conversion_elements: ['Social proof numbers', 'Benefit highlights', 'Risk reduction statements']
          },
          {
            type: 'features',
            title: 'How It Works',
            content: 'Simple 3-step process that shows exactly how to achieve desired results',
            layout: 'Step-by-step visual process with explanatory text',
            visual_elements: ['Process flow diagram', 'Feature screenshots', 'Interactive elements'],
            conversion_elements: ['Ease of use emphasis', 'Time-to-results messaging', 'Feature benefit connection']
          },
          {
            type: 'testimonials',
            title: 'Success Stories',
            content: 'Real customer testimonials and case studies demonstrating proven results',
            layout: 'Testimonial carousel with photos and detailed results',
            visual_elements: ['Customer photos', 'Results graphics', 'Company logos'],
            conversion_elements: ['Specific results metrics', 'Relatable customer stories', 'Authority endorsements']
          },
          {
            type: 'faq',
            title: 'Frequently Asked Questions',
            content: 'Address common objections and concerns to reduce friction',
            layout: 'Expandable FAQ sections with clear answers',
            visual_elements: ['Clean typography', 'Organized sections', 'Visual hierarchy'],
            conversion_elements: ['Objection handling', 'Risk reduction', 'Confidence building']
          }
        ],
        footer: {
          content: 'Professional footer with trust signals and additional conversion opportunities',
          links: ['Privacy Policy', 'Terms of Service', 'Contact Us', 'About Us'],
          contact_info: ['Phone number', 'Email address', 'Business address'],
          trust_signals: ['Security badges', 'Certifications', 'Awards', 'Money-back guarantee']
        }
      },
      conversion_optimization: {
        headline_variations: [
          {
            version: extractedHeadline,
            focus: 'benefit-focused',
            emotional_trigger: 'aspiration',
            urgency_level: 'medium'
          },
          {
            version: `Get Results Fast: ${extractedHeadline}`,
            focus: 'speed-focused',
            emotional_trigger: 'urgency',
            urgency_level: 'high'
          },
          {
            version: `Finally: A Solution That Actually Works`,
            focus: 'problem-focused',
            emotional_trigger: 'frustration relief',
            urgency_level: 'low'
          }
        ],
        cta_variations: [
          {
            text: extractedCTA,
            style: 'Primary button with strong contrast',
            placement: 'Hero section and multiple strategic locations',
            expected_conversion_lift: '15-25%'
          },
          {
            text: 'Start Your Transformation',
            style: 'Action-oriented with urgency',
            placement: 'After benefits section',
            expected_conversion_lift: '10-20%'
          },
          {
            text: 'Claim Your Solution Now',
            style: 'Exclusive and immediate',
            placement: 'After testimonials',
            expected_conversion_lift: '12-18%'
          }
        ],
        trust_building: {
          social_proof: ['Customer count', 'Success rate statistics', 'Years in business', 'Media mentions'],
          credibility_indicators: ['Industry certifications', 'Expert team credentials', 'Award recognitions', 'Client testimonials'],
          risk_reduction: ['Money-back guarantee', 'Free trial period', 'No long-term contracts', 'Secure payment processing'],
          testimonial_strategy: ['Video testimonials', 'Detailed case studies', 'Before/after results', 'Industry expert endorsements']
        },
        urgency_scarcity: {
          time_based: ['Limited-time pricing', 'Deadline for bonuses', 'Early bird discounts', 'Flash sale periods'],
          quantity_based: ['Limited spots available', 'Exclusive access', 'First come first served', 'Limited edition'],
          exclusivity_based: ['VIP member access', 'Invitation-only', 'Select client program', 'Premium tier benefits'],
          implementation_guide: ['Clear deadline communication', 'Visual countdown timers', 'Stock level indicators', 'Exclusive messaging']
        }
      },
      user_experience: {
        page_flow: {
          attention_sequence: ['Hero headline', 'Value proposition', 'Primary CTA', 'Benefits', 'Social proof', 'Secondary CTA'],
          reading_pattern: 'F-pattern with strategic CTA placement at natural reading stops',
          interaction_points: ['Hero CTA', 'Benefit exploration', 'Testimonial review', 'FAQ interaction', 'Final conversion'],
          conversion_path: ['Awareness', 'Interest building', 'Consideration', 'Trust validation', 'Action']
        },
        mobile_optimization: {
          responsive_design: ['Mobile-first approach', 'Touch-friendly buttons', 'Readable font sizes', 'Optimized images'],
          touch_targets: ['Minimum 44px buttons', 'Adequate spacing', 'Easy thumb navigation', 'Swipe-friendly elements'],
          loading_optimization: ['Compressed images', 'Minimal scripts', 'Progressive loading', 'Fast server response'],
          mobile_specific_features: ['Click-to-call buttons', 'Mobile-optimized forms', 'Thumb-friendly navigation', 'Fast checkout process']
        },
        accessibility: {
          wcag_compliance: ['Alt text for images', 'Keyboard navigation', 'Screen reader support', 'Color contrast ratios'],
          screen_reader_optimization: ['Semantic HTML', 'Proper heading structure', 'Descriptive link text', 'Form labels'],
          keyboard_navigation: ['Tab order optimization', 'Focus indicators', 'Skip navigation links', 'Keyboard shortcuts'],
          color_contrast: ['WCAG AA compliance', 'High contrast mode', 'Color-blind friendly', 'Text readability']
        },
        performance: {
          loading_speed: ['Page load under 3 seconds', 'Optimized images', 'Minified CSS/JS', 'CDN implementation'],
          core_web_vitals: ['LCP under 2.5s', 'FID under 100ms', 'CLS under 0.1', 'Performance monitoring'],
          image_optimization: ['WebP format', 'Lazy loading', 'Responsive images', 'Compression optimization'],
          script_optimization: ['Async loading', 'Critical path optimization', 'Third-party script management', 'Bundle optimization']
        }
      },
      a_b_testing_strategy: {
        primary_tests: [
          {
            element: 'headline',
            variations: ['Benefit-focused', 'Problem-focused', 'Outcome-focused'],
            hypothesis: 'Benefit-focused headlines will increase conversion by addressing desired outcomes',
            success_metric: 'conversion rate',
            test_duration: '2-4 weeks'
          },
          {
            element: 'hero_cta',
            variations: ['Get Started Today', 'Start Your Transformation', 'Claim Your Solution'],
            hypothesis: 'Action-oriented CTAs will outperform generic CTAs',
            success_metric: 'click-through rate',
            test_duration: '2-3 weeks'
          }
        ],
        secondary_tests: [
          {
            element: 'hero_image',
            variations: ['Product focused', 'People focused', 'Results focused'],
            priority: 'medium'
          },
          {
            element: 'testimonial_format',
            variations: ['Video testimonials', 'Written testimonials', 'Case study format'],
            priority: 'medium'
          }
        ],
        testing_roadmap: {
          phase_1: ['Headline optimization', 'Primary CTA testing', 'Hero section layout'],
          phase_2: ['Benefits section optimization', 'Social proof placement', 'Form optimization'],
          phase_3: ['Advanced personalization', 'Dynamic content', 'Behavioral triggers'],
          success_criteria: ['5%+ conversion rate improvement', 'Statistical significance', 'Sustained performance']
        }
      },
      analytics_tracking: {
        conversion_goals: [
          {
            name: 'primary_conversion',
            type: 'macro',
            value: 'Lead generation or sale completion',
            tracking_method: 'Google Analytics goal setup'
          },
          {
            name: 'email_signup',
            type: 'micro',
            value: 'Newsletter or lead magnet signup',
            tracking_method: 'Event tracking'
          }
        ],
        heatmap_focus: ['Hero section', 'CTA buttons', 'Benefits area', 'Testimonials section'],
        user_flow_tracking: ['Entry point analysis', 'Scroll depth tracking', 'Exit point identification', 'Conversion funnel analysis'],
        attribution_setup: ['UTM parameter tracking', 'Multi-touch attribution', 'Cross-device tracking', 'Channel performance analysis']
      },
      technical_implementation: {
        page_speed: {
          optimization_checklist: ['Image compression', 'Code minification', 'Server optimization', 'CDN setup'],
          critical_resources: ['Hero image', 'Primary CSS', 'Essential JavaScript', 'Font loading'],
          lazy_loading: ['Below-fold images', 'Testimonial videos', 'Non-critical content', 'Third-party widgets'],
          caching_strategy: ['Browser caching', 'Server-side caching', 'CDN caching', 'Database optimization']
        },
        seo_technical: {
          meta_tags: {
            title: extractedHeadline,
            description: 'Compelling meta description that includes primary keywords and value proposition',
            keywords: 'relevant, keywords, for, target, audience'
          },
          structured_data: {
            type: 'WebPage',
            properties: {
              name: extractedHeadline,
              description: 'Page description',
              url: 'page URL'
            }
          },
          canonical_url: 'https://domain.com/landing-page',
          robots_directives: ['index', 'follow', 'noimageindex']
        },
        conversion_tracking: {
          google_analytics: ['Goal setup', 'Enhanced ecommerce', 'Custom dimensions', 'Audience tracking'],
          facebook_pixel: ['Pixel installation', 'Custom events', 'Conversion tracking', 'Lookalike audiences'],
          custom_events: ['Form submissions', 'Button clicks', 'Video engagement', 'Scroll milestones'],
          goal_funnels: ['Awareness to interest', 'Interest to consideration', 'Consideration to conversion', 'Conversion to retention']
        }
      },
      content_recommendations: {
        headline_psychology: ['Benefit-driven messaging', 'Emotional triggers', 'Urgency creation', 'Specificity and numbers'],
        copywriting_principles: ['AIDA framework', 'Problem-solution fit', 'Features vs benefits', 'Social proof integration'],
        visual_hierarchy: ['F-pattern layout', 'Contrast for CTAs', 'White space usage', 'Progressive disclosure'],
        persuasion_techniques: ['Reciprocity', 'Social proof', 'Authority', 'Scarcity', 'Commitment consistency']
      },
      media_recommendations: [
        {
          type: 'image',
          description: 'Hero section background image showing success or transformation',
          placement: 'Hero section background or featured image',
          specifications: {
            format: 'WebP with JPG fallback',
            size: '1920x1080',
            optimization: '85% quality with compression'
          },
          purpose: 'Create immediate visual connection and support headline message'
        },
        {
          type: 'video',
          description: 'Customer testimonial video or product demonstration',
          placement: 'Testimonials section or above primary CTA',
          specifications: {
            format: 'MP4 H.264',
            duration: '60-90 seconds',
            resolution: '1080p'
          },
          purpose: 'Build trust and demonstrate social proof through authentic customer stories'
        },
        {
          type: 'graphic',
          description: 'Benefits icons and process flow illustrations',
          placement: 'Benefits and how-it-works sections',
          specifications: {
            format: 'SVG for scalability',
            style: 'Brand-consistent icons',
            colors: 'Brand palette'
          },
          purpose: 'Enhance visual communication and improve content scannability'
        }
      ]
    };
  }

  private extractHeadline(text: string): string | null {
    const patterns = [
      /headline[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /hero[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /title[\"']?\s*:\s*[\"']([^\"']+)[\"']/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private extractCTA(text: string): string | null {
    const patterns = [
      /cta[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /call\s*to\s*action[\"']?\s*:\s*[\"']([^\"']+)[\"']/i,
      /button[\"']?\s*:\s*[\"']([^\"']+)[\"']/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
}