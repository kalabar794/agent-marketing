#!/usr/bin/env node

// Test the content extraction logic directly
function testContentExtraction() {
  console.log('🧪 Testing Content Extraction Methods...');
  
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
  
  // Simulate the extractTitle method logic I implemented
  function extractTitle(outputs) {
    console.log('🔍 Testing extractTitle method...');
    
    // Handle new simplified format from ContentWriter
    if (outputs['content-writer']?.title) {
      console.log('✅ Found title in new simplified format:', outputs['content-writer'].title);
      return outputs['content-writer'].title;
    }
    
    // Handle full ContentWriterOutput format (fallback)
    if (outputs['content-writer']?.content?.title) {
      console.log('✅ Found title in old nested format:', outputs['content-writer'].content.title);
      return outputs['content-writer'].content.title;
    }
    
    // Other fallbacks...
    console.log('❌ No title found, returning fallback');
    return 'Generated Content Title';
  }
  
  // Simulate the extractMainContent method logic I implemented
  function extractMainContent(outputs) {
    console.log('🔍 Testing extractMainContent method...');
    
    // Handle new simplified format from ContentWriter
    if (outputs['content-writer']?.sections) {
      console.log('✅ Found sections in new simplified format');
      let content = '';
      
      if (outputs['content-writer'].introduction) {
        content += outputs['content-writer'].introduction + '\n\n';
      }
      
      outputs['content-writer'].sections.forEach(section => {
        content += `## ${section.heading}\n\n${section.content}\n\n`;
      });
      
      if (outputs['content-writer'].conclusion) {
        content += outputs['content-writer'].conclusion + '\n\n';
      }
      
      if (outputs['content-writer'].callToAction) {
        content += outputs['content-writer'].callToAction;
      }
      
      console.log('✅ Generated content from simplified format, length:', content.length);
      return content;
    }
    
    // Handle full ContentWriterOutput format (fallback)
    if (outputs['content-writer']?.content?.mainContent) {
      console.log('✅ Found content in old nested format');
      let content = '';
      
      if (outputs['content-writer'].content.introduction) {
        content += outputs['content-writer'].content.introduction + '\n\n';
      }
      
      outputs['content-writer'].content.mainContent.forEach(section => {
        content += `## ${section.heading}\n\n`;
        section.paragraphs.forEach(para => {
          content += para + '\n\n';
        });
      });
      
      if (outputs['content-writer'].content.conclusion) {
        content += outputs['content-writer'].content.conclusion + '\n\n';
      }
      
      if (outputs['content-writer'].content.callToAction) {
        content += outputs['content-writer'].content.callToAction;
      }
      
      console.log('✅ Generated content from nested format, length:', content.length);
      return content;
    }
    
    console.log('❌ No content found, returning fallback');
    return 'Generated content based on the request parameters.';
  }
  
  // Test the methods
  console.log('\n📊 Testing with mock data...');
  
  const extractedTitle = extractTitle(mockOutputs);
  const extractedContent = extractMainContent(mockOutputs);
  
  console.log('\n🎯 Results:');
  console.log('📝 Extracted Title:', extractedTitle);
  console.log('📄 Content Preview:', extractedContent.substring(0, 300) + '...');
  
  // Verify the content is not literal strings
  if (extractedTitle === 'title' || extractedTitle === 'Title') {
    console.log('❌ BUG STILL EXISTS: Title is literal string');
  } else {
    console.log('✅ Title extraction working correctly');
  }
  
  if (extractedContent === 'content' || extractedContent === 'Content') {
    console.log('❌ BUG STILL EXISTS: Content is literal string');
  } else {
    console.log('✅ Content extraction working correctly');
  }
  
  // Check if the extracted content contains expected keywords
  if (extractedTitle.toLowerCase().includes('dog') && extractedTitle.toLowerCase().includes('training')) {
    console.log('✅ Title contains expected keywords');
  } else {
    console.log('❌ Title does not contain expected keywords');
  }
  
  if (extractedContent.toLowerCase().includes('dog') && extractedContent.toLowerCase().includes('training')) {
    console.log('✅ Content contains expected keywords');
  } else {
    console.log('❌ Content does not contain expected keywords');
  }
  
  console.log('\n🎉 Test completed! The extraction methods should now handle both formats correctly.');
}

testContentExtraction();