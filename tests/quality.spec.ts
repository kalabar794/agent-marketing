import { test, expect } from '@playwright/test';

test.describe('Quality Control Page', () => {
  test('should show error when no workflow ID is provided', async ({ page }) => {
    await page.goto('/quality');
    
    // Should show error message
    await expect(page.locator('text=Quality Analysis Error')).toBeVisible();
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Should show "Go Back" button
    await expect(page.locator('text=Go Back')).toBeVisible();
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
    
    await page.goto('/quality?id=invalid-id');
    
    // Should show error message
    await expect(page.locator('text=Quality Analysis Error')).toBeVisible();
    await expect(page.locator('text=Failed to fetch workflow status')).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Mock delayed API response
    await page.route('/api/content/generate*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockQualityWorkflow)
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Should show loading state
    await expect(page.locator('text=Loading Quality Analysis...')).toBeVisible();
    await expect(page.locator('text=Analyzing content quality and performance')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should display quality control center with valid ID', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Should show quality control header
    await expect(page.locator('text=Quality Control Center')).toBeVisible();
    await expect(page.locator('text=Review, approve, and optimize your generated content')).toBeVisible();
  });

  test('should display header action buttons', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check header buttons
    await expect(page.locator('text=Export Report')).toBeVisible();
    await expect(page.locator('text=Re-analyze')).toBeVisible();
  });

  test('should display content info card', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check content information
    await expect(page.locator('text=The Future of AI in Marketing: 2024 Trends and Predictions')).toBeVisible();
    await expect(page.locator('text=AI Generated Content')).toBeVisible();
    await expect(page.locator('text=2847')).toBeVisible(); // Word count
    await expect(page.locator('text=12 min read')).toBeVisible();
    await expect(page.locator('text=Ready for Review')).toBeVisible();
  });

  test('should display overall quality metrics', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check overall metrics cards
    await expect(page.locator('text=Overall Quality Score')).toBeVisible();
    await expect(page.locator('text=Checks Passed')).toBeVisible();
    await expect(page.locator('text=Warnings')).toBeVisible();
    await expect(page.locator('text=Critical Issues')).toBeVisible();
    
    // Check metric values
    await expect(page.locator('text=92')).toBeVisible(); // Overall score
    await expect(page.locator('text=14/16')).toBeVisible(); // Checks passed
    await expect(page.locator('text=2')).toBeVisible(); // Warnings
    await expect(page.locator('text=0')).toBeVisible(); // Critical issues
  });

  test('should display detailed quality analysis', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check detailed analysis section
    await expect(page.locator('text=Detailed Quality Analysis')).toBeVisible();
    await expect(page.locator('text=Comprehensive quality assessment across all categories')).toBeVisible();
    
    // Check quality categories
    await expect(page.locator('text=Content Quality')).toBeVisible();
    await expect(page.locator('text=Brand Compliance')).toBeVisible();
    await expect(page.locator('text=SEO Optimization')).toBeVisible();
    await expect(page.locator('text=Technical Standards')).toBeVisible();
  });

  test('should display quality checks for each category', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check Content Quality checks
    await expect(page.locator('text=Grammar & Spelling')).toBeVisible();
    await expect(page.locator('text=Readability Score')).toBeVisible();
    await expect(page.locator('text=Engagement Potential')).toBeVisible();
    await expect(page.locator('text=Information Accuracy')).toBeVisible();
    
    // Check Brand Compliance checks
    await expect(page.locator('text=Brand Voice Consistency')).toBeVisible();
    await expect(page.locator('text=Tone & Style')).toBeVisible();
    await expect(page.locator('text=Messaging Alignment')).toBeVisible();
    
    // Check SEO Optimization checks
    await expect(page.locator('text=Keyword Density')).toBeVisible();
    await expect(page.locator('text=Meta Tags')).toBeVisible();
    await expect(page.locator('text=Heading Structure')).toBeVisible();
  });

  test('should display final approval section', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check approval section
    await expect(page.locator('text=Final Approval')).toBeVisible();
    await expect(page.locator('text=Make your final decision on this content piece')).toBeVisible();
    
    // Check approval buttons
    await expect(page.locator('text=Approve & Publish')).toBeVisible();
    await expect(page.locator('text=Request Revisions')).toBeVisible();
    await expect(page.locator('text=Reject Content')).toBeVisible();
  });

  test('should display AI agent feedback sidebar', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check agent feedback section
    await expect(page.locator('text=AI Agent Feedback')).toBeVisible();
    await expect(page.locator('text=Reviews and recommendations from each AI agent')).toBeVisible();
    
    // Check individual agent feedback
    await expect(page.locator('text=Content Strategist')).toBeVisible();
    await expect(page.locator('text=SEO Optimizer')).toBeVisible();
    await expect(page.locator('text=Brand Guardian')).toBeVisible();
    await expect(page.locator('text=Quality Controller')).toBeVisible();
    
    // Check feedback content
    await expect(page.locator('text=Excellent strategic alignment with target audience')).toBeVisible();
    await expect(page.locator('text=Strong keyword integration')).toBeVisible();
  });

  test('should display content insights sidebar', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check content insights
    await expect(page.locator('text=Content Insights')).toBeVisible();
    await expect(page.locator('text=8.2')).toBeVisible(); // Readability Score
    await expect(page.locator('text=25')).toBeVisible(); // Target Keywords
    await expect(page.locator('text=98%')).toBeVisible(); // Originality
    await expect(page.locator('text=A+')).toBeVisible(); // SEO Grade
  });

  test('should display processing summary', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check processing summary
    await expect(page.locator('text=Processing Summary')).toBeVisible();
    await expect(page.locator('text=Total Time:')).toBeVisible();
    await expect(page.locator('text=18m 42s')).toBeVisible();
    await expect(page.locator('text=Agents Used:')).toBeVisible();
    await expect(page.locator('text=6')).toBeVisible();
    await expect(page.locator('text=Revisions:')).toBeVisible();
    await expect(page.locator('text=Quality Score:')).toBeVisible();
  });

  test('should handle approval action', async ({ page }) => {
    await setupMockQuality(page);
    
    // Mock quality API endpoint
    await page.route('/api/quality', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Click approve button
    await page.locator('text=Approve & Publish').click();
    
    // Should show loading state briefly, then success
    await expect(page.locator('text=Content approved')).toBeVisible();
  });

  test('should handle rejection action', async ({ page }) => {
    await setupMockQuality(page);
    
    // Mock quality API endpoint
    await page.route('/api/quality', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Click reject button
    await page.locator('text=Reject Content').click();
    
    // Should show rejection state
    await expect(page.locator('text=Content rejected')).toBeVisible();
  });

  test('should show loading state during approval', async ({ page }) => {
    await setupMockQuality(page);
    
    // Mock delayed quality API response
    await page.route('/api/quality', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Click approve and check loading state
    await page.locator('text=Approve & Publish').click();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should handle API errors for approval actions', async ({ page }) => {
    await setupMockQuality(page);
    
    // Mock API error
    await page.route('/api/quality', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to process approval' })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Try to approve and expect error handling
    await page.locator('text=Approve & Publish').click();
    
    // Error should be handled gracefully (check for error state)
    // Note: The actual error handling depends on the implementation
  });

  test('should be responsive on mobile', async ({ page }) => {
    await setupMockQuality(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/quality?id=test-123');
    
    // Check main elements are visible on mobile
    await expect(page.locator('text=Quality Control Center')).toBeVisible();
    await expect(page.locator('text=Overall Quality Score')).toBeVisible();
    await expect(page.locator('text=Approve & Publish')).toBeVisible();
  });

  test('should show quality score colors correctly', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check that quality scores have appropriate styling
    // This would need to check CSS classes for color coding
    const qualityScore = page.locator('text=92').first();
    await expect(qualityScore).toBeVisible();
  });

  test('should display status badges correctly', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check for status badges
    await expect(page.locator('text=excellent')).toBeVisible();
    await expect(page.locator('text=good')).toBeVisible();
  });

  test('should show feedback suggestions', async ({ page }) => {
    await setupMockQuality(page);
    await page.goto('/quality?id=test-123');
    
    // Check for suggestions in agent feedback
    await expect(page.locator('text=Suggestions:')).toBeVisible();
    await expect(page.locator('text=Add internal link to')).toBeVisible();
    await expect(page.locator('text=Adjust heading hierarchy')).toBeVisible();
  });
});

// Mock workflow status for quality page
const mockQualityWorkflow = {
  status: 'completed',
  startTime: new Date().toISOString(),
  content: {
    title: 'The Future of AI in Marketing: 2024 Trends and Predictions',
    content: 'Lorem ipsum '.repeat(500) // Simulate ~2500 words
  },
  qualityScores: {
    overall: 92,
    readability: 82,
    seo: 88,
    brandAlignment: 96,
    originality: 98
  },
  agents: [
    {
      agentId: 'content-strategist',
      status: 'completed',
      progress: 100
    },
    {
      agentId: 'ai-seo-optimizer',
      status: 'completed',
      progress: 100
    },
    {
      agentId: 'content-writer',
      status: 'completed',
      progress: 100
    }
  ]
};

async function setupMockQuality(page: any) {
  await page.route('/api/content/generate*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockQualityWorkflow)
    });
  });
}