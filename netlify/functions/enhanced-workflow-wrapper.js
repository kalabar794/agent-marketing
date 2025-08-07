// Simple JavaScript wrapper for the enhanced workflow
// This avoids TypeScript import issues in Netlify Functions

const Anthropic = require('@anthropic-ai/sdk');

class SimpleWorkflow {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateContent(request, progressCallback) {
    console.log('🚀 SimpleWorkflow: Starting content generation...');
    
    if (progressCallback) {
      progressCallback('orchestrator', 10, 'Starting content analysis...');
    }

    try {
      // Simple content generation using Claude directly
      const prompt = this.buildPrompt(request);
      
      if (progressCallback) {
        progressCallback('content-writer', 50, 'Generating content...');
      }

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (progressCallback) {
        progressCallback('content-writer', 90, 'Finalizing content...');
      }

      const content = message.content[0].text;
      
      const result = {
        title: this.extractTitle(content),
        content: content,
        metadata: {
          productType: request.productType,
          targetAudience: request.targetAudience,
          contentGoals: request.contentGoals,
          generatedAt: new Date().toISOString(),
          workflow: 'simple-fallback'
        }
      };

      if (progressCallback) {
        progressCallback('workflow', 100, 'Content generation completed');
      }

      console.log('✅ SimpleWorkflow: Content generation completed');
      return result;

    } catch (error) {
      console.error('❌ SimpleWorkflow error:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  buildPrompt(request) {
    return `You are a professional marketing content writer. Create compelling marketing content based on these requirements:

Product Type: ${request.productType || 'Software'}
Target Audience: ${request.targetAudience || 'General audience'}
Content Goals: ${request.contentGoals?.join(', ') || 'Brand awareness'}
Topic: ${request.topic || 'Product benefits'}
Tone: ${request.tone || 'Professional'}

Please create a comprehensive blog post that:
1. Has an engaging title
2. Addresses the target audience effectively
3. Achieves the specified content goals
4. Uses the appropriate tone
5. Is well-structured with clear sections
6. Includes actionable insights

Format the response as a complete blog post with title and content.`;
  }

  extractTitle(content) {
    // Simple title extraction - look for the first line or heading
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return trimmed.replace(/^[#\s]*/, '').substring(0, 100);
      }
    }
    return 'Generated Marketing Content';
  }
}

module.exports = { EnhancedWorkflow: SimpleWorkflow };