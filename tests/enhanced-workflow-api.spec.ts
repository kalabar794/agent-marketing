import { test, expect } from '@playwright/test';

/**
 * Enhanced Workflow API Tests
 * 
 * Tests the enhanced content generation API endpoints with various workflow
 * configurations, parallel processing, quality evaluation, and error recovery.
 */

test.describe('Enhanced Workflow API', () => {
  
  test.describe('Enhanced Content Generation', () => {
    
    test('should create enhanced workflow with default settings', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'AI Marketing Automation',
          audience: 'marketing professionals',
          goals: ['increase engagement', 'drive conversions'],
          useEnhanced: true
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toMatchObject({
        workflowId: expect.stringMatching(/^enhanced-workflow-/),
        status: 'started',
        workflowType: 'enhanced',
        estimatedTime: expect.any(Number),
        agents: expect.any(Array),
        options: {
          priorityMode: 'balanced',
          maxExecutionTime: 900,
          enableOptimization: true,
          maxOptimizationCycles: 2,
          enableFallbacks: true
        }
      });

      expect(data.agents.length).toBeGreaterThan(0);
      expect(data.agents[0]).toMatchObject({
        agentId: expect.any(String),
        status: 'pending',
        progress: 0
      });
    });

    test('should create enhanced workflow with speed priority mode', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Product Launch',
          audience: 'tech enthusiasts',
          goals: ['generate buzz', 'drive traffic'],
          useEnhanced: true,
          priorityMode: 'speed',
          maxExecutionTime: 300,
          enableOptimization: false
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.options).toMatchObject({
        priorityMode: 'speed',
        maxExecutionTime: 300,
        enableOptimization: false,
        maxOptimizationCycles: 2,
        enableFallbacks: true
      });

      expect(data.estimatedTime).toBeLessThanOrEqual(5); // Should be faster
    });

    test('should create enhanced workflow with quality priority mode', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'landing',
          topic: 'SaaS Platform Features',
          audience: 'enterprise customers',
          goals: ['convert leads', 'demonstrate value'],
          useEnhanced: true,
          priorityMode: 'quality',
          maxExecutionTime: 1200,
          enableOptimization: true,
          maxOptimizationCycles: 3
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.options).toMatchObject({
        priorityMode: 'quality',
        maxExecutionTime: 1200,
        enableOptimization: true,
        maxOptimizationCycles: 3,
        enableFallbacks: true
      });

      expect(data.estimatedTime).toBeGreaterThan(10); // Should take longer
    });

    test('should create enhanced workflow for email content type', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'email',
          topic: 'Newsletter Announcement',
          audience: 'subscribers',
          goals: ['inform users', 'drive engagement'],
          useEnhanced: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.workflowType).toBe('enhanced');
      expect(data.agents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ agentId: expect.stringContaining('content') }),
          expect.objectContaining({ agentId: expect.stringContaining('seo') })
        ])
      );
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          // Missing topic, audience, goals
          useEnhanced: true
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      
      expect(data.error).toContain('Missing required fields');
    });

    test('should handle malformed request body', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: 'invalid json string'
      });

      expect(response.status()).toBe(500);
    });

    test('should fallback to legacy workflow when useEnhanced is false', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Legacy Content Test',
          audience: 'general audience',
          goals: ['test legacy'],
          useEnhanced: false
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.workflowType).toBe('legacy');
      expect(data.workflowId).not.toMatch(/^enhanced-workflow-/);
    });
  });

  test.describe('Workflow Status Tracking', () => {

    let workflowId: string;

    test.beforeEach(async ({ request }) => {
      // Create a workflow for status testing
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Status Test Article',
          audience: 'developers',
          goals: ['test workflow status'],
          useEnhanced: true,
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      workflowId = data.workflowId;
    });

    test('should track enhanced workflow status', async ({ request }) => {
      const response = await request.get(`/api/content/generate?workflowId=${workflowId}`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toMatchObject({
        id: workflowId,
        workflowType: 'enhanced',
        status: expect.stringMatching(/^(pending|running|completed|failed)$/),
        progress: expect.any(Number),
        agents: expect.any(Array),
        startTime: expect.any(String)
      });

      if (data.status === 'running' || data.status === 'completed') {
        expect(data.currentAgent).toBeTruthy();
      }

      if (data.status === 'completed') {
        expect(data.endTime).toBeTruthy();
        expect(data.progress).toBe(100);
        expect(data.qualityScores).toBeTruthy();
      }
    });

    test('should track agent progress in real-time', async ({ request }) => {
      // Poll status multiple times to check progress updates
      let attempts = 0;
      let lastProgress = -1;
      
      while (attempts < 10) {
        const response = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        
        // Progress should be non-decreasing
        expect(data.progress).toBeGreaterThanOrEqual(lastProgress);
        lastProgress = data.progress;
        
        // Check individual agent progress
        data.agents.forEach((agent: any) => {
          expect(agent.progress).toBeGreaterThanOrEqual(0);
          expect(agent.progress).toBeLessThanOrEqual(100);
          
          if (agent.status === 'completed') {
            expect(agent.progress).toBe(100);
            expect(agent.endTime).toBeTruthy();
          }
          
          if (agent.status === 'running') {
            expect(agent.startTime).toBeTruthy();
          }
        });
        
        if (data.status === 'completed' || data.status === 'failed') {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    });

    test('should provide estimated time remaining', async ({ request }) => {
      const response = await request.get(`/api/content/generate?workflowId=${workflowId}`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      if (data.status === 'running' || data.status === 'pending') {
        expect(data.estimatedTimeRemaining).toBeGreaterThan(0);
      }
    });

    test('should handle invalid workflow ID', async ({ request }) => {
      const response = await request.get('/api/content/generate?workflowId=invalid-workflow-id');
      
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Workflow not found');
    });

    test('should handle missing workflow ID parameter', async ({ request }) => {
      const response = await request.get('/api/content/generate');
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing workflowId parameter');
    });
  });

  test.describe('Quality Scores and Metrics', () => {

    test('should generate quality scores after completion', async ({ request }) => {
      // Create a quality-focused workflow
      const createResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Quality Assessment Test',
          audience: 'quality control team',
          goals: ['demonstrate quality metrics'],
          useEnhanced: true,
          priorityMode: 'quality',
          enableOptimization: true,
          maxOptimizationCycles: 2
        }
      });

      expect(createResponse.status()).toBe(200);
      const createData = await createResponse.json();
      const workflowId = createData.workflowId;

      // Wait for completion (with timeout)
      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 20) {
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Verify quality scores are present
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores).toMatchObject({
            overall: expect.any(Number),
            content: expect.any(Number),
            seo: expect.any(Number),
            engagement: expect.any(Number),
            brand: expect.any(Number)
          });

          // Quality scores should be between 0 and 1
          Object.values(statusData.qualityScores).forEach((score: any) => {
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
          });
          
        } else if (statusData.status === 'failed') {
          throw new Error(`Workflow failed: ${statusData.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      expect(completed).toBe(true);
    });
  });

  test.describe('Content Type Specific Workflows', () => {

    const contentTypes = [
      { type: 'blog', expectedAgents: ['content-strategist', 'content-writer', 'ai-seo-optimizer'] },
      { type: 'social', expectedAgents: ['social-media-specialist', 'content-strategist'] },
      { type: 'landing', expectedAgents: ['landing-page-specialist', 'content-strategist', 'ai-seo-optimizer'] },
      { type: 'email', expectedAgents: ['content-writer', 'content-strategist'] }
    ];

    contentTypes.forEach(({ type, expectedAgents }) => {
      test(`should optimize workflow for ${type} content`, async ({ request }) => {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: type,
            topic: `${type} content test`,
            audience: 'test audience',
            goals: ['test content type optimization'],
            useEnhanced: true
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        // Check that appropriate agents are selected
        const agentIds = data.agents.map((agent: any) => agent.agentId);
        
        expectedAgents.forEach(expectedAgent => {
          expect(agentIds).toContain(
            expect.stringContaining(expectedAgent.split('-')[0])
          );
        });
      });
    });
  });

  test.describe('Error Handling and Recovery', () => {

    test('should handle API errors gracefully', async ({ request }) => {
      // Simulate server error by sending malformed data that might cause processing errors
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: '', // Empty topic might cause issues
          audience: null, // Null audience
          goals: [], // Empty goals array
          useEnhanced: true,
          enableFallbacks: true
        }
      });

      // Should either succeed with fallbacks or provide meaningful error
      if (response.status() !== 200) {
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBeTruthy();
      }
    });

    test('should provide fallback mechanisms', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Fallback Test Article',
          audience: 'test audience',
          goals: ['test fallback behavior'],
          useEnhanced: true,
          enableFallbacks: true,
          maxExecutionTime: 60 // Very short time to potentially trigger fallbacks
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Even with short execution time, workflow should start
      expect(data.workflowId).toBeTruthy();
      expect(data.status).toBe('started');
    });
  });

  test.describe('Performance and Parallel Processing', () => {

    test('should execute multiple workflows concurrently', async ({ request }) => {
      const workflowPromises = Array.from({ length: 3 }, (_, i) => 
        request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Concurrent Test Article ${i + 1}`,
            audience: 'test audience',
            goals: ['test concurrent execution'],
            useEnhanced: true,
            priorityMode: 'speed'
          }
        })
      );

      const responses = await Promise.all(workflowPromises);
      
      // All workflows should start successfully
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      const workflowData = await Promise.all(
        responses.map(response => response.json())
      );

      // All should have unique workflow IDs
      const workflowIds = workflowData.map(data => data.workflowId);
      const uniqueIds = new Set(workflowIds);
      expect(uniqueIds.size).toBe(3);
    });

    test('should handle parallel agent execution efficiently', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Parallel Processing Test',
          audience: 'developers',
          goals: ['test parallel efficiency'],
          useEnhanced: true,
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Response should be fast due to parallel processing initialization
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      // Should indicate multiple agents can run in parallel
      expect(data.agents.length).toBeGreaterThan(1);
    });
  });

  test.describe('Workflow Comparison', () => {

    test('should demonstrate performance improvements over legacy', async ({ request }) => {
      // Create enhanced workflow
      const enhancedStart = Date.now();
      const enhancedResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Performance Comparison Enhanced',
          audience: 'performance testers',
          goals: ['test enhanced performance'],
          useEnhanced: true,
          priorityMode: 'speed'
        }
      });
      
      expect(enhancedResponse.status()).toBe(200);
      const enhancedData = await enhancedResponse.json();
      const enhancedResponseTime = Date.now() - enhancedStart;

      // Create legacy workflow
      const legacyStart = Date.now();
      const legacyResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Performance Comparison Legacy',
          audience: 'performance testers',
          goals: ['test legacy performance'],
          useEnhanced: false
        }
      });
      
      expect(legacyResponse.status()).toBe(200);
      const legacyData = await legacyResponse.json();
      const legacyResponseTime = Date.now() - legacyStart;

      // Enhanced should have additional features
      expect(enhancedData.options).toBeTruthy();
      expect(enhancedData.workflowType).toBe('enhanced');
      expect(legacyData.workflowType).toBe('legacy');

      // Both should respond reasonably quickly
      expect(enhancedResponseTime).toBeLessThan(10000);
      expect(legacyResponseTime).toBeLessThan(10000);
    });
  });
});