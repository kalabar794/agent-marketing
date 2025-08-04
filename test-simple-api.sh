#!/bin/bash

echo "🧪 Testing API endpoint..."

# Test the API endpoint
response=$(curl -s -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "blog",
    "topic": "Dog Training",
    "audience": "Pet Owners", 
    "tone": "friendly",
    "goals": "Create engaging content about dog training"
  }')

echo "📊 API Response:"
echo "$response" | head -10

# Check if we got a workflow ID
if echo "$response" | grep -q "workflowId"; then
    workflowId=$(echo "$response" | grep -o '"workflowId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Workflow started with ID: $workflowId"
    
    # Check workflow status after a few seconds
    sleep 5
    echo "🔍 Checking workflow status..."
    curl -s "http://localhost:3000/api/content/generate?workflowId=$workflowId" | head -20
else
    echo "❌ Failed to start workflow"
fi