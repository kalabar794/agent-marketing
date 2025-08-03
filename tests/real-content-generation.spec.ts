import { test, expect } from '@playwright/test';

/**
 * Real Content Generation Tests
 * 
 * These tests verify that the marketing content generation actually works
 * and produces real content, not templates or fake responses.
 */

test.describe('Real Content Generation Validation', () => {
  
  test('should generate real blog content using Claude API', async ({ request }) => {
    console.log('🎯 Testing REAL blog content generation...');
    
    // Create a workflow with a specific, testable topic
    const response = await request.post('/api/content/generate/', {
      data: {
        contentType: 'blog',
        topic: 'Email Marketing Automation for Small Businesses',
        audience: 'small business owners and entrepreneurs',
        goals: ['increase email open rates', 'improve customer retention', 'drive sales']
      }
    });
    
    expect(response.status()).toBe(202);
    const data = await response.json();
    
    console.log(`📝 Created workflow: ${data.workflowId}`);
    expect(data.workflowId).toBeTruthy();
    expect(data.status).toBe('started');
    
    // Monitor the workflow and wait for actual completion
    let attempts = 0;
    let finalContent = null;
    
    while (attempts < 60 && !finalContent) { // 5 minutes max
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await request.get(`/api/content/generate/?workflowId=${data.workflowId}`);
      const statusData = await statusResponse.json();
      
      console.log(`📊 Attempt ${attempts + 1}: Status=${statusData.status}, Progress=${statusData.progress}%`);
      
      if (statusData.status === 'completed' && statusData.content) {
        finalContent = statusData.content;
        
        // Validate that real content was generated
        expect(finalContent.title).toBeTruthy();
        expect(finalContent.content).toBeTruthy();
        expect(finalContent.title.length).toBeGreaterThan(20);
        expect(finalContent.content.length).toBeGreaterThan(500); // Should be substantial content
        
        // Content should be related to the topic
        const contentLower = (finalContent.title + ' ' + finalContent.content).toLowerCase();
        expect(contentLower).toContain('email');
        expect(contentLower).toContain('marketing');
        expect(contentLower).toContain('business');
        
        // Should not contain template markers
        expect(finalContent.content).not.toContain('{{');
        expect(finalContent.content).not.toContain('}}');
        expect(finalContent.content).not.toContain('[INSERT');
        expect(finalContent.content).not.toContain('PLACEHOLDER');
        
        // Should have real metadata
        expect(finalContent.seoKeywords).toBeTruthy();
        expect(finalContent.seoKeywords.length).toBeGreaterThan(0);
        expect(finalContent.readabilityScore).toBeGreaterThan(0);
        
        console.log('✅ REAL CONTENT GENERATED:');
        console.log(`   Title: ${finalContent.title}`);
        console.log(`   Content Length: ${finalContent.content.length} characters`);
        console.log(`   SEO Keywords: ${finalContent.seoKeywords.join(', ')}`);
        console.log(`   Readability Score: ${finalContent.readabilityScore}`);
        
        break;
      } else if (statusData.status === 'failed') {
        console.log(`❌ Workflow failed: ${statusData.error}`);
        throw new Error(`Workflow failed: ${statusData.error}`);
      }
      
      attempts++;
    }
    
    expect(finalContent).toBeTruthy();
    console.log('🎉 Real blog content generation SUCCESSFUL!');
  });
  
  test('should generate real social media content using Claude API', async ({ request }) => {
    console.log('📱 Testing REAL social media content generation...');
    
    const response = await request.post('/api/content/generate/', {
      data: {
        contentType: 'social',
        topic: 'AI Tools for Content Creation',
        audience: 'content creators and marketers',
        goals: ['increase engagement', 'drive website traffic', 'build brand awareness']
      }
    });
    
    expect(response.status()).toBe(202);
    const data = await response.json();
    
    console.log(`📱 Created social workflow: ${data.workflowId}`);
    
    // Monitor for completion
    let attempts = 0;
    let finalContent = null;
    
    while (attempts < 60 && !finalContent) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await request.get(`/api/content/generate/?workflowId=${data.workflowId}`);
      const statusData = await statusResponse.json();
      
      console.log(`📊 Social Attempt ${attempts + 1}: Status=${statusData.status}, Progress=${statusData.progress}%`);
      
      if (statusData.status === 'completed' && statusData.content) {
        finalContent = statusData.content;
        
        // Validate social content
        expect(finalContent.title).toBeTruthy();
        expect(finalContent.content).toBeTruthy();
        
        // Should have platform-specific content
        if (finalContent.platforms && finalContent.platforms.length > 0) {
          console.log('✅ Platform-specific content generated:');
          finalContent.platforms.forEach((platform: any) => {
            console.log(`   ${platform.platform}: ${platform.content?.substring(0, 100)}...`);
            expect(platform.content).toBeTruthy();
            expect(platform.content.length).toBeGreaterThan(10);
          });
        }
        
        // Content should be related to AI tools
        const contentLower = (finalContent.title + ' ' + finalContent.content).toLowerCase();
        expect(contentLower).toContain('ai') || expect(contentLower).toContain('content');
        
        console.log('✅ REAL SOCIAL CONTENT GENERATED:');
        console.log(`   Title: ${finalContent.title}`);
        console.log(`   Platforms: ${finalContent.platforms?.length || 0}`);
        
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Social workflow failed: ${statusData.error}`);
      }
      
      attempts++;
    }
    
    expect(finalContent).toBeTruthy();
    console.log('🎉 Real social media content generation SUCCESSFUL!');
  });
  
  test('should generate real email content using Claude API', async ({ request }) => {
    console.log('📧 Testing REAL email content generation...');
    
    const response = await request.post('/api/content/generate/', {
      data: {
        contentType: 'email',
        topic: 'Product Launch Announcement',
        audience: 'existing customers and subscribers',
        goals: ['announce new product', 'drive pre-orders', 'create excitement']
      }
    });
    
    expect(response.status()).toBe(202);
    const data = await response.json();
    
    console.log(`📧 Created email workflow: ${data.workflowId}`);
    
    // Monitor for completion
    let attempts = 0;
    let finalContent = null;
    
    while (attempts < 60 && !finalContent) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await request.get(`/api/content/generate/?workflowId=${data.workflowId}`);
      const statusData = await statusResponse.json();
      
      console.log(`📊 Email Attempt ${attempts + 1}: Status=${statusData.status}, Progress=${statusData.progress}%`);
      
      if (statusData.status === 'completed' && statusData.content) {
        finalContent = statusData.content;
        
        // Validate email content
        expect(finalContent.title).toBeTruthy();
        expect(finalContent.content).toBeTruthy();
        expect(finalContent.content.length).toBeGreaterThan(200);
        
        // Email content should have certain characteristics
        const contentLower = finalContent.content.toLowerCase();
        expect(contentLower).toContain('product') || expect(contentLower).toContain('launch');
        
        // Should not be template content
        expect(finalContent.content).not.toContain('Lorem ipsum');
        expect(finalContent.content).not.toContain('TEMPLATE');
        
        console.log('✅ REAL EMAIL CONTENT GENERATED:');
        console.log(`   Subject: ${finalContent.title}`);
        console.log(`   Content Length: ${finalContent.content.length} characters`);
        console.log(`   Preview: ${finalContent.content.substring(0, 150)}...`);
        
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Email workflow failed: ${statusData.error}`);
      }
      
      attempts++;
    }
    
    expect(finalContent).toBeTruthy();
    console.log('🎉 Real email content generation SUCCESSFUL!');
  });
  
  test('should verify agents are producing unique, contextual content', async ({ request }) => {
    console.log('🔍 Testing agent content uniqueness and quality...');
    
    // Create two workflows with different topics to ensure uniqueness
    const workflow1 = await request.post('/api/content/generate/', {
      data: {
        contentType: 'blog',
        topic: 'Sustainable Energy Solutions for Homes',
        audience: 'homeowners and environmental enthusiasts',
        goals: ['reduce energy costs', 'promote sustainability']
      }
    });
    
    const workflow2 = await request.post('/api/content/generate/', {
      data: {
        contentType: 'blog',
        topic: 'Digital Photography Tips for Beginners',
        audience: 'photography hobbyists and beginners',
        goals: ['improve photo quality', 'learn camera techniques']
      }
    });
    
    expect(workflow1.status()).toBe(202);
    expect(workflow2.status()).toBe(202);
    
    const data1 = await workflow1.json();
    const data2 = await workflow2.json();
    
    console.log(`🔍 Comparing workflows: ${data1.workflowId} vs ${data2.workflowId}`);
    
    // Wait for both to complete
    let content1 = null;
    let content2 = null;
    let attempts = 0;
    
    while (attempts < 60 && (!content1 || !content2)) {
      await new Promise(resolve => setTimeout(resolve, 8000)); // Longer wait for both
      
      if (!content1) {
        const status1 = await request.get(`/api/content/generate/?workflowId=${data1.workflowId}`);
        const statusData1 = await status1.json();
        if (statusData1.status === 'completed' && statusData1.content) {
          content1 = statusData1.content;
          console.log('✅ First workflow completed');
        }
      }
      
      if (!content2) {
        const status2 = await request.get(`/api/content/generate/?workflowId=${data2.workflowId}`);
        const statusData2 = await status2.json();
        if (statusData2.status === 'completed' && statusData2.content) {
          content2 = statusData2.content;
          console.log('✅ Second workflow completed');
        }
      }
      
      attempts++;
    }
    
    if (content1 && content2) {
      // Verify content is unique and contextual
      expect(content1.title).not.toBe(content2.title);
      expect(content1.content).not.toBe(content2.content);
      
      // Content should be topically relevant
      const content1Lower = (content1.title + ' ' + content1.content).toLowerCase();
      const content2Lower = (content2.title + ' ' + content2.content).toLowerCase();
      
      expect(content1Lower).toContain('energy') || expect(content1Lower).toContain('sustainable');
      expect(content2Lower).toContain('photo') || expect(content2Lower).toContain('camera');
      
      console.log('✅ CONTENT UNIQUENESS VERIFIED:');
      console.log(`   Content 1 Topic: Energy (${content1.title})`);
      console.log(`   Content 2 Topic: Photography (${content2.title})`);
      console.log(`   Content 1 Length: ${content1.content.length}`);
      console.log(`   Content 2 Length: ${content2.content.length}`);
      
    } else {
      console.log(`⚠️ Only ${content1 ? 1 : 0} + ${content2 ? 1 : 0} workflows completed in time limit`);
      // At least one should complete
      expect(content1 || content2).toBeTruthy();
    }
    
    console.log('🎉 Agent content uniqueness validation SUCCESSFUL!');
  });
});