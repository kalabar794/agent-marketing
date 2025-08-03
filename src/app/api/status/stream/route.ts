import { NextRequest } from 'next/server';
import { EnhancedContentWorkflow } from '@/lib/enhanced-workflow';

// Force Node.js runtime for streaming
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute max connection for Netlify

export async function GET(request: NextRequest) {
  // Set up Server-Sent Events headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  let isActive = true;
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Real-time monitoring connected'
      })}\n\n`);

      // Stream status updates every 3 seconds
      const intervalId = setInterval(async () => {
        if (!isActive) {
          clearInterval(intervalId);
          return;
        }

        try {
          // Get system status
          const systemStatus = await getSystemStatus();
          
          // Send system status update
          controller.enqueue(`data: ${JSON.stringify({
            type: 'system_status',
            timestamp: new Date().toISOString(),
            data: systemStatus
          })}\n\n`);

          // Get active workflows
          const workflowUpdates = await getActiveWorkflowUpdates();
          
          // Send workflow updates
          if (workflowUpdates.length > 0) {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'workflow_updates',
              timestamp: new Date().toISOString(),
              data: workflowUpdates
            })}\n\n`);
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);

        } catch (error) {
          console.error('SSE stream error:', error);
          
          // Send error to client
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            timestamp: new Date().toISOString(),
            message: 'Error fetching status updates'
          })}\n\n`);
        }
      }, 3000); // Update every 3 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {
          // Connection already closed
        }
      });
    },

    cancel() {
      isActive = false;
    }
  });

  return new Response(stream, { headers: responseHeaders });
}

async function getSystemStatus() {
  try {
    // Get active workflow instances
    const activeWorkflows = EnhancedContentWorkflow.instances || new Map();
    const activeCount = activeWorkflows.size;
    
    // Calculate system health metrics
    let healthyCount = 0;
    let runningCount = 0;
    let failedCount = 0;

    for (const [id, workflow] of activeWorkflows) {
      try {
        const status = await workflow.getStatus();
        if (status.status === 'completed') healthyCount++;
        else if (status.status === 'running') runningCount++;
        else if (status.status === 'failed') failedCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      api: {
        status: 'healthy',
        description: 'All systems operational'
      },
      contentEngine: {
        status: 'healthy',
        description: `${activeCount} active workflows`,
        activeWorkflows: activeCount,
        runningWorkflows: runningCount
      },
      storage: {
        status: 'healthy',
        description: 'Storage available'
      },
      statistics: {
        totalActive: activeCount,
        running: runningCount,
        completed: healthyCount,
        failed: failedCount
      }
    };
  } catch (error) {
    console.error('Error getting system status:', error);
    return {
      api: {
        status: 'degraded',
        description: 'Limited functionality'
      },
      contentEngine: {
        status: 'unknown',
        description: 'Status unavailable'
      },
      storage: {
        status: 'unknown',
        description: 'Status unavailable'
      }
    };
  }
}

async function getActiveWorkflowUpdates() {
  try {
    const activeWorkflows = EnhancedContentWorkflow.instances || new Map();
    const updates = [];
    
    for (const [id, workflow] of activeWorkflows) {
      try {
        const status = await workflow.getStatus();
        
        // Only include workflows that are actively running or recently completed
        if (status.status === 'running' || 
            (status.status === 'completed' && status.endTime && 
             Date.now() - status.endTime.getTime() < 300000)) { // Last 5 minutes
          
          updates.push({
            id: status.id,
            status: status.status,
            progress: status.progress,
            currentAgent: status.currentAgent,
            startTime: status.startTime,
            endTime: status.endTime,
            agents: status.agents?.map(agent => ({
              agentId: agent.agentId,
              status: agent.status,
              progress: agent.progress
            })) || [],
            estimatedTimeRemaining: status.estimatedTimeRemaining
          });
        }
      } catch (error) {
        console.error(`Error getting status for workflow ${id}:`, error);
      }
    }
    
    return updates;
  } catch (error) {
    console.error('Error getting workflow updates:', error);
    return [];
  }
}