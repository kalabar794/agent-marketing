import { test, expect } from '@playwright/test';

test.describe('Workflow Page', () => {
  test('should show error when no workflow ID is provided', async ({ page }) => {
    await page.goto('/workflow');
    
    // Should show error message
    await expect(page.locator('text=Workflow Error')).toBeVisible();
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Should show "Start New Content Generation" button
    await expect(page.locator('text=Start New Content Generation')).toBeVisible();
    
    // Button should link to create page
    const startButton = page.locator('a[href="/create"]');
    await expect(startButton).toBeVisible();
  });

  test('should handle invalid workflow ID', async ({ page }) => {
    // Mock API error for invalid workflow ID
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Workflow not found' })
      });
    });
    
    await page.goto('/workflow?id=invalid-id');
    
    // Should show error message
    await expect(page.locator('text=Workflow Error')).toBeVisible();
    await expect(page.locator('text=Failed to fetch workflow status')).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Mock delayed API response
    await page.route('/api/content/generate*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWorkflowStatus)
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show loading state
    await expect(page.locator('text=Loading Workflow...')).toBeVisible();
    await expect(page.locator('text=Getting real-time status from AI agents')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should display workflow with valid ID', async ({ page }) => {
    // Mock successful API response
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWorkflowStatus)
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show workflow content
    await expect(page.locator('text=Workflow in Progress')).toBeVisible();
    await expect(page.locator('text=Watch your AI agents collaborate in real-time')).toBeVisible();
  });

  test('should display project status card', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check project info
    await expect(page.locator('text=AI Content Generation Project')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible(); // Progress percentage
    await expect(page.locator('text=3 of 6 agents complete')).toBeVisible();
    await expect(page.locator('text=ETA:')).toBeVisible();
  });

  test('should display content generation pipeline', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check pipeline section
    await expect(page.locator('text=Content Generation Pipeline')).toBeVisible();
    await expect(page.locator('text=Real-time progress through the content creation workflow')).toBeVisible();
  });

  test('should display stage details and outputs', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check stage details section
    await expect(page.locator('text=Stage Details & Outputs')).toBeVisible();
    await expect(page.locator('text=Detailed view of each workflow stage')).toBeVisible();
    
    // Check agent information
    await expect(page.locator('text=Market Researcher')).toBeVisible();
    await expect(page.locator('text=Content Strategist')).toBeVisible();
    await expect(page.locator('text=Content Writer')).toBeVisible();
  });

  test('should display AI agents status sidebar', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check agents status section
    await expect(page.locator('text=AI Agents Status')).toBeVisible();
    await expect(page.locator('text=Current activity of each AI agent')).toBeVisible();
  });

  test('should display live activity feed', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check live activity section
    await expect(page.locator('text=Live Activity')).toBeVisible();
    await expect(page.locator('text=Real-time updates from AI agents')).toBeVisible();
  });

  test('should display quick actions sidebar', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check quick actions
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Export Progress Report')).toBeVisible();
    await expect(page.locator('text=Force Complete Stage')).toBeVisible();
    await expect(page.locator('text=Go to Quality Control')).toBeVisible();
  });

  test('should have pause/resume functionality', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check pause button exists
    await expect(page.locator('text=Pause')).toBeVisible();
    
    // Click pause button
    await page.locator('text=Pause').click();
    
    // Should change to resume
    await expect(page.locator('text=Resume')).toBeVisible();
  });

  test('should link to quality control page', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check Preview Result button
    const previewButton = page.locator('a[href="/quality?id=test-123"]').first();
    await expect(previewButton).toBeVisible();
    await expect(previewButton).toContainText('Preview Result');
    
    // Check Go to Quality Control button
    const qualityButton = page.locator('a[href="/quality?id=test-123"]').last();
    await expect(qualityButton).toBeVisible();
  });

  test('should display current time', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check that current time is displayed
    await expect(page.locator('text=Current time')).toBeVisible();
    
    // Time should be in HH:MM format (rough check)
    const timeRegex = /\d{1,2}:\d{2}\s?(AM|PM)/;
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible();
  });

  test('should show agent progress bars', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.goto('/workflow?id=test-123');
    
    // Check for progress indicators
    await expect(page.locator('text=Progress')).toBeVisible();
    
    // Check that progress bars are rendered (look for progress elements)
    const progressBars = page.locator('[style*="width:"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test('should handle completed workflow', async ({ page }) => {
    // Mock completed workflow
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockWorkflowStatus,
          status: 'completed',
          agents: mockWorkflowStatus.agents.map(agent => ({
            ...agent,
            status: 'completed',
            progress: 100
          }))
        })
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show 100% completion
    await expect(page.locator('text=100%')).toBeVisible();
    await expect(page.locator('text=6 of 6 agents complete')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await setupMockWorkflow(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/workflow?id=test-123');
    
    // Check main elements are visible on mobile
    await expect(page.locator('text=Workflow in Progress')).toBeVisible();
    await expect(page.locator('text=Content Generation Pipeline')).toBeVisible();
  });

  test('should handle workflow errors', async ({ page }) => {
    // Mock workflow with errors
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockWorkflowStatus,
          agents: mockWorkflowStatus.agents.map((agent, index) => ({
            ...agent,
            status: index === 0 ? 'failed' : agent.status,
            error: index === 0 ? 'Processing failed' : undefined
          }))
        })
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show error status
    await expect(page.locator('text=failed')).toBeVisible();
    await expect(page.locator('text=Error: Processing failed')).toBeVisible();
  });
});

// Mock workflow status data
const mockWorkflowStatus = {
  status: 'running',
  startTime: new Date().toISOString(),
  estimatedTimeRemaining: 10,
  currentAgent: 'content-writer',
  content: {
    title: 'AI Content Generation Project'
  },
  agents: [
    {
      agentId: 'market-researcher',
      status: 'completed',
      progress: 100,
      startTime: new Date().toISOString(),
      duration: 120
    },
    {
      agentId: 'audience-analyzer',
      status: 'completed',
      progress: 100,
      startTime: new Date().toISOString(),
      duration: 90
    },
    {
      agentId: 'content-strategist',
      status: 'completed',
      progress: 100,
      startTime: new Date().toISOString(),
      duration: 150
    },
    {
      agentId: 'content-writer',
      status: 'running',
      progress: 65,
      startTime: new Date().toISOString()
    },
    {
      agentId: 'content-editor',
      status: 'pending',
      progress: 0
    },
    {
      agentId: 'ai-seo-optimizer',
      status: 'pending',
      progress: 0
    }
  ]
};

async function setupMockWorkflow(page: any) {
  await page.route('/api/content/generate*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockWorkflowStatus)
    });
  });
}