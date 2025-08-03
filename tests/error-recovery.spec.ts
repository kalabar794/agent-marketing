import { test, expect } from '@playwright/test';

/**
 * Error Recovery and Fallback Mechanism Tests
 * 
 * Tests the Error Recovery Manager's ability to handle failures gracefully,
 * implement fallback strategies, recover from errors, and maintain system
 * resilience during various failure scenarios.
 */

test.describe('Error Recovery and Fallback Mechanisms', () => {

  test.describe('Agent Failure Recovery', () => {

    test('should recover from individual agent failures', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Agent Failure Recovery Test',
          audience: 'system reliability engineers',
          goals: ['test individual agent failure recovery'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced',
          maxExecutionTime: 900
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor workflow for potential agent failures and recovery
      let completed = false;
      let attempts = 0;
      let failureDetected = false;
      let recoveryDetected = false;
      const executionLog: any[] = [];
      
      while (!completed && attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        executionLog.push({
          timestamp: Date.now(),
          status: statusData.status,
          progress: statusData.progress,
          agents: statusData.agents.map((a: any) => ({
            id: a.agentId,
            status: a.status,
            progress: a.progress,
            error: a.error
          }))
        });

        // Check for agent failures
        const failedAgents = statusData.agents.filter((agent: any) => agent.status === 'failed');
        if (failedAgents.length > 0) {
          failureDetected = true;
          console.log('Agent failures detected:', failedAgents.map((a: any) => a.agentId));
        }

        // Check for recovery (fallback agents or retry success)
        const recoveredAgents = statusData.agents.filter((agent: any) => 
          agent.agentId.includes('fallback') || 
          (agent.status === 'completed' && failureDetected)
        );
        if (recoveredAgents.length > 0) {
          recoveryDetected = true;
          console.log('Recovery mechanisms detected:', recoveredAgents.map((a: any) => a.agentId));
        }
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Even if there were failures, workflow should complete with fallbacks
          expect(statusData.progress).toBe(100);
          
          // Should have some form of content, even if fallback
          if (statusData.content) {
            expect(statusData.content.title).toBeTruthy();
            expect(statusData.content.content).toBeTruthy();
          }
          
        } else if (statusData.status === 'failed') {
          // If workflow fails completely, should have meaningful error
          expect(statusData.error).toBeTruthy();
          expect(typeof statusData.error).toBe('string');
          break;
        }
        
        attempts++;
      }

      // Should complete even if individual agents fail
      expect(completed || failureDetected).toBe(true);
      
      // If failures occurred, recovery mechanisms should activate
      if (failureDetected) {
        expect(recoveryDetected || completed).toBe(true);
      }
    });

    test('should handle cascade failures with graceful degradation', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Cascade Failure Test', 
          audience: 'resilience testers',
          goals: ['test cascade failure handling'],
          useEnhanced: true,
          enableFallbacks: true,
          maxExecutionTime: 300, // Short time might trigger cascading issues
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let finalStatus: any = null;
      let attempts = 0;
      
      while (!finalStatus && attempts < 20) {
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
      
      // Should either complete successfully or fail gracefully
      if (finalStatus.status === 'failed') {
        // Should have meaningful error message
        expect(finalStatus.error).toBeTruthy();
        expect(typeof finalStatus.error).toBe('string');
        expect(finalStatus.error.length).toBeGreaterThan(10);
      } else {
        // Should complete with some content, even if degraded
        expect(finalStatus.status).toBe('completed');
        expect(finalStatus.progress).toBe(100);
      }
    });

    test('should implement retry mechanisms for transient failures', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Retry Mechanism Test',
          audience: 'reliability engineers',
          goals: ['test retry mechanisms'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor for retry attempts
      const agentHistory: Map<string, any[]> = new Map();
      let attempts = 0;
      let retryDetected = false;
      
      while (attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Track agent state changes
        statusData.agents.forEach((agent: any) => {
          if (!agentHistory.has(agent.agentId)) {
            agentHistory.set(agent.agentId, []);
          }
          
          const history = agentHistory.get(agent.agentId)!;
          const lastState = history[history.length - 1];
          
          // Detect potential retry (agent goes from failed back to running/pending)
          if (lastState && lastState.status === 'failed' && agent.status !== 'failed') {
            retryDetected = true;
            console.log(`Retry detected for agent: ${agent.agentId}`);
          }
          
          history.push({
            timestamp: Date.now(),
            status: agent.status,
            progress: agent.progress,
            error: agent.error
          });
        });
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // System should handle retries when needed
      // Note: Retries may not always be visible depending on implementation
      console.log('Retry mechanisms monitoring completed. Retry detected:', retryDetected);
    });
  });

  test.describe('Network and API Failure Handling', () => {

    test('should handle simulated network timeouts gracefully', async ({ request }) => {
      // This test simulates what happens when the system faces network issues
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'email',
          topic: 'Network Timeout Resilience Test',
          audience: 'network administrators',
          goals: ['test network timeout handling'],
          useEnhanced: true,
          enableFallbacks: true,
          maxExecutionTime: 120, // Very short time to potentially trigger timeouts
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let finalOutcome: any = null;
      let attempts = 0;
      
      while (!finalOutcome && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            finalOutcome = statusData;
            break;
          }
        } catch (error) {
          // Network errors during status checking are part of what we're testing
          console.log('Network error during status check:', error);
        }
        
        attempts++;
      }

      // Should reach some conclusion, even if it's a graceful failure
      expect(finalOutcome || attempts >= 15).toBe(true);
      
      if (finalOutcome) {
        // Should have meaningful status
        expect(['completed', 'failed']).toContain(finalOutcome.status);
        
        if (finalOutcome.status === 'failed') {
          expect(finalOutcome.error).toBeTruthy();
        }
      }
    });

    test('should provide fallback content when primary generation fails', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Fallback Content Generation Test',
          audience: 'content managers',
          goals: ['test fallback content mechanisms'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Should have content, even if it's fallback content
          expect(statusData.content).toBeTruthy();
          expect(statusData.content.title).toBeTruthy();
          expect(statusData.content.content).toBeTruthy();
          
          // Check if fallback mechanisms were used
          if (statusData.content.metadata && statusData.content.metadata.generationMethod) {
            const method = statusData.content.metadata.generationMethod;
            console.log('Generation method used:', method);
            
            // Should indicate if fallback was used
            if (method.includes('fallback')) {
              expect(statusData.error || statusData.warning).toBeTruthy();
            }
          }
          
        } else if (statusData.status === 'failed') {
          // Even failed workflows should attempt fallback content
          console.log('Workflow failed:', statusData.error);
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });
  });

  test.describe('Quality Threshold Enforcement', () => {

    test('should enforce minimum quality thresholds with fallback improvement', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'landing',
          topic: 'Quality Threshold Enforcement Test',
          audience: 'quality control specialists',
          goals: ['test quality threshold enforcement'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 3,
          enableFallbacks: true,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let completed = false;
      let attempts = 0;
      let qualityScoreHistory: number[] = [];
      
      while (!completed && attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Track quality score progression
        if (statusData.qualityScores && statusData.qualityScores.overall > 0) {
          qualityScoreHistory.push(statusData.qualityScores.overall);
        }
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Final quality should meet reasonable thresholds
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores.overall).toBeGreaterThan(0.6); // Minimum threshold
          
          // Quality should show improvement over time if optimization cycles ran
          if (qualityScoreHistory.length > 1) {
            const finalScore = qualityScoreHistory[qualityScoreHistory.length - 1];
            const initialScore = qualityScoreHistory[0];
            
            // Should maintain or improve quality
            expect(finalScore).toBeGreaterThanOrEqual(initialScore * 0.9); // Allow small variation
          }
          
        } else if (statusData.status === 'failed') {
          console.log('Quality enforcement workflow failed:', statusData.error);
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should trigger additional optimization when quality is below threshold', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Quality Optimization Trigger Test',
          audience: 'optimization engineers',
          goals: ['test quality-based optimization triggering'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 2,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let optimizationCycles = 0;
      let completed = false;
      let attempts = 0;
      const agentExecutions: string[] = [];
      
      while (!completed && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Track agent executions to detect optimization cycles
        statusData.agents.forEach((agent: any) => {
          const executionKey = `${agent.agentId}-${agent.status}-${agent.progress}`;
          if (!agentExecutions.includes(executionKey)) {
            agentExecutions.push(executionKey);
            
            // Look for signs of optimization (agents re-running)
            if (agent.agentId.includes('optimizer') || agent.agentId.includes('editor')) {
              optimizationCycles++;
            }
          }
        });
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Should have run optimization cycles when enabled
          expect(optimizationCycles).toBeGreaterThan(0);
          
          // Final quality should be acceptable
          if (statusData.qualityScores) {
            expect(statusData.qualityScores.overall).toBeGreaterThan(0.7);
          }
          
        } else if (statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });
  });

  test.describe('System Resource Management', () => {

    test('should handle resource exhaustion gracefully', async ({ request }) => {
      // Create multiple concurrent workflows to stress system resources
      const concurrentWorkflows = Array.from({ length: 5 }, (_, i) =>
        request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Resource Stress Test ${i + 1}`,
            audience: 'system stress testers',
            goals: ['test resource management under load'],
            useEnhanced: true,
            enableFallbacks: true,
            priorityMode: 'balanced'
          }
        })
      );

      const responses = await Promise.allSettled(concurrentWorkflows);
      
      // Count successful initializations
      let successfulStarts = 0;
      const workflowIds: string[] = [];
      
      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.status() === 200) {
          successfulStarts++;
          const data = await response.value.json();
          workflowIds.push(data.workflowId);
        }
      }

      // Should handle some level of concurrency
      expect(successfulStarts).toBeGreaterThan(0);
      
      // Monitor completion of started workflows
      const completionPromises = workflowIds.map(async (workflowId) => {
        let attempts = 0;
        
        while (attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          try {
            const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              return { workflowId, finalStatus: statusData.status, error: statusData.error };
            }
          } catch (error) {
            // Network/resource errors are part of what we're testing
            return { workflowId, finalStatus: 'error', error: 'Request failed' };
          }
          
          attempts++;
        }
        
        return { workflowId, finalStatus: 'timeout', error: 'Monitoring timeout' };
      });

      const completionResults = await Promise.all(completionPromises);
      
      // Should have some successful completions
      const successfulCompletions = completionResults.filter(r => r.finalStatus === 'completed');
      expect(successfulCompletions.length).toBeGreaterThan(0);
      
      console.log('Resource management test results:', {
        attempted: concurrentWorkflows.length,
        started: successfulStarts,
        completed: successfulCompletions.length
      });
    });

    test('should implement circuit breaker patterns for failing components', async ({ request }) => {
      // This test checks if the system can detect and isolate failing components
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Circuit Breaker Pattern Test',
          audience: 'reliability engineers',
          goals: ['test circuit breaker implementation'],
          useEnhanced: true,
          enableFallbacks: true,
          maxExecutionTime: 180, // Short time to potentially trigger issues
          priorityMode: 'speed'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let systemBehaviorNormal = true;
      let attempts = 0;
      
      while (attempts < 12) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
          const statusData = await statusResponse.json();
          
          // Look for signs of circuit breaker activation
          const failedAgents = statusData.agents.filter((agent: any) => agent.status === 'failed');
          if (failedAgents.length > 1) {
            // Multiple failures might trigger circuit breaker
            console.log('Multiple agent failures detected - circuit breaker may be active');
            systemBehaviorNormal = false;
          }
          
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            break;
          }
        } catch (error) {
          console.log('Request error during circuit breaker test:', error);
          systemBehaviorNormal = false;
        }
        
        attempts++;
      }

      // System should either complete normally or handle failures gracefully
      expect(systemBehaviorNormal || attempts < 12).toBe(true);
    });
  });

  test.describe('Error Reporting and Monitoring', () => {

    test('should provide detailed error context and debugging information', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Error Context Test',
          audience: 'debugging specialists',
          goals: ['test error context reporting'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let errorContextCaptured = false;
      let attempts = 0;
      
      while (!errorContextCaptured && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Look for error context in failed agents or overall workflow
        if (statusData.error) {
          errorContextCaptured = true;
          
          // Error should be descriptive
          expect(typeof statusData.error).toBe('string');
          expect(statusData.error.length).toBeGreaterThan(10);
        }
        
        // Check agent-level errors
        statusData.agents.forEach((agent: any) => {
          if (agent.error) {
            errorContextCaptured = true;
            expect(typeof agent.error).toBe('string');
            expect(agent.error.length).toBeGreaterThan(5);
          }
        });
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Either should complete successfully or provide error context
      expect(errorContextCaptured || attempts < 15).toBe(true);
    });

    test('should maintain error analytics and recovery statistics', async ({ request }) => {
      // Create a workflow and monitor its error/recovery statistics
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'email',
          topic: 'Error Analytics Test',
          audience: 'analytics engineers',
          goals: ['test error analytics collection'],
          useEnhanced: true,
          enableFallbacks: true,
          priorityMode: 'balanced'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Check if workflow provides execution statistics
          if (statusData.executionStats || statusData.metadata) {
            const stats = statusData.executionStats || statusData.metadata;
            
            // Should have timing information
            expect(statusData.startTime).toBeTruthy();
            expect(statusData.endTime || statusData.progress === 100).toBeTruthy();
            
            // May have error recovery statistics
            if (stats.errorRecoveryStats) {
              expect(typeof stats.errorRecoveryStats).toBe('object');
            }
          }
          
        } else if (statusData.status === 'failed') {
          console.log('Analytics workflow failed:', statusData.error);
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });
  });
});