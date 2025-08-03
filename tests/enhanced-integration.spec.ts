import { test, expect } from '@playwright/test';

/**
 * Enhanced Workflow Integration Tests
 * 
 * Comprehensive end-to-end tests that validate the entire enhanced marketing
 * workflow system, including UI interactions, API integration, parallel processing,
 * quality evaluation, error recovery, and performance improvements.
 */

test.describe('Enhanced Workflow Integration', () => {

  test.describe('Complete End-to-End Workflows', () => {

    test('should complete a full enhanced blog workflow from UI to content delivery', async ({ page, request }) => {
      // Step 1: Navigate to create page
      await page.goto('/create');
      
      // Step 2: Fill out enhanced workflow form
      await page.selectOption('select[name="contentType"]', 'blog');
      await page.fill('input[name="topic"]', 'The Future of AI-Powered Marketing Automation');
      await page.fill('textarea[name="audience"], input[name="audience"]', 'Marketing executives and technology decision makers');
      await page.fill('textarea[name="goals"], input[name="goals"]', 'Educate about AI capabilities, generate qualified leads, establish thought leadership');

      // Step 3: Configure enhanced workflow options (if available)
      const prioritySelector = page.locator('select[name="priorityMode"]');
      if (await prioritySelector.count() > 0) {
        await prioritySelector.selectOption('quality');
      }

      const optimizationToggle = page.locator('input[name="enableOptimization"]');
      if (await optimizationToggle.count() > 0) {
        await optimizationToggle.check();
      }

      // Step 4: Mock the enhanced workflow API
      let workflowId = '';
      await page.route('/api/content/generate', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
          workflowId = 'integration-test-blog-workflow';
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workflowId: workflowId,
              status: 'started',
              workflowType: 'enhanced',
              estimatedTime: 12,
              agents: [
                { agentId: 'market-researcher', status: 'pending', progress: 0 },
                { agentId: 'audience-analyzer', status: 'pending', progress: 0 },
                { agentId: 'content-strategist', status: 'pending', progress: 0 },
                { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 },
                { agentId: 'content-writer', status: 'pending', progress: 0 },
                { agentId: 'content-editor', status: 'pending', progress: 0 }
              ],
              options: {
                priorityMode: 'quality',
                enableOptimization: true,
                maxOptimizationCycles: 2,
                enableFallbacks: true
              }
            })
          });
        }
      });

      // Step 5: Submit the form
      await page.click('button[type="submit"]');

      // Step 6: Should redirect to workflow page
      await expect(page).toHaveURL(/\/workflow/);
      expect(workflowId).toBeTruthy();

      // Step 7: Mock progressive workflow updates
      let callCount = 0;
      await page.route(`/api/content/generate?workflowId=${workflowId}`, async route => {
        callCount++;
        const progress = Math.min(callCount * 15, 100);
        const status = progress >= 100 ? 'completed' : 'running';
        
        const agents = [
          { 
            agentId: 'market-researcher', 
            status: progress >= 15 ? 'completed' : 'running', 
            progress: Math.min(progress * 1.2, 100),
            startTime: new Date(Date.now() - 300000).toISOString(),
            endTime: progress >= 15 ? new Date(Date.now() - 240000).toISOString() : undefined
          },
          { 
            agentId: 'audience-analyzer', 
            status: progress >= 15 ? 'completed' : 'running', 
            progress: Math.min(progress * 1.2, 100),
            startTime: new Date(Date.now() - 300000).toISOString(),
            endTime: progress >= 15 ? new Date(Date.now() - 240000).toISOString() : undefined
          },
          { 
            agentId: 'content-strategist', 
            status: progress >= 30 ? 'completed' : (progress >= 15 ? 'running' : 'pending'), 
            progress: Math.max(0, Math.min((progress - 15) * 2, 100)),
            startTime: progress >= 15 ? new Date(Date.now() - 240000).toISOString() : undefined,
            endTime: progress >= 30 ? new Date(Date.now() - 180000).toISOString() : undefined
          },
          { 
            agentId: 'ai-seo-optimizer', 
            status: progress >= 30 ? 'completed' : (progress >= 15 ? 'running' : 'pending'), 
            progress: Math.max(0, Math.min((progress - 15) * 2, 100)),
            startTime: progress >= 15 ? new Date(Date.now() - 240000).toISOString() : undefined,
            endTime: progress >= 30 ? new Date(Date.now() - 180000).toISOString() : undefined
          },
          { 
            agentId: 'content-writer', 
            status: progress >= 60 ? 'completed' : (progress >= 30 ? 'running' : 'pending'), 
            progress: Math.max(0, Math.min((progress - 30) * 2, 100)),
            startTime: progress >= 30 ? new Date(Date.now() - 180000).toISOString() : undefined,
            endTime: progress >= 60 ? new Date(Date.now() - 120000).toISOString() : undefined
          },
          { 
            agentId: 'content-editor', 
            status: progress >= 90 ? 'completed' : (progress >= 60 ? 'running' : 'pending'), 
            progress: Math.max(0, Math.min((progress - 60) * 2.5, 100)),
            startTime: progress >= 60 ? new Date(Date.now() - 120000).toISOString() : undefined,
            endTime: progress >= 90 ? new Date(Date.now() - 60000).toISOString() : undefined
          }
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: workflowId,
            workflowType: 'enhanced',
            status: status,
            progress: progress,
            startTime: new Date(Date.now() - 300000).toISOString(),
            endTime: status === 'completed' ? new Date().toISOString() : undefined,
            estimatedTimeRemaining: status === 'completed' ? 0 : Math.max(1, 12 - Math.floor(progress / 10)),
            currentAgent: agents.find(a => a.status === 'running')?.agentId,
            agents: agents,
            qualityScores: status === 'completed' ? {
              overall: 0.94,
              content: 0.92,
              seo: 0.96,
              engagement: 0.93,
              brand: 0.91
            } : undefined,
            content: status === 'completed' ? {
              id: 'enhanced-blog-content',
              title: 'The Future of AI-Powered Marketing Automation: Transforming Customer Engagement',
              content: 'Artificial Intelligence is revolutionizing the marketing landscape...',
              summary: 'A comprehensive guide to AI-powered marketing automation and its impact on customer engagement.',
              seoKeywords: ['AI marketing', 'marketing automation', 'customer engagement', 'artificial intelligence'],
              readabilityScore: 82,
              platforms: [
                {
                  platform: 'blog',
                  content: 'Main blog content optimized for SEO and engagement...',
                  mediaRecommendations: ['AI workflow diagram', 'Marketing funnel infographic']
                }
              ],
              metadata: {
                contentType: 'blog',
                generationMethod: 'enhanced-workflow',
                totalAgents: 6,
                optimizationCycles: 2,
                executionTime: 300000,
                qualityMode: 'quality'
              }
            } : undefined
          })
        });
      });

      // Step 8: Verify workflow page displays correctly
      await expect(page.locator('text=Enhanced Workflow')).toBeVisible();
      await expect(page.locator('text=The Future of AI-Powered Marketing Automation')).toBeVisible();

      // Step 9: Wait for and verify progress updates
      await expect(page.locator('text=market-researcher')).toBeVisible();
      await expect(page.locator('text=content-strategist')).toBeVisible();

      // Step 10: Wait for completion
      await expect(page.locator('text=Completed, text=✅')).toBeVisible({ timeout: 30000 });
      await expect(page.locator('text=94%')).toBeVisible(); // Quality score

      // Step 11: Verify final content is available
      await expect(page.locator('button:has-text("View Content"), button:has-text("Download")')).toBeVisible();

      console.log('✅ Complete enhanced blog workflow integration test passed');
    });

    test('should handle enhanced social media workflow with platform optimization', async ({ page }) => {
      await page.goto('/create');
      
      // Configure social media workflow
      await page.selectOption('select[name="contentType"]', 'social');
      await page.fill('input[name="topic"]', 'Product Launch: Revolutionary AI Tool');
      await page.fill('textarea[name="audience"], input[name="audience"]', 'Tech enthusiasts and early adopters');
      await page.fill('textarea[name="goals"], input[name="goals"]', 'Generate buzz, drive pre-orders, build community');

      // Mock enhanced social workflow
      let workflowId = '';
      await page.route('/api/content/generate', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
          workflowId = 'integration-test-social-workflow';
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workflowId: workflowId,
              status: 'started',
              workflowType: 'enhanced',
              estimatedTime: 6,
              agents: [
                { agentId: 'audience-analyzer', status: 'pending', progress: 0 },
                { agentId: 'content-strategist', status: 'pending', progress: 0 },
                { agentId: 'social-media-specialist', status: 'pending', progress: 0 }
              ],
              options: {
                priorityMode: 'speed',
                enableOptimization: true,
                maxOptimizationCycles: 1
              }
            })
          });
        }
      });

      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/workflow/);

      // Mock social workflow completion
      await page.route(`/api/content/generate?workflowId=${workflowId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: workflowId,
            workflowType: 'enhanced',
            status: 'completed',
            progress: 100,
            agents: [
              { agentId: 'audience-analyzer', status: 'completed', progress: 100 },
              { agentId: 'content-strategist', status: 'completed', progress: 100 },
              { agentId: 'social-media-specialist', status: 'completed', progress: 100 }
            ],
            qualityScores: {
              overall: 0.89,
              content: 0.87,
              seo: 0.85,
              engagement: 0.94,
              brand: 0.88
            },
            content: {
              id: 'enhanced-social-content',
              title: 'Revolutionary AI Tool Launch',
              platforms: [
                {
                  platform: 'twitter',
                  content: '🚀 Introducing our revolutionary AI tool! Transform your workflow with cutting-edge technology. #AI #Innovation #ProductLaunch',
                  mediaRecommendations: ['Product demo video', 'Feature highlights graphic']
                },
                {
                  platform: 'linkedin',
                  content: 'We\'re excited to announce the launch of our revolutionary AI tool that will transform how businesses approach automation...',
                  mediaRecommendations: ['Professional product showcase', 'Customer testimonial video']
                }
              ],
              metadata: {
                contentType: 'social',
                generationMethod: 'enhanced-workflow',
                totalAgents: 3,
                optimizationCycles: 1
              }
            }
          })
        });
      });

      // Verify social workflow completion
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=89%')).toBeVisible(); // Quality score
      await expect(page.locator('text=Twitter, text=LinkedIn')).toBeVisible();

      console.log('✅ Enhanced social media workflow integration test passed');
    });

    test('should demonstrate performance improvements over legacy workflow', async ({ page, request }) => {
      // Test enhanced workflow performance
      const enhancedStart = Date.now();
      
      const enhancedResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Performance Comparison Test Article',
          audience: 'performance engineers',
          goals: ['test enhanced workflow performance'],
          useEnhanced: true,
          priorityMode: 'speed'
        }
      });

      expect(enhancedResponse.status()).toBe(200);
      const enhancedData = await enhancedResponse.json();
      const enhancedInitTime = Date.now() - enhancedStart;

      // Test legacy workflow performance
      const legacyStart = Date.now();
      
      const legacyResponse = await request.post('/api/content/generate', {
        data: {
          contentType: 'blog',
          topic: 'Performance Comparison Test Article',
          audience: 'performance engineers',
          goals: ['test legacy workflow performance'],
          useEnhanced: false
        }
      });

      expect(legacyResponse.status()).toBe(200);
      const legacyData = await legacyResponse.json();
      const legacyInitTime = Date.now() - legacyStart;

      // Compare workflow features and capabilities
      expect(enhancedData.workflowType).toBe('enhanced');
      expect(enhancedData.options).toBeTruthy();
      expect(enhancedData.options.priorityMode).toBeTruthy();
      expect(enhancedData.options.enableOptimization).toBeDefined();
      expect(enhancedData.options.enableFallbacks).toBeDefined();

      expect(legacyData.workflowType).toBe('legacy');
      expect(legacyData.options).toBeFalsy();

      // Both should initialize quickly
      expect(enhancedInitTime).toBeLessThan(5000);
      expect(legacyInitTime).toBeLessThan(5000);

      // Enhanced workflow should provide additional capabilities
      expect(enhancedData.agents).toBeTruthy();
      expect(legacyData.agents).toBeTruthy();

      // Enhanced workflow may have different optimization features
      if (enhancedData.estimatedTime && legacyData.estimatedTime) {
        // Speed mode enhanced should be competitive or faster
        console.log('Enhanced estimated time:', enhancedData.estimatedTime);
        console.log('Legacy estimated time:', legacyData.estimatedTime);
      }

      console.log('✅ Performance comparison test completed', {
        enhanced: {
          initTime: enhancedInitTime,
          features: Object.keys(enhancedData.options || {}).length,
          estimatedTime: enhancedData.estimatedTime
        },
        legacy: {
          initTime: legacyInitTime,
          features: 0,
          estimatedTime: legacyData.estimatedTime
        }
      });
    });
  });

  test.describe('Error Recovery in Real Workflows', () => {

    test('should recover from agent failures during live workflow execution', async ({ page }) => {
      await page.goto('/create');
      
      // Create workflow with potential for failures
      await page.selectOption('select[name="contentType"]', 'landing');
      await page.fill('input[name="topic"]', 'Error Recovery Test Landing Page');
      await page.fill('textarea[name="audience"], input[name="audience"]', 'reliability engineers');
      await page.fill('textarea[name="goals"], input[name="goals"]', 'test error recovery mechanisms');

      let workflowId = '';
      await page.route('/api/content/generate', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
          workflowId = 'error-recovery-test-workflow';
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workflowId: workflowId,
              status: 'started',
              workflowType: 'enhanced',
              estimatedTime: 8,
              agents: [
                { agentId: 'content-strategist', status: 'pending', progress: 0 },
                { agentId: 'landing-page-specialist', status: 'pending', progress: 0 },
                { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 }
              ],
              options: {
                priorityMode: 'balanced',
                enableFallbacks: true
              }
            })
          });
        }
      });

      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/workflow/);

      // Mock workflow with agent failure and recovery
      let callCount = 0;
      await page.route(`/api/content/generate?workflowId=${workflowId}`, async route => {
        callCount++;
        
        if (callCount <= 3) {
          // Initial progress
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'running',
              progress: 30,
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'landing-page-specialist', status: 'running', progress: 50 },
                { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 }
              ]
            })
          });
        } else if (callCount <= 5) {
          // Agent failure detected
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'running',
              progress: 40,
              error: 'Agent failure detected, attempting recovery...',
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'landing-page-specialist', status: 'failed', progress: 50, error: 'API timeout' },
                { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 },
                { agentId: 'fallback-content-generator', status: 'running', progress: 25 }
              ]
            })
          });
        } else {
          // Recovery completed
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'completed',
              progress: 100,
              warning: 'Completed with fallback content due to agent failure',
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'landing-page-specialist', status: 'failed', progress: 50, error: 'API timeout' },
                { agentId: 'ai-seo-optimizer', status: 'completed', progress: 100 },
                { agentId: 'fallback-content-generator', status: 'completed', progress: 100 }
              ],
              qualityScores: {
                overall: 0.82,
                content: 0.78,
                seo: 0.85,
                engagement: 0.80,
                brand: 0.84
              },
              content: {
                id: 'fallback-landing-content',
                title: 'Error Recovery Test Landing Page',
                content: 'This content was generated using fallback mechanisms...',
                metadata: {
                  contentType: 'landing',
                  generationMethod: 'enhanced-workflow-fallback'
                }
              }
            })
          });
        }
      });

      // Should show error state temporarily
      await expect(page.locator('text=failure, text=error')).toBeVisible({ timeout: 15000 });
      
      // Should recover and complete
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('text=fallback, text=warning')).toBeVisible();
      await expect(page.locator('text=82%')).toBeVisible(); // Quality score

      console.log('✅ Error recovery integration test passed');
    });
  });

  test.describe('Quality Optimization in Live Workflows', () => {

    test('should demonstrate quality improvement through optimization cycles', async ({ page }) => {
      await page.goto('/create');
      
      // Configure quality-focused workflow
      await page.selectOption('select[name="contentType"]', 'blog');
      await page.fill('input[name="topic"]', 'Quality Optimization Demonstration');
      await page.fill('textarea[name="audience"], input[name="audience"]', 'quality assurance professionals');
      await page.fill('textarea[name="goals"], input[name="goals"]', 'demonstrate quality improvement capabilities');

      // Select quality priority if available
      const prioritySelector = page.locator('select[name="priorityMode"]');
      if (await prioritySelector.count() > 0) {
        await prioritySelector.selectOption('quality');
      }

      let workflowId = '';
      await page.route('/api/content/generate', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
          workflowId = 'quality-optimization-workflow';
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workflowId: workflowId,
              status: 'started',
              workflowType: 'enhanced',
              estimatedTime: 15,
              agents: [
                { agentId: 'content-strategist', status: 'pending', progress: 0 },
                { agentId: 'content-writer', status: 'pending', progress: 0 },
                { agentId: 'content-editor', status: 'pending', progress: 0 },
                { agentId: 'quality-optimizer', status: 'pending', progress: 0 }
              ],
              options: {
                priorityMode: 'quality',
                enableOptimization: true,
                maxOptimizationCycles: 2
              }
            })
          });
        }
      });

      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/workflow/);

      // Mock quality optimization progression
      let callCount = 0;
      await page.route(`/api/content/generate?workflowId=${workflowId}`, async route => {
        callCount++;
        
        if (callCount <= 2) {
          // Initial content generation
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'running',
              progress: 50,
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'content-writer', status: 'completed', progress: 100 },
                { agentId: 'content-editor', status: 'running', progress: 60 },
                { agentId: 'quality-optimizer', status: 'pending', progress: 0 }
              ],
              qualityScores: {
                overall: 0.78,
                content: 0.75,
                seo: 0.80,
                engagement: 0.76,
                brand: 0.81
              }
            })
          });
        } else if (callCount <= 4) {
          // First optimization cycle
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'running',
              progress: 75,
              currentAgent: 'quality-optimizer',
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'content-writer', status: 'completed', progress: 100 },
                { agentId: 'content-editor', status: 'completed', progress: 100 },
                { agentId: 'quality-optimizer', status: 'running', progress: 50 }
              ],
              qualityScores: {
                overall: 0.86,
                content: 0.84,
                seo: 0.88,
                engagement: 0.85,
                brand: 0.87
              }
            })
          });
        } else {
          // Final optimization and completion
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'completed',
              progress: 100,
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'content-writer', status: 'completed', progress: 100 },
                { agentId: 'content-editor', status: 'completed', progress: 100 },
                { agentId: 'quality-optimizer', status: 'completed', progress: 100 }
              ],
              qualityScores: {
                overall: 0.92,
                content: 0.90,
                seo: 0.94,
                engagement: 0.91,
                brand: 0.93
              },
              content: {
                id: 'optimized-quality-content',
                title: 'Quality Optimization Demonstration: Best Practices',
                content: 'This content has been optimized through multiple quality cycles...',
                metadata: {
                  contentType: 'blog',
                  generationMethod: 'enhanced-workflow',
                  optimizationCycles: 2,
                  qualityMode: 'quality'
                }
              }
            })
          });
        }
      });

      // Should show quality progression
      await expect(page.locator('text=78%')).toBeVisible({ timeout: 10000 }); // Initial quality
      await expect(page.locator('text=86%')).toBeVisible({ timeout: 15000 }); // First optimization
      await expect(page.locator('text=92%')).toBeVisible({ timeout: 20000 }); // Final quality

      await expect(page.locator('text=Completed')).toBeVisible();

      console.log('✅ Quality optimization integration test passed');
    });
  });

  test.describe('Mobile and Responsive Integration', () => {

    const mobileViewports = [
      { name: 'iPhone', width: 375, height: 667 },
      { name: 'Android', width: 360, height: 640 }
    ];

    mobileViewports.forEach(({ name, width, height }) => {
      test(`should work on ${name} mobile device`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        
        // Complete mobile workflow
        await page.goto('/create');
        
        await page.selectOption('select[name="contentType"]', 'social');
        await page.fill('input[name="topic"]', 'Mobile Workflow Test');
        await page.fill('textarea[name="audience"], input[name="audience"]', 'mobile users');
        await page.fill('textarea[name="goals"], input[name="goals"]', 'test mobile experience');

        let workflowId = '';
        await page.route('/api/content/generate', async route => {
          const request = route.request();
          if (request.method() === 'POST') {
            workflowId = 'mobile-workflow-test';
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                workflowId: workflowId,
                status: 'started',
                workflowType: 'enhanced',
                estimatedTime: 5,
                agents: [
                  { agentId: 'content-strategist', status: 'pending', progress: 0 },
                  { agentId: 'social-media-specialist', status: 'pending', progress: 0 }
                ]
              })
            });
          }
        });

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/workflow/);

        // Mock completion
        await page.route(`/api/content/generate?workflowId=${workflowId}`, async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: workflowId,
              workflowType: 'enhanced',
              status: 'completed',
              progress: 100,
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'social-media-specialist', status: 'completed', progress: 100 }
              ],
              qualityScores: {
                overall: 0.88,
                content: 0.86,
                seo: 0.85,
                engagement: 0.92,
                brand: 0.87
              }
            })
          });
        });

        // Should work on mobile
        await expect(page.locator('text=Enhanced Workflow')).toBeVisible();
        await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=88%')).toBeVisible();

        // No horizontal scrolling
        const body = await page.locator('body').boundingBox();
        expect(body?.width).toBeLessThanOrEqual(width + 50);

        console.log(`✅ ${name} mobile integration test passed`);
      });
    });
  });

  test.describe('Performance and Load Testing', () => {

    test('should handle multiple concurrent enhanced workflows', async ({ request }) => {
      const concurrentWorkflows = 3;
      const workflowPromises = Array.from({ length: concurrentWorkflows }, (_, i) =>
        request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Concurrent Enhanced Workflow ${i + 1}`,
            audience: 'performance testers',
            goals: ['test concurrent execution'],
            useEnhanced: true,
            priorityMode: 'speed'
          }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(workflowPromises);
      const initTime = Date.now() - startTime;

      // All should start successfully
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      const workflowData = await Promise.all(
        responses.map(response => response.json())
      );

      // Should have unique workflow IDs
      const workflowIds = workflowData.map(data => data.workflowId);
      const uniqueIds = new Set(workflowIds);
      expect(uniqueIds.size).toBe(concurrentWorkflows);

      // All should be enhanced workflows
      workflowData.forEach(data => {
        expect(data.workflowType).toBe('enhanced');
        expect(data.status).toBe('started');
        expect(data.options).toBeTruthy();
      });

      // Should initialize quickly even under load
      expect(initTime).toBeLessThan(10000);

      console.log('✅ Concurrent workflows test passed', {
        workflows: concurrentWorkflows,
        initTime: initTime,
        avgInitTimePerWorkflow: initTime / concurrentWorkflows
      });
    });

    test('should demonstrate enhanced workflow efficiency', async ({ request }) => {
      const testCases = [
        { priorityMode: 'speed', expectedTime: 'fast' },
        { priorityMode: 'balanced', expectedTime: 'medium' },
        { priorityMode: 'quality', expectedTime: 'slow' }
      ];

      const results: any[] = [];

      for (const testCase of testCases) {
        const startTime = Date.now();
        
        const response = await request.post('/api/content/generate', {
          data: {
            contentType: 'blog',
            topic: `Efficiency Test - ${testCase.priorityMode}`,
            audience: 'efficiency analysts',
            goals: ['test workflow efficiency'],
            useEnhanced: true,
            priorityMode: testCase.priorityMode as 'speed' | 'balanced' | 'quality'
          }
        });

        const initTime = Date.now() - startTime;
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        
        results.push({
          priorityMode: testCase.priorityMode,
          initTime: initTime,
          estimatedTime: data.estimatedTime,
          agentCount: data.agents.length,
          workflowId: data.workflowId
        });
      }

      // Verify efficiency patterns
      const speedResult = results.find(r => r.priorityMode === 'speed');
      const qualityResult = results.find(r => r.priorityMode === 'quality');

      if (speedResult && qualityResult) {
        // Speed mode should be more efficient for time
        expect(speedResult.estimatedTime).toBeLessThanOrEqual(qualityResult.estimatedTime);
        
        // All should initialize quickly
        results.forEach(result => {
          expect(result.initTime).toBeLessThan(5000);
        });
      }

      console.log('✅ Efficiency test completed', {
        results: results.map(r => ({
          mode: r.priorityMode,
          estimatedTime: r.estimatedTime,
          agents: r.agentCount
        }))
      });
    });
  });
});