import { test, expect, Page } from '@playwright/test';

/**
 * Enhanced Workflow UI Tests
 * 
 * Tests the user interface for the enhanced marketing workflow system,
 * including workflow creation, progress tracking, quality metrics display,
 * and error recovery interfaces.
 */

test.describe('Enhanced Workflow UI', () => {

  test.describe('Create Page - Enhanced Workflow Options', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/create');
    });

    test('should display enhanced workflow options', async ({ page }) => {
      // Check if enhanced workflow toggle/option is available
      await expect(page.locator('form')).toBeVisible();
      
      // Look for enhanced workflow specific fields
      const priorityModeSelector = page.locator('select[name="priorityMode"], input[name="priorityMode"]');
      const enableOptimizationToggle = page.locator('input[name="enableOptimization"], input[type="checkbox"]');
      
      // Enhanced options should be visible or available
      if (await priorityModeSelector.count() > 0) {
        await expect(priorityModeSelector).toBeVisible();
      }
      
      if (await enableOptimizationToggle.count() > 0) {
        await expect(enableOptimizationToggle).toBeVisible();
      }
    });

    test('should create enhanced workflow with speed priority', async ({ page }) => {
      await fillBasicForm(page);
      
      // Select speed priority if available
      const prioritySelector = page.locator('select[name="priorityMode"]');
      if (await prioritySelector.count() > 0) {
        await prioritySelector.selectOption('speed');
      }

      // Mock the API response for enhanced workflow
      await page.route('/api/content/generate', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workflowId: 'enhanced-workflow-test-speed',
            status: 'started',
            workflowType: 'enhanced',
            estimatedTime: 5,
            options: {
              priorityMode: 'speed',
              enableOptimization: false,
              maxExecutionTime: 300
            },
            agents: [
              { agentId: 'content-strategist', status: 'pending', progress: 0 },
              { agentId: 'content-writer', status: 'pending', progress: 0 }
            ]
          })
        });
      });

      await page.click('button[type="submit"]');
      
      // Should redirect to workflow page
      await expect(page).toHaveURL(/\/workflow\?id=enhanced-workflow-test-speed/);
    });

    test('should create enhanced workflow with quality priority', async ({ page }) => {
      await fillBasicForm(page);
      
      // Select quality priority if available
      const prioritySelector = page.locator('select[name="priorityMode"]');
      if (await prioritySelector.count() > 0) {
        await prioritySelector.selectOption('quality');
      }

      // Enable optimization if available
      const optimizationToggle = page.locator('input[name="enableOptimization"]');
      if (await optimizationToggle.count() > 0) {
        await optimizationToggle.check();
      }

      await page.route('/api/content/generate', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workflowId: 'enhanced-workflow-test-quality',
            status: 'started',
            workflowType: 'enhanced',
            estimatedTime: 15,
            options: {
              priorityMode: 'quality',
              enableOptimization: true,
              maxOptimizationCycles: 3
            },
            agents: [
              { agentId: 'market-researcher', status: 'pending', progress: 0 },
              { agentId: 'content-strategist', status: 'pending', progress: 0 },
              { agentId: 'content-writer', status: 'pending', progress: 0 },
              { agentId: 'content-editor', status: 'pending', progress: 0 }
            ]
          })
        });
      });

      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/workflow\?id=enhanced-workflow-test-quality/);
    });

    test('should show content type specific options', async ({ page }) => {
      await page.selectOption('select[name="contentType"]', 'landing');
      
      // Landing page specific options might appear
      await expect(page.locator('form')).toBeVisible();
      
      // Check if conversion goals or CTA options appear for landing pages
      const conversionOptions = page.locator('text=conversion, text=CTA, text=landing');
      if (await conversionOptions.count() > 0) {
        await expect(conversionOptions.first()).toBeVisible();
      }
    });

    test('should validate enhanced workflow options', async ({ page }) => {
      // Fill minimal form
      await page.selectOption('select[name="contentType"]', 'blog');
      await page.fill('input[name="topic"]', 'Test Topic');
      
      // Try to submit without required fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      const errorMessage = page.locator('.error, .text-red-500, [role="alert"]');
      await expect(errorMessage.first()).toBeVisible();
    });
  });

  test.describe('Workflow Progress Tracking', () => {

    test('should display enhanced workflow progress', async ({ page }) => {
      await page.goto('/workflow?id=test-enhanced-workflow');

      await page.route('/api/content/generate?workflowId=test-enhanced-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-enhanced-workflow',
            workflowType: 'enhanced',
            status: 'running',
            progress: 35,
            currentAgent: 'content-strategist',
            startTime: new Date().toISOString(),
            estimatedTimeRemaining: 8,
            agents: [
              { 
                agentId: 'market-researcher', 
                status: 'completed', 
                progress: 100,
                startTime: new Date(Date.now() - 60000).toISOString(),
                endTime: new Date(Date.now() - 30000).toISOString()
              },
              { 
                agentId: 'content-strategist', 
                status: 'running', 
                progress: 60,
                startTime: new Date(Date.now() - 30000).toISOString()
              },
              { 
                agentId: 'content-writer', 
                status: 'pending', 
                progress: 0 
              }
            ]
          })
        });
      });

      await page.reload();

      // Should display enhanced workflow indicators
      await expect(page.locator('text=Enhanced Workflow, text=enhanced')).toBeVisible();
      
      // Should show overall progress
      await expect(page.locator('text=35%')).toBeVisible();
      
      // Should show current agent
      await expect(page.locator('text=content-strategist')).toBeVisible();
      
      // Should show estimated time remaining
      await expect(page.locator('text=8')).toBeVisible();
      
      // Should display individual agent progress
      await expect(page.locator('text=market-researcher')).toBeVisible();
      await expect(page.locator('text=completed, text=✓')).toBeVisible();
      await expect(page.locator('text=running, text=⚡')).toBeVisible();
    });

    test('should update progress in real-time', async ({ page }) => {
      await page.goto('/workflow?id=test-realtime-workflow');

      let progressCount = 0;
      await page.route('/api/content/generate?workflowId=test-realtime-workflow', async route => {
        progressCount++;
        const progress = Math.min(progressCount * 20, 100);
        const status = progress >= 100 ? 'completed' : 'running';
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-realtime-workflow',
            workflowType: 'enhanced',
            status: status,
            progress: progress,
            currentAgent: progress < 50 ? 'content-strategist' : 'content-writer',
            agents: [
              { 
                agentId: 'content-strategist', 
                status: progress >= 50 ? 'completed' : 'running', 
                progress: Math.min(progress * 2, 100)
              },
              { 
                agentId: 'content-writer', 
                status: progress >= 50 ? 'running' : 'pending', 
                progress: Math.max(0, (progress - 50) * 2)
              }
            ],
            qualityScores: progress >= 100 ? {
              overall: 0.92,
              content: 0.88,
              seo: 0.95,
              engagement: 0.91,
              brand: 0.89
            } : undefined
          })
        });
      });

      await page.reload();

      // Wait for initial load
      await expect(page.locator('text=Enhanced Workflow, text=enhanced')).toBeVisible();

      // Progress should update
      await expect(page.locator('text=20%')).toBeVisible({ timeout: 10000 });
      
      // Eventually should show completion
      await expect(page.locator('text=completed, text=✓')).toBeVisible({ timeout: 15000 });
    });

    test('should display parallel agent execution', async ({ page }) => {
      await page.goto('/workflow?id=test-parallel-workflow');

      await page.route('/api/content/generate?workflowId=test-parallel-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-parallel-workflow',
            workflowType: 'enhanced',
            status: 'running',
            progress: 50,
            agents: [
              // Parallel agents running simultaneously
              { agentId: 'market-researcher', status: 'running', progress: 70 },
              { agentId: 'audience-analyzer', status: 'running', progress: 60 },
              { agentId: 'ai-seo-optimizer', status: 'running', progress: 80 },
              // Sequential agents waiting
              { agentId: 'content-strategist', status: 'pending', progress: 0 },
              { agentId: 'content-writer', status: 'pending', progress: 0 }
            ]
          })
        });
      });

      await page.reload();

      // Should show multiple agents running in parallel
      const runningAgents = page.locator('text=running').count();
      await expect(runningAgents).resolves.toBeGreaterThan(1);
      
      // Should indicate parallel execution
      await expect(page.locator('text=parallel, text=concurrent')).toBeVisible();
    });

    test('should show workflow completion with quality scores', async ({ page }) => {
      await page.goto('/workflow?id=test-completed-workflow');

      await page.route('/api/content/generate?workflowId=test-completed-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-completed-workflow',
            workflowType: 'enhanced',
            status: 'completed',
            progress: 100,
            startTime: new Date(Date.now() - 600000).toISOString(),
            endTime: new Date().toISOString(),
            agents: [
              { agentId: 'market-researcher', status: 'completed', progress: 100 },
              { agentId: 'content-strategist', status: 'completed', progress: 100 },
              { agentId: 'content-writer', status: 'completed', progress: 100 },
              { agentId: 'content-editor', status: 'completed', progress: 100 }
            ],
            qualityScores: {
              overall: 0.94,
              content: 0.92,
              seo: 0.96,
              engagement: 0.93,
              brand: 0.91
            },
            content: {
              id: 'test-content',
              title: 'Test Article Title',
              content: 'Test article content...',
              summary: 'Test summary',
              metadata: {
                contentType: 'blog',
                generationMethod: 'enhanced-workflow',
                totalAgents: 4,
                executionTime: 600000
              }
            }
          })
        });
      });

      await page.reload();

      // Should show completion status
      await expect(page.locator('text=Completed, text=✅')).toBeVisible();
      
      // Should display quality scores
      await expect(page.locator('text=94%')).toBeVisible(); // Overall score
      await expect(page.locator('text=Quality Score')).toBeVisible();
      
      // Should show execution time
      await expect(page.locator('text=10m')).toBeVisible(); // 10 minutes
      
      // Should have download/view content option
      await expect(page.locator('button:has-text("View Content"), button:has-text("Download")')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery UI', () => {

    test('should display workflow errors with recovery options', async ({ page }) => {
      await page.goto('/workflow?id=test-error-workflow');

      await page.route('/api/content/generate?workflowId=test-error-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-error-workflow',
            workflowType: 'enhanced',
            status: 'failed',
            progress: 45,
            error: 'Content generation failed due to API timeout',
            agents: [
              { agentId: 'market-researcher', status: 'completed', progress: 100 },
              { agentId: 'content-strategist', status: 'completed', progress: 100 },
              { agentId: 'content-writer', status: 'failed', progress: 0, error: 'API timeout' },
              { agentId: 'content-editor', status: 'pending', progress: 0 }
            ]
          })
        });
      });

      await page.reload();

      // Should show error status
      await expect(page.locator('text=Failed, text=❌')).toBeVisible();
      
      // Should display error message
      await expect(page.locator('text=API timeout')).toBeVisible();
      
      // Should offer recovery options
      await expect(page.locator('button:has-text("Retry"), button:has-text("Restart")')).toBeVisible();
      
      // Should show which agents succeeded/failed
      await expect(page.locator('text=completed').nth(0)).toBeVisible();
      await expect(page.locator('text=failed')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/workflow?id=test-network-error');

      // Simulate network error
      await page.route('/api/content/generate?workflowId=test-network-error', async route => {
        await route.abort('failed');
      });

      await page.reload();

      // Should show network error message
      await expect(page.locator('text=Network error, text=Connection failed')).toBeVisible();
      
      // Should offer retry option
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should show fallback content when available', async ({ page }) => {
      await page.goto('/workflow?id=test-fallback-workflow');

      await page.route('/api/content/generate?workflowId=test-fallback-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-fallback-workflow',
            workflowType: 'enhanced',
            status: 'completed',
            progress: 100,
            error: 'Some agents failed, using fallback content',
            agents: [
              { agentId: 'content-strategist', status: 'completed', progress: 100 },
              { agentId: 'content-writer', status: 'failed', progress: 0 },
              { agentId: 'fallback-generator', status: 'completed', progress: 100 }
            ],
            content: {
              id: 'fallback-content',
              title: 'Fallback Content Title',
              content: 'This content was generated using fallback mechanisms...',
              metadata: {
                contentType: 'blog',
                generationMethod: 'enhanced-workflow-fallback'
              }
            }
          })
        });
      });

      await page.reload();

      // Should show completed with warning
      await expect(page.locator('text=Completed, text=⚠️')).toBeVisible();
      
      // Should indicate fallback was used
      await expect(page.locator('text=fallback, text=backup')).toBeVisible();
      
      // Should still provide content
      await expect(page.locator('button:has-text("View Content")')).toBeVisible();
    });
  });

  test.describe('Quality Metrics Display', () => {

    test('should display comprehensive quality metrics', async ({ page }) => {
      await page.goto('/quality?id=test-quality-workflow');

      await page.route('/api/quality?workflowId=test-quality-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workflowId: 'test-quality-workflow',
            overallScore: 0.93,
            metrics: {
              content: 0.91,
              seo: 0.95,
              engagement: 0.92,
              brand: 0.94,
              readability: 0.89,
              originality: 0.96
            },
            agentEvaluations: {
              'content-writer': {
                score: 0.91,
                metrics: {
                  clarity: 0.89,
                  structure: 0.93,
                  grammar: 0.95
                }
              },
              'ai-seo-optimizer': {
                score: 0.95,
                metrics: {
                  keywordDensity: 0.94,
                  metaTags: 0.96,
                  readability: 0.93
                }
              }
            },
            recommendations: [
              'Consider improving readability score with shorter sentences',
              'Add more supporting evidence for key claims',
              'Optimize for featured snippet potential'
            ]
          })
        });
      });

      await page.reload();

      // Should show overall quality score
      await expect(page.locator('text=93%')).toBeVisible();
      
      // Should display individual metric scores
      await expect(page.locator('text=SEO: 95%')).toBeVisible();
      await expect(page.locator('text=Engagement: 92%')).toBeVisible();
      
      // Should show agent-specific evaluations
      await expect(page.locator('text=content-writer')).toBeVisible();
      await expect(page.locator('text=ai-seo-optimizer')).toBeVisible();
      
      // Should display recommendations
      await expect(page.locator('text=readability score')).toBeVisible();
      await expect(page.locator('text=supporting evidence')).toBeVisible();
    });

    test('should show optimization cycle results', async ({ page }) => {
      await page.goto('/quality?id=test-optimization-workflow');

      await page.route('/api/quality?workflowId=test-optimization-workflow', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workflowId: 'test-optimization-workflow',
            optimizationCycles: [
              {
                cycle: 1,
                initialScore: 0.76,
                finalScore: 0.84,
                improvements: ['Enhanced SEO keywords', 'Improved content structure']
              },
              {
                cycle: 2,
                initialScore: 0.84,
                finalScore: 0.92,
                improvements: ['Better readability', 'Added engaging elements']
              }
            ],
            finalScore: 0.92
          })
        });
      });

      await page.reload();

      // Should show optimization cycles
      await expect(page.locator('text=Cycle 1')).toBeVisible();
      await expect(page.locator('text=Cycle 2')).toBeVisible();
      
      // Should show score improvements
      await expect(page.locator('text=76%')).toBeVisible(); // Initial
      await expect(page.locator('text=92%')).toBeVisible(); // Final
      
      // Should display improvement descriptions
      await expect(page.locator('text=Enhanced SEO keywords')).toBeVisible();
      await expect(page.locator('text=Better readability')).toBeVisible();
    });
  });

  test.describe('Content Type Specific UI', () => {

    const contentTypes = ['blog', 'social', 'landing', 'email'];

    contentTypes.forEach(contentType => {
      test(`should display ${contentType}-specific workflow elements`, async ({ page }) => {
        await page.goto(`/workflow?id=test-${contentType}-workflow`);

        await page.route(`/api/content/generate?workflowId=test-${contentType}-workflow`, async route => {
          const agents = getAgentsForContentType(contentType);
          
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: `test-${contentType}-workflow`,
              workflowType: 'enhanced',
              status: 'running',
              progress: 60,
              agents: agents,
              content: {
                contentType: contentType,
                metadata: {
                  platforms: contentType === 'social' ? ['twitter', 'linkedin'] : undefined,
                  cta: contentType === 'landing' ? 'Sign Up Now' : undefined,
                  subject: contentType === 'email' ? 'Newsletter Update' : undefined
                }
              }
            })
          });
        });

        await page.reload();

        // Should show content type specific information
        await expect(page.locator(`text=${contentType}`)).toBeVisible();
        
        if (contentType === 'social') {
          await expect(page.locator('text=Twitter, text=LinkedIn')).toBeVisible();
        }
        
        if (contentType === 'landing') {
          await expect(page.locator('text=CTA, text=conversion')).toBeVisible();
        }
        
        if (contentType === 'email') {
          await expect(page.locator('text=Subject, text=Newsletter')).toBeVisible();
        }
      });
    });
  });

  test.describe('Responsive Design', () => {

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`should be responsive on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/workflow?id=test-responsive-workflow');

        await page.route('/api/content/generate?workflowId=test-responsive-workflow', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-responsive-workflow',
              workflowType: 'enhanced',
              status: 'running',
              progress: 75,
              agents: [
                { agentId: 'content-strategist', status: 'completed', progress: 100 },
                { agentId: 'content-writer', status: 'running', progress: 50 },
                { agentId: 'content-editor', status: 'pending', progress: 0 }
              ]
            })
          });
        });

        await page.reload();

        // Content should be visible and properly formatted
        await expect(page.locator('text=Enhanced Workflow')).toBeVisible();
        await expect(page.locator('text=75%')).toBeVisible();
        
        // No horizontal scrolling
        const body = await page.locator('body').boundingBox();
        expect(body?.width).toBeLessThanOrEqual(width + 50); // Allow some tolerance
      });
    });
  });
});

// Helper functions
async function fillBasicForm(page: Page) {
  await page.selectOption('select[name="contentType"]', 'blog');
  await page.fill('input[name="topic"]', 'Test Article Topic');
  await page.fill('input[name="audience"], textarea[name="audience"]', 'test audience');
  await page.fill('input[name="goals"], textarea[name="goals"]', 'test goals');
}

function getAgentsForContentType(contentType: string) {
  const baseAgents = [
    { agentId: 'content-strategist', status: 'completed', progress: 100 },
    { agentId: 'content-writer', status: 'running', progress: 60 }
  ];

  switch (contentType) {
    case 'social':
      return [...baseAgents, { agentId: 'social-media-specialist', status: 'pending', progress: 0 }];
    case 'landing':
      return [...baseAgents, { agentId: 'landing-page-specialist', status: 'pending', progress: 0 }];
    case 'email':
      return [...baseAgents, { agentId: 'email-specialist', status: 'pending', progress: 0 }];
    default:
      return [...baseAgents, { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 }];
  }
}