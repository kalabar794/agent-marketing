#!/usr/bin/env node

const { EnhancedWorkflow } = require('./dist/lib/enhanced-workflow.js');

async function testWorkflowExtraction() {
  console.log('🧪 Testing Enhanced Workflow Content Extraction...');
  
  try {
    const workflow = new EnhancedWorkflow('test-workflow-1');
    
    // Mock agent outputs in the new simplified format from ContentWriter
    const mockOutputs = {
      'content-writer': {
        title: 'The Complete Guide to Dog Training for Pet Owners',
        introduction: 'Dog training is an essential skill every pet owner should master. This comprehensive guide provides proven strategies, expert insights, and practical techniques to transform your relationship with your furry companion.',
        sections: [
          {
            heading: 'Understanding Your Dog\'s Psychology',
            content: 'Before diving into training techniques, it\'s crucial to understand how your dog thinks and learns. Dogs are intelligent creatures with their own unique personalities, learning styles, and motivations.'
          },
          {
            heading: 'Foundation Training Commands',
            content: 'Building a solid foundation with basic commands is essential for effective dog training. These fundamental skills create the groundwork for more advanced training and establish clear communication between you and your dog.'
          },
          {
            heading: 'Positive Reinforcement Techniques',
            content: 'Positive reinforcement is the most effective and humane method for training dogs. This approach focuses on rewarding good behavior rather than punishing bad behavior, creating a positive learning environment.'
          }
        ],
        conclusion: 'Effective dog training requires patience, consistency, and understanding. By following the strategies outlined in this guide, you\'ll develop a stronger bond with your pet while achieving excellent training results.',
        callToAction: 'Ready to transform your dog training experience? Start implementing these proven techniques today and see the remarkable difference in your pet\'s behavior.'
      },
      'market-researcher': {
        industry: 'Pet Care & Training',
        trends: ['Positive reinforcement methods gaining popularity', 'Increased focus on dog psychology'],
        opportunities: ['Growing pet ownership market', 'Digital training resources demand']
      }
    };
    
    console.log('📊 Testing content extraction methods...');
    
    // Test the private methods by accessing them through reflection or creating a wrapper
    // Since the methods are private, we'll test the public assembleFinalContent method
    
    // First, let's simulate the workflow state
    workflow.agentOutputs = mockOutputs;
    
    // Test the assembleFinalContent method which uses the extraction methods
    const finalContent = await workflow.assembleFinalContent();
    
    console.log('📝 Extracted Title:', finalContent.title);
    console.log('📄 Extracted Content Preview:', finalContent.content.substring(0, 200) + '...');
    
    // Verify the content is not literal strings
    if (finalContent.title === 'title' || finalContent.title === 'Title') {
      console.log('❌ BUG STILL EXISTS: Title is literal string');
    } else {
      console.log('✅ Title extraction working correctly');
    }
    
    if (finalContent.content === 'content' || finalContent.content === 'Content') {
      console.log('❌ BUG STILL EXISTS: Content is literal string');
    } else {
      console.log('✅ Content extraction working correctly');
    }
    
    // Check if the extracted content contains expected keywords
    if (finalContent.title.toLowerCase().includes('dog') && finalContent.title.toLowerCase().includes('training')) {
      console.log('✅ Title contains expected keywords');
    } else {
      console.log('❌ Title does not contain expected keywords');
    }
    
    if (finalContent.content.toLowerCase().includes('dog') && finalContent.content.toLowerCase().includes('training')) {
      console.log('✅ Content contains expected keywords');
    } else {
      console.log('❌ Content does not contain expected keywords');
    }
    
    console.log('\n🎯 Final Content Object:');
    console.log(JSON.stringify({
      title: finalContent.title,
      contentPreview: finalContent.content.substring(0, 300) + '...',
      summary: finalContent.summary.substring(0, 200) + '...'
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkflowExtraction();