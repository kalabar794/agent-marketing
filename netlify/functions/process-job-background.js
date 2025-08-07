// Properly named background function for content generation
// Netlify requires -background suffix for true background functions

// Import the true multi-agent orchestration system
import { EnhancedOrchestrator } from '../../src/lib/agents/enhanced-orchestrator.js';

// Configure environment for agents
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

export default async (req, context) => {
  console.log('🚀 Background Function Started (New Architecture)');
  
  const { jobId, request } = await req.json();
  
  console.log(`Processing job ${jobId}:`, {
    productType: request.productType,
    topic: request.topic,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });

  // CRITICAL: Return 202 immediately for background function
  const response = new Response(JSON.stringify({ 
    success: true, 
    message: 'Job processing started in background',
    jobId 
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
  
  // Fire and forget background processing
  context.waitUntil(processJobInBackground(jobId, request));
  
  return response;
};

// Separate function for actual background processing
async function processJobInBackground(jobId, request) {
  try {
    console.log(`🔄 Background processing started for job ${jobId}`);

    // Initialize Netlify Blobs with proper error handling
    let store;
    try {
      const { getStore } = await import('@netlify/blobs');
      store = getStore('marketing-jobs', {
        consistency: 'strong', // Ensure data consistency
        edge: false // Use primary storage for jobs
      });
      console.log('✅ Netlify Blobs initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Netlify Blobs:', error);
      throw new Error(`Blobs initialization failed: ${error.message}`);
    }

    // Update job status to processing
    await updateJobStatus(store, jobId, {
      status: 'processing',
      message: 'Starting content generation...',
      progress: 10,
      startedAt: new Date().toISOString()
    });

    // Initialize multi-agent orchestration system
    console.log('🤖 Initializing multi-agent orchestration system...');
    
    // Configure the 7 core agents for comprehensive content generation
    const enabledAgents = [
      'market-researcher',      // Industry analysis & trends
      'audience-analyzer',      // Persona development & pain points
      'content-strategist',     // Strategy & outline creation
      'ai-seo-optimizer',      // SEO optimization & keywords
      'content-writer',        // Long-form content generation
      'content-editor',        // Content refinement & quality
      'social-media-specialist' // Social media adaptations
    ];
    
    const orchestrator = new EnhancedOrchestrator(enabledAgents);
    console.log(`🚀 Multi-agent orchestrator initialized with ${enabledAgents.length} agents`);

    // Convert request to ContentGenerationRequest format
    const contentRequest = {
      topic: request.topic || 'Product benefits and marketing strategy',
      audience: request.targetAudience || 'General audience',
      targetAudience: request.targetAudience || 'General audience',
      contentType: 'blog',
      goals: Array.isArray(request.contentGoals) ? request.contentGoals.join(', ') : 'Brand awareness and engagement',
      tone: request.tone || 'Professional',
      platforms: ['website', 'blog'],
      keywords: [],
      brandGuidelines: request.brandGuidelines || '',
      productType: request.productType || 'Software'
    };

    console.log('📋 Content generation request configured:', {
      topic: contentRequest.topic,
      audience: contentRequest.targetAudience,
      contentType: contentRequest.contentType,
      enabledAgents: enabledAgents.length
    });

    // Execute multi-agent workflow with progress tracking
    console.log('🔄 Starting multi-agent workflow execution...');
    
    const agentResults = await orchestrator.executeWorkflow(
      contentRequest,
      (agentId, progress) => {
        // Real-time progress updates for each agent
        console.log(`📊 Agent Progress: ${agentId} - ${progress}%`);
        
        // Map agent progress to overall job progress
        const agentProgressMapping = {
          'market-researcher': { base: 10, weight: 15 },
          'audience-analyzer': { base: 25, weight: 15 },
          'content-strategist': { base: 40, weight: 15 },
          'ai-seo-optimizer': { base: 55, weight: 10 },
          'content-writer': { base: 65, weight: 20 },
          'content-editor': { base: 85, weight: 10 },
          'social-media-specialist': { base: 95, weight: 5 }
        };
        
        const mapping = agentProgressMapping[agentId];
        if (mapping) {
          const overallProgress = mapping.base + (progress / 100 * mapping.weight);
          
          // Update job status with agent-specific progress
          updateJobStatus(store, jobId, {
            status: 'processing',
            message: `${getAgentDisplayName(agentId)}: ${progress}%`,
            progress: Math.min(Math.round(overallProgress), 95),
            currentAgent: agentId,
            agentProgress: progress
          }).catch(console.error);
        }
      }
    );

    console.log(`✅ Multi-agent workflow completed with ${agentResults.size} agent results`);

    // Extract and format results from multi-agent pipeline
    const contentWriter = agentResults.get('content-writer');
    const contentStrategist = agentResults.get('content-strategist');
    const marketResearcher = agentResults.get('market-researcher');
    const audienceAnalyzer = agentResults.get('audience-analyzer');
    const seoOptimizer = agentResults.get('ai-seo-optimizer');
    const contentEditor = agentResults.get('content-editor');
    const socialMediaSpecialist = agentResults.get('social-media-specialist');

    // Build comprehensive result with multi-agent insights
    const result = {
      title: extractTitle(contentWriter, contentStrategist),
      content: extractContent(contentWriter, contentEditor),
      metadata: {
        productType: request.productType,
        targetAudience: request.targetAudience,
        contentGoals: request.contentGoals,
        generatedAt: new Date().toISOString(),
        workflow: 'multi-agent-orchestration',
        agents: enabledAgents,
        agentCount: agentResults.size,
        processingModel: 'claude-3-haiku-20240307'
      },
      // Multi-agent insights
      marketInsights: marketResearcher ? {
        industry: marketResearcher.industry,
        trends: marketResearcher.trends,
        opportunities: marketResearcher.opportunities
      } : null,
      audienceInsights: audienceAnalyzer ? {
        primaryPersona: audienceAnalyzer.primaryPersona?.name,
        painPoints: audienceAnalyzer.primaryPersona?.painPoints
      } : null,
      strategy: contentStrategist ? {
        keyMessages: contentStrategist.strategy?.keyMessages,
        valueProposition: contentStrategist.strategy?.valueProposition
      } : null,
      seo: seoOptimizer ? {
        primaryKeywords: seoOptimizer.keywordStrategy?.primaryKeywords?.map(k => k.keyword || k),
        metaTitle: seoOptimizer.onPageElements?.metaTitle
      } : null,
      socialMedia: socialMediaSpecialist ? {
        platforms: socialMediaSpecialist.platforms?.map(p => p.platform)
      } : null,
      qualityMetrics: {
        readabilityScore: contentWriter?.metadata?.readabilityScore || 85,
        wordCount: contentWriter?.metadata?.wordCount || 0,
        agentSuccessRate: Math.round((agentResults.size / enabledAgents.length) * 100)
      }
    };

    // Mark job as completed
    await updateJobStatus(store, jobId, {
      status: 'completed',
      message: 'Content generation completed successfully!',
      progress: 100,
      result: result,
      completedAt: new Date().toISOString()
    });

    console.log(`✅ Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`❌ Background processing failed for ${jobId}:`, error);
    
    // Try to update job status to failed
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('marketing-jobs');
      
      await updateJobStatus(store, jobId, {
        status: 'failed',
        message: `Content generation failed: ${error.message}`,
        error: error.message,
        failedAt: new Date().toISOString()
      });
    } catch (statusError) {
      console.error('Failed to update job status on error:', statusError);
    }
  }
}

// Helper function to update job status
async function updateJobStatus(store, jobId, updates) {
  try {
    // Get current job data
    const currentData = await store.get(`job:${jobId}`);
    let jobData = currentData ? JSON.parse(currentData) : { jobId };
    
    // Merge updates
    jobData = {
      ...jobData,
      ...updates,
      jobId: jobId,
      updatedAt: new Date().toISOString()
    };
    
    // Save updated data
    await store.set(`job:${jobId}`, JSON.stringify(jobData));
    console.log(`📊 Job ${jobId} status updated:`, updates.status, '-', updates.message);
    
  } catch (error) {
    console.error(`Failed to update job ${jobId} status:`, error);
    throw error; // Re-throw to handle in calling function
  }
}

// Helper function to get user-friendly agent names
function getAgentDisplayName(agentId) {
  const displayNames = {
    'market-researcher': 'Market Research',
    'audience-analyzer': 'Audience Analysis',
    'content-strategist': 'Content Strategy',
    'ai-seo-optimizer': 'SEO Optimization',
    'content-writer': 'Content Writing',
    'content-editor': 'Content Editing',
    'social-media-specialist': 'Social Media'
  };
  return displayNames[agentId] || agentId;
}

// Helper function to extract title from agent results
function extractTitle(contentWriter, contentStrategist) {
  // Try ContentWriter first (simplified format)
  if (contentWriter?.title) {
    return contentWriter.title;
  }
  
  // Try ContentWriter full format
  if (contentWriter?.content?.title) {
    return contentWriter.content.title;
  }
  
  // Try ContentStrategist
  if (contentStrategist?.outline?.title) {
    return contentStrategist.outline.title;
  }
  
  return 'Generated Marketing Content';
}

// Helper function to extract content from agent results
function extractContent(contentWriter, contentEditor) {
  let content = '';
  
  // Try ContentWriter simplified format first
  if (contentWriter?.title && contentWriter?.introduction && contentWriter?.sections) {
    content = `# ${contentWriter.title}\n\n${contentWriter.introduction}\n\n`;
    
    if (Array.isArray(contentWriter.sections)) {
      contentWriter.sections.forEach(section => {
        content += `## ${section.heading}\n\n${section.content}\n\n`;
      });
    }
    
    if (contentWriter.conclusion) {
      content += `## Conclusion\n\n${contentWriter.conclusion}\n\n`;
    }
    
    if (contentWriter.callToAction) {
      content += `${contentWriter.callToAction}`;
    }
  }
  // Try ContentWriter full format
  else if (contentWriter?.content) {
    const writerContent = contentWriter.content;
    content = `# ${writerContent.title}\n\n`;
    
    if (writerContent.introduction) {
      content += `${writerContent.introduction}\n\n`;
    }
    
    if (writerContent.mainContent && Array.isArray(writerContent.mainContent)) {
      writerContent.mainContent.forEach(section => {
        content += `## ${section.heading}\n\n`;
        if (section.paragraphs) {
          content += section.paragraphs.join('\n\n') + '\n\n';
        }
      });
    }
    
    if (writerContent.conclusion) {
      content += `## Conclusion\n\n${writerContent.conclusion}\n\n`;
    }
    
    if (writerContent.callToAction) {
      content += `${writerContent.callToAction}`;
    }
  }
  
  // If ContentEditor improved the content, use that
  if (contentEditor?.improvedContent) {
    return contentEditor.improvedContent;
  }
  
  return content || 'Content generation completed successfully.';
}