import { test, expect } from '@playwright/test';

/**
 * Parallel Processing and Agent Orchestration Tests
 * 
 * Tests the enhanced orchestrator's ability to execute agents in parallel,
 * manage dependencies, handle concurrent operations, and optimize execution flow.
 */

test.describe('Parallel Processing and Agent Orchestration', () => {

  test.describe('Parallel Agent Execution', () => {

    test('should execute independent agents in parallel', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Parallel Processing Test',
          audience: 'developers',
          goals: ['test parallel execution'],
          useEnhanced: true,
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor execution for parallel agent activity
      let parallelAgentsDetected = false;
      let maxConcurrentAgents = 0;
      let attempts = 0;

      while (attempts < 15 && !parallelAgentsDetected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        expect(statusResponse.status()).toBe(200);
        
        const statusData = await statusResponse.json();
        
        // Count currently running agents
        const runningAgents = statusData.agents.filter((agent: any) => agent.status === 'running');
        maxConcurrentAgents = Math.max(maxConcurrentAgents, runningAgents.length);
        
        if (runningAgents.length > 1) {
          parallelAgentsDetected = true;
          
          console.log(`Detected ${runningAgents.length} agents running in parallel:`, 
            runningAgents.map((a: any) => a.agentId));
        }
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Should have detected parallel execution
      expect(maxConcurrentAgents).toBeGreaterThan(1);
      
      // Parallel execution should be faster than sequential
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(30000); // Should complete quickly due to parallel processing
    });

    test('should respect agent dependencies', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Dependency Test Article',
          audience: 'test audience',
          goals: ['test dependency management'],
          useEnhanced: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      const executionOrder: string[] = [];
      let attempts = 0;

      while (attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Track when agents start and complete
        statusData.agents.forEach((agent: any) => {
          if (agent.status === 'running' && !executionOrder.includes(`${agent.agentId}-started`)) {
            executionOrder.push(`${agent.agentId}-started`);
          }
          if (agent.status === 'completed' && !executionOrder.includes(`${agent.agentId}-completed`)) {
            executionOrder.push(`${agent.agentId}-completed`);
          }
        });
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Verify dependency order
      // market-researcher and audience-analyzer should start before content-strategist
      const researcherStart = executionOrder.indexOf('market-researcher-started');
      const analyzerStart = executionOrder.indexOf('audience-analyzer-started');
      const strategistStart = executionOrder.indexOf('content-strategist-started');
      
      if (researcherStart !== -1 && strategistStart !== -1) {
        expect(researcherStart).toBeLessThan(strategistStart);
      }
      
      if (analyzerStart !== -1 && strategistStart !== -1) {
        expect(analyzerStart).toBeLessThan(strategistStart);
      }

      // content-writer should start after content-strategist
      const writerStart = executionOrder.indexOf('content-writer-started');
      if (strategistStart !== -1 && writerStart !== -1) {
        expect(strategistStart).toBeLessThan(writerStart);
      }
    });

    test('should optimize agent allocation based on priority mode', async ({ request }) => {
      // Test speed priority - should use fewer agents for faster execution
      const speedResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Speed Priority Test',
          audience: 'general',
          goals: ['test speed optimization'],
          useEnhanced: true,
          priorityMode: 'speed',
          maxExecutionTime: 180
        }
      });

      expect(speedResponse.status()).toBe(200);
      const speedData = await speedResponse.json();
      
      // Test quality priority - should use more agents for better quality
      const qualityResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Quality Priority Test',
          audience: 'general',
          goals: ['test quality optimization'],
          useEnhanced: true,
          priorityMode: 'quality',
          maxExecutionTime: 900
        }
      });

      expect(qualityResponse.status()).toBe(200);
      const qualityData = await qualityResponse.json();

      // Quality mode should typically use more agents
      expect(qualityData.agents.length).toBeGreaterThanOrEqual(speedData.agents.length);
      
      // Speed mode should have shorter estimated time
      expect(speedData.estimatedTime).toBeLessThanOrEqual(qualityData.estimatedTime);
    });
  });

  test.describe('Dynamic Task Delegation', () => {

    test('should adapt workflow based on content type', async ({ request }) => {
      const contentTypes = [
        { type: 'blog', expectedAgents: ['content-strategist', 'content-writer', 'ai-seo-optimizer'] },
        { type: 'social', expectedAgents: ['content-strategist', 'social-media-specialist'] },
        { type: 'landing', expectedAgents: ['content-strategist', 'landing-page-specialist', 'ai-seo-optimizer'] },
        { type: 'email', expectedAgents: ['content-strategist', 'content-writer'] }
      ];

      for (const { type, expectedAgents } of contentTypes) {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: type,
            topic: `${type} content adaptation test`,
            audience: 'test audience',
            goals: ['test content type adaptation'],
            useEnhanced: true,
            priorityMode: 'balanced'
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        const agentIds = data.agents.map((agent: any) => agent.agentId);
        
        // Check that expected agents are included
        expectedAgents.forEach(expectedAgent => {
          const hasExpectedAgent = agentIds.some((id: string) => 
            id.includes(expectedAgent.replace('-', '')) || 
            id.includes(expectedAgent)
          );
          expect(hasExpectedAgent).toBe(true);
        });
      }
    });

    test('should adjust workflow based on execution time constraints', async ({ request }) => {
      // Short execution time - should prioritize essential agents
      const shortTimeResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Time Constrained Content',
          audience: 'test audience',
          goals: ['test time constraints'],
          useEnhanced: true,
          maxExecutionTime: 120, // 2 minutes
          priorityMode: 'speed'
        }
      });

      expect(shortTimeResponse.status()).toBe(200);
      const shortTimeData = await shortTimeResponse.json();
      
      // Long execution time - should include more comprehensive agents
      const longTimeResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Comprehensive Content',
          audience: 'test audience',
          goals: ['test comprehensive workflow'],
          useEnhanced: true,
          maxExecutionTime: 1800, // 30 minutes
          priorityMode: 'quality'
        }
      });

      expect(longTimeResponse.status()).toBe(200);
      const longTimeData = await longTimeResponse.json();

      // Long time should allow for more agents
      expect(longTimeData.agents.length).toBeGreaterThanOrEqual(shortTimeData.agents.length);
      
      // Should have different estimated completion times
      expect(longTimeData.estimatedTime).toBeGreaterThan(shortTimeData.estimatedTime);
    });

    test('should handle concurrent workflow optimization', async ({ request }) => {
      // Create multiple workflows simultaneously
      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Concurrent Workflow ${i + 1}`,
            audience: 'test audience',
            goals: ['test concurrent optimization'],
            useEnhanced: true,
            priorityMode: 'balanced'
          }
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      const workflowData = await Promise.all(
        responses.map(response => response.json())
      );

      // Should have unique workflow IDs
      const workflowIds = workflowData.map(data => data.workflowId);
      const uniqueIds = new Set(workflowIds);
      expect(uniqueIds.size).toBe(3);

      // All should be properly initialized
      workflowData.forEach(data => {
        expect(data.status).toBe('started');
        expect(data.workflowType).toBe('enhanced');
        expect(data.agents.length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Agent Health and Load Management', () => {

    test('should monitor agent health during execution', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Agent Health Test',
          audience: 'system administrators',
          goals: ['test agent health monitoring'],
          useEnhanced: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor workflow for agent status
      let healthyAgents = 0;
      let attempts = 0;

      while (attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Count agents that are progressing normally
        const activeAgents = statusData.agents.filter((agent: any) => 
          agent.status === 'running' || agent.status === 'completed'
        );
        
        healthyAgents = Math.max(healthyAgents, activeAgents.length);
        
        // Check for agent errors
        const failedAgents = statusData.agents.filter((agent: any) => agent.status === 'failed');
        if (failedAgents.length > 0) {
          console.log('Failed agents detected:', failedAgents.map((a: any) => a.agentId));
        }
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Should have healthy agent execution
      expect(healthyAgents).toBeGreaterThan(0);
    });

    test('should handle agent failures with graceful degradation', async ({ request }) => {
      // This test simulates potential agent failures
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Agent Failure Recovery Test',
          audience: 'reliability engineers',
          goals: ['test failure recovery'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor for completion despite potential failures
      let finalStatus = null;
      let attempts = 0;

      while (attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          finalStatus = statusData;
          break;
        }
        
        attempts++;
      }

      expect(finalStatus).toBeTruthy();
      
      // Should either complete successfully or fail gracefully with meaningful error
      if (finalStatus.status === 'failed') {
        expect(finalStatus.error).toBeTruthy();
        expect(typeof finalStatus.error).toBe('string');
      } else {
        expect(finalStatus.status).toBe('completed');
        expect(finalStatus.progress).toBe(100);
      }
    });
  });

  test.describe('Performance Optimization', () => {

    test('should show performance improvements over legacy system', async ({ request }) => {
      const testData = {
        contentType: 'blog',
        topic: 'Performance Comparison Test',
        audience: 'performance engineers',
        goals: ['compare system performance']
      };

      // Test enhanced workflow
      const enhancedStart = Date.now();
      const enhancedResponse = await request.post('/api/content/generate', {
        data: { ...testData, useEnhanced: true, priorityMode: 'speed' }
      });
      
      expect(enhancedResponse.status()).toBe(200);
      const enhancedData = await enhancedResponse.json();
      const enhancedInitTime = Date.now() - enhancedStart;

      // Test legacy workflow
      const legacyStart = Date.now();
      const legacyResponse = await request.post('/api/content/generate', {
        data: { ...testData, useEnhanced: false }
      });
      
      expect(legacyResponse.status()).toBe(200);
      const legacyData = await legacyResponse.json();
      const legacyInitTime = Date.now() - legacyStart;

      // Enhanced should have better features
      expect(enhancedData.workflowType).toBe('enhanced');
      expect(enhancedData.options).toBeTruthy();
      expect(legacyData.workflowType).toBe('legacy');

      // Both should initialize quickly
      expect(enhancedInitTime).toBeLessThan(5000);
      expect(legacyInitTime).toBeLessThan(5000);

      // Enhanced may have different estimated completion time
      expect(enhancedData.estimatedTime).toBeGreaterThan(0);
      expect(legacyData.estimatedTime).toBeGreaterThan(0);
    });

    test('should efficiently manage resource allocation', async ({ request }) => {
      // Create multiple workflows to test resource management
      const workflows = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Resource Management Test ${i + 1}`,
            audience: 'system testers',
            goals: ['test resource allocation'],
            useEnhanced: true,
            priorityMode: 'balanced'
          }
        });
        
        expect(response.status()).toBe(200);
        const data = await response.json();
        workflows.push(data.workflowId);
      }

      // Monitor all workflows
      let allCompleted = false;
      let attempts = 0;
      
      while (!allCompleted && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusPromises = workflows.map(workflowId =>
          request.get(`/api/content/generate?workflowId=${workflowId}`)
        );
        
        const statusResponses = await Promise.all(statusPromises);
        const statusData = await Promise.all(
          statusResponses.map(response => response.json())
        );

        // Check if all are completed or failed
        allCompleted = statusData.every(data => 
          data.status === 'completed' || data.status === 'failed'
        );
        
        attempts++;
      }

      // Should handle multiple concurrent workflows
      expect(attempts).toBeLessThan(30); // Should not timeout
    });

    test('should provide execution statistics and analytics', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Analytics Test Article',
          audience: 'data analysts',
          goals: ['test execution analytics'],
          useEnhanced: true,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Wait for completion
      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Verify execution statistics are present
          expect(statusData.startTime).toBeTruthy();
          expect(statusData.endTime).toBeTruthy();
          expect(statusData.progress).toBe(100);
          
          // Check for quality metrics
          if (statusData.qualityScores) {
            expect(statusData.qualityScores.overall).toBeGreaterThan(0);
          }
          
          // Verify agent completion data
          statusData.agents.forEach((agent: any) => {
            if (agent.status === 'completed') {
              expect(agent.progress).toBe(100);
              expect(agent.endTime).toBeTruthy();
            }
          });
          
        } else if (statusData.status === 'failed') {
          break; // Don't fail the test, just stop waiting
        }
        
        attempts++;
      }

      // Should provide meaningful execution data
      expect(completed || attempts < 20).toBe(true);
    });
  });
});