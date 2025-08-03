import { test, expect } from '@playwright/test';

/**
 * Quality Evaluation and Optimization Tests
 * 
 * Tests the Evaluator-Optimizer component's ability to assess content quality,
 * perform optimization cycles, generate quality reports, and improve content
 * through iterative refinement.
 */

test.describe('Quality Evaluation and Optimization', () => {

  test.describe('Quality Assessment API', () => {

    test('should evaluate content quality with comprehensive metrics', async ({ request }) => {
      // First create a workflow to evaluate
      const createResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Quality Evaluation Test Article',
          audience: 'quality assurance professionals',
          goals: ['demonstrate quality assessment capabilities'],
          useEnhanced: true,
          priorityMode: 'quality',
          enableOptimization: true,
          maxOptimizationCycles: 2
        }
      });

      expect(createResponse.status()).toBe(200);
      const createData = await createResponse.json();
      const workflowId = createData.workflowId;

      // Wait for workflow completion
      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Check quality scores are present and valid
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores).toMatchObject({
            overall: expect.any(Number),
            content: expect.any(Number),
            seo: expect.any(Number),
            engagement: expect.any(Number),
            brand: expect.any(Number)
          });

          // All quality scores should be between 0 and 1
          Object.values(statusData.qualityScores).forEach((score: any) => {
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
          });

          // Test the quality API endpoint
          const qualityResponse = await request.get(`/api/quality?workflowId=${workflowId}`);
          
          if (qualityResponse.status() === 200) {
            const qualityData = await qualityResponse.json();
            
            expect(qualityData).toMatchObject({
              workflowId: workflowId,
              overallScore: expect.any(Number),
              metrics: expect.any(Object)
            });

            // Verify detailed metrics
            expect(qualityData.metrics).toMatchObject({
              content: expect.any(Number),
              seo: expect.any(Number),
              engagement: expect.any(Number),
              brand: expect.any(Number)
            });

            // Check for agent-specific evaluations
            if (qualityData.agentEvaluations) {
              expect(qualityData.agentEvaluations).toBeTruthy();
              
              // Should have evaluations for key agents
              const agentIds = Object.keys(qualityData.agentEvaluations);
              expect(agentIds.length).toBeGreaterThan(0);
              
              agentIds.forEach(agentId => {
                const evaluation = qualityData.agentEvaluations[agentId];
                expect(evaluation.score).toBeGreaterThanOrEqual(0);
                expect(evaluation.score).toBeLessThanOrEqual(1);
                expect(evaluation.metrics).toBeTruthy();
              });
            }

            // Check for recommendations
            if (qualityData.recommendations) {
              expect(Array.isArray(qualityData.recommendations)).toBe(true);
              qualityData.recommendations.forEach((rec: string) => {
                expect(typeof rec).toBe('string');
                expect(rec.length).toBeGreaterThan(10);
              });
            }
          }
          
        } else if (statusData.status === 'failed') {
          console.log('Workflow failed:', statusData.error);
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should handle quality evaluation for different content types', async ({ request }) => {
      const contentTypes = ['blog', 'social', 'landing', 'email'];
      
      for (const contentType of contentTypes) {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: contentType,
            topic: `${contentType} Quality Test`,
            audience: 'quality testers',
            goals: ['test content type specific quality evaluation'],
            useEnhanced: true,
            enableOptimization: true,
            maxOptimizationCycles: 1
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        // Should start successfully for all content types
        expect(data.workflowId).toBeTruthy();
        expect(data.status).toBe('started');
        expect(data.workflowType).toBe('enhanced');
      }
    });

    test('should provide quality metrics in real-time during execution', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Real-time Quality Metrics Test',
          audience: 'monitoring specialists',
          goals: ['test real-time quality tracking'],
          useEnhanced: true,
          enableOptimization: true
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      const qualityMetrics: any[] = [];
      let attempts = 0;
      
      while (attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        // Capture quality metrics as they become available
        if (statusData.qualityScores) {
          qualityMetrics.push({
            timestamp: Date.now(),
            scores: statusData.qualityScores,
            progress: statusData.progress,
            status: statusData.status
          });
        }
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Should have captured quality metrics during execution
      if (qualityMetrics.length > 0) {
        const finalMetrics = qualityMetrics[qualityMetrics.length - 1];
        expect(finalMetrics.scores.overall).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Optimization Cycles', () => {

    test('should perform multiple optimization cycles', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Multi-Cycle Optimization Test',
          audience: 'optimization engineers',
          goals: ['test multiple optimization cycles'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 3,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Monitor for optimization cycle completion
      let completed = false;
      let attempts = 0;
      let lastQualityScore = 0;
      const qualityHistory: number[] = [];
      
      while (!completed && attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.qualityScores && statusData.qualityScores.overall > 0) {
          const currentScore = statusData.qualityScores.overall;
          if (currentScore !== lastQualityScore) {
            qualityHistory.push(currentScore);
            lastQualityScore = currentScore;
          }
        }
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Verify optimization occurred
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores.overall).toBeGreaterThan(0.7); // Should be reasonably high
          
          // Check if quality improved through optimization
          if (qualityHistory.length > 1) {
            const initialScore = qualityHistory[0];
            const finalScore = qualityHistory[qualityHistory.length - 1];
            
            // Final score should be equal or better than initial
            expect(finalScore).toBeGreaterThanOrEqual(initialScore);
          }
          
        } else if (statusData.status === 'failed') {
          console.log('Optimization workflow failed:', statusData.error);
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should show quality improvement through optimization', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'landing',
          topic: 'Quality Improvement Demonstration',
          audience: 'conversion specialists',
          goals: ['demonstrate quality improvement through optimization'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 2,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Track optimization progress
      const optimizationSteps: any[] = [];
      let attempts = 0;
      
      while (attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        optimizationSteps.push({
          timestamp: Date.now(),
          status: statusData.status,
          progress: statusData.progress,
          qualityScores: statusData.qualityScores,
          agents: statusData.agents.map((a: any) => ({ id: a.agentId, status: a.status, progress: a.progress }))
        });
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      // Should have captured optimization progression
      expect(optimizationSteps.length).toBeGreaterThan(0);
      
      // Final step should show completion
      const finalStep = optimizationSteps[optimizationSteps.length - 1];
      expect(finalStep.status).toBe('completed');
      
      if (finalStep.qualityScores) {
        // Quality scores should be present and reasonable
        expect(finalStep.qualityScores.overall).toBeGreaterThan(0.75);
        
        // Individual metrics should all be positive
        Object.values(finalStep.qualityScores).forEach((score: any) => {
          expect(score).toBeGreaterThan(0);
        });
      }
    });

    test('should handle optimization with different priority modes', async ({ request }) => {
      const priorityModes = ['speed', 'balanced', 'quality'];
      const results: any[] = [];
      
      for (const priorityMode of priorityModes) {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `${priorityMode} Priority Optimization Test`,
            audience: 'priority testing team',
            goals: ['test optimization with different priorities'],
            useEnhanced: true,
            enableOptimization: true,
            maxOptimizationCycles: priorityMode === 'quality' ? 3 : 1,
            priorityMode: priorityMode as 'speed' | 'balanced' | 'quality'
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        results.push({
          priorityMode,
          workflowId: data.workflowId,
          estimatedTime: data.estimatedTime,
          agentCount: data.agents.length,
          options: data.options
        });
      }

      // Verify different configurations
      const speedResult = results.find(r => r.priorityMode === 'speed');
      const qualityResult = results.find(r => r.priorityMode === 'quality');
      
      if (speedResult && qualityResult) {
        // Quality mode should typically take longer and use more optimization
        expect(qualityResult.estimatedTime).toBeGreaterThanOrEqual(speedResult.estimatedTime);
        expect(qualityResult.options.maxOptimizationCycles).toBeGreaterThan(speedResult.options.maxOptimizationCycles);
      }
    });
  });

  test.describe('Quality Reports and Analytics', () => {

    test('should generate comprehensive quality reports', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Quality Report Generation Test',
          audience: 'quality analysts',
          goals: ['generate comprehensive quality analytics'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 2,
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
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Test quality report endpoint
          const qualityResponse = await request.get(`/api/quality?workflowId=${workflowId}`);
          
          if (qualityResponse.status() === 200) {
            const qualityData = await qualityResponse.json();
            
            // Should have comprehensive quality data
            expect(qualityData).toMatchObject({
              workflowId: workflowId,
              overallScore: expect.any(Number)
            });

            // Check for detailed metrics breakdown
            if (qualityData.metrics) {
              const expectedMetrics = ['content', 'seo', 'engagement', 'brand'];
              expectedMetrics.forEach(metric => {
                expect(qualityData.metrics[metric]).toBeGreaterThanOrEqual(0);
                expect(qualityData.metrics[metric]).toBeLessThanOrEqual(1);
              });
            }

            // Check for agent-specific evaluations
            if (qualityData.agentEvaluations) {
              Object.values(qualityData.agentEvaluations).forEach((evaluation: any) => {
                expect(evaluation.score).toBeGreaterThanOrEqual(0);
                expect(evaluation.score).toBeLessThanOrEqual(1);
                expect(evaluation.metrics).toBeTruthy();
              });
            }

            // Check for optimization cycle data
            if (qualityData.optimizationCycles) {
              expect(Array.isArray(qualityData.optimizationCycles)).toBe(true);
              
              qualityData.optimizationCycles.forEach((cycle: any) => {
                expect(cycle.cycle).toBeGreaterThan(0);
                expect(cycle.initialScore).toBeGreaterThanOrEqual(0);
                expect(cycle.finalScore).toBeGreaterThanOrEqual(cycle.initialScore);
                expect(Array.isArray(cycle.improvements)).toBe(true);
              });
            }

            // Check for actionable recommendations
            if (qualityData.recommendations) {
              expect(Array.isArray(qualityData.recommendations)).toBe(true);
              qualityData.recommendations.forEach((rec: string) => {
                expect(typeof rec).toBe('string');
                expect(rec.length).toBeGreaterThan(15); // Should be meaningful
              });
            }
          }
          
        } else if (statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should provide quality benchmarking data', async ({ request }) => {
      // Create workflows with different configurations for benchmarking
      const configurations = [
        { priorityMode: 'speed', optimizationCycles: 0 },
        { priorityMode: 'balanced', optimizationCycles: 1 },
        { priorityMode: 'quality', optimizationCycles: 2 }
      ];

      const benchmarkResults: any[] = [];

      for (const config of configurations) {
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Benchmarking Test - ${config.priorityMode}`,
            audience: 'benchmark analysts',
            goals: ['provide benchmarking data'],
            useEnhanced: true,
            enableOptimization: config.optimizationCycles > 0,
            maxOptimizationCycles: config.optimizationCycles,
            priorityMode: config.priorityMode as 'speed' | 'balanced' | 'quality'
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        benchmarkResults.push({
          config,
          workflowId: data.workflowId,
          estimatedTime: data.estimatedTime,
          agentCount: data.agents.length
        });
      }

      // Verify benchmarking data makes sense
      expect(benchmarkResults.length).toBe(3);
      
      // Quality mode should generally have longer estimated time
      const speedResult = benchmarkResults.find(r => r.config.priorityMode === 'speed');
      const qualityResult = benchmarkResults.find(r => r.config.priorityMode === 'quality');
      
      if (speedResult && qualityResult) {
        expect(qualityResult.estimatedTime).toBeGreaterThanOrEqual(speedResult.estimatedTime);
      }
    });

    test('should handle quality evaluation errors gracefully', async ({ request }) => {
      // Test with potentially problematic content
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: '', // Empty topic might cause evaluation issues
          audience: 'error handling testers',
          goals: ['test error handling in quality evaluation'],
          useEnhanced: true,
          enableOptimization: true,
          enableFallbacks: true
        }
      });

      // Should either succeed with fallbacks or provide meaningful error
      if (response.status() !== 200) {
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBeTruthy();
      } else {
        const data = await response.json();
        expect(data.workflowId).toBeTruthy();
        expect(data.status).toBe('started');
      }
    });
  });

  test.describe('Content-Specific Quality Metrics', () => {

    test('should evaluate blog content quality comprehensively', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Advanced AI in Marketing Automation',
          audience: 'marketing professionals and technology leaders',
          goals: ['educate about AI capabilities', 'generate leads', 'establish thought leadership'],
          useEnhanced: true,
          enableOptimization: true,
          maxOptimizationCycles: 2,
          priorityMode: 'quality'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      const workflowId = data.workflowId;

      // Wait for completion and check blog-specific quality metrics
      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await request.get(`/api/content/generate?workflowId=${workflowId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          completed = true;
          
          // Blog content should have comprehensive quality scores
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores.seo).toBeGreaterThan(0.7); // SEO is important for blogs
          expect(statusData.qualityScores.content).toBeGreaterThan(0.7); // Content quality crucial
          
          // Should have generated actual content
          if (statusData.content) {
            expect(statusData.content.title).toBeTruthy();
            expect(statusData.content.content).toBeTruthy();
            expect(statusData.content.seoKeywords).toBeTruthy();
            expect(statusData.content.readabilityScore).toBeGreaterThan(60);
          }
          
        } else if (statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should evaluate social media content for engagement potential', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'social',
          topic: 'Product Launch Announcement',
          audience: 'existing customers and prospects',
          goals: ['generate excitement', 'drive traffic', 'increase brand awareness'],
          useEnhanced: true,
          enableOptimization: true,
          priorityMode: 'quality'
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
          
          // Social content should prioritize engagement
          expect(statusData.qualityScores).toBeTruthy();
          expect(statusData.qualityScores.engagement).toBeGreaterThan(0.7);
          
          // Should have platform-specific content
          if (statusData.content && statusData.content.platforms) {
            expect(Array.isArray(statusData.content.platforms)).toBe(true);
            expect(statusData.content.platforms.length).toBeGreaterThan(0);
          }
          
        } else if (statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should evaluate landing page content for conversion potential', async ({ request }) => {
      const response = await request.post('/api/content/generate', {
        data: {
          contentType: 'landing',
          topic: 'SaaS Platform Free Trial',
          audience: 'business decision makers',
          goals: ['convert visitors to trial users', 'communicate value proposition'],
          useEnhanced: true,
          enableOptimization: true,
          priorityMode: 'quality'
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
          
          // Landing pages should optimize for conversions
          expect(statusData.qualityScores).toBeTruthy();
          
          // Should have conversion-focused content
          if (statusData.content && statusData.content.platforms) {
            const landingPageContent = statusData.content.platforms.find((p: any) => p.platform === 'landing-page');
            if (landingPageContent) {
              expect(landingPageContent.content).toBeTruthy();
            }
          }
          
        } else if (statusData.status === 'failed') {
          break;
        }
        
        attempts++;
      }

      expect(completed).toBe(true);
    });
  });
});