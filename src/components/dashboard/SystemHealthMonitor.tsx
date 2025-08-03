'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from 'react-use-websocket';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Database, Zap, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface SystemStatus {
  api: {
    status: 'healthy' | 'degraded' | 'down';
    description: string;
  };
  contentEngine: {
    status: 'healthy' | 'degraded' | 'down';
    description: string;
    activeWorkflows?: number;
    runningWorkflows?: number;
  };
  storage: {
    status: 'healthy' | 'degraded' | 'down';
    description: string;
  };
  statistics?: {
    totalActive: number;
    running: number;
    completed: number;
    failed: number;
  };
}

interface SSEMessage {
  type: 'connected' | 'system_status' | 'workflow_updates' | 'heartbeat' | 'error';
  timestamp: string;
  data?: SystemStatus;
  message?: string;
}

export function SystemHealthMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [usePolling, setUsePolling] = useState(false);

  // Fallback polling function
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.systemStatus) {
        setSystemStatus(data.systemStatus);
        setLastUpdate(new Date());
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (usePolling) {
      // Initial fetch
      fetchStatus();
      
      // Set up polling interval
      const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [usePolling, fetchStatus]);

  // Try SSE first, fallback to polling
  const { lastEvent, readyState } = useEventSource('/api/status/stream', {
    withCredentials: false,
    events: {
      message: (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              setConnectionStatus('connected');
              setUsePolling(false); // SSE is working
              break;
              
            case 'system_status':
              if (data.data) {
                setSystemStatus(data.data);
                setLastUpdate(new Date());
                setUsePolling(false); // SSE is working
              }
              break;
              
            case 'heartbeat':
              setLastUpdate(new Date());
              break;
              
            case 'error':
              console.error('SSE Error:', data.message);
              setConnectionStatus('error');
              setUsePolling(true); // Fallback to polling
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          setUsePolling(true); // Fallback to polling
        }
      },
    },
  });

  // Monitor SSE connection and fallback to polling if needed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (readyState === 0 || readyState === 2 || readyState === 3) {
        console.log('SSE connection failed, falling back to polling');
        setUsePolling(true);
      }
    }, 10000); // Wait 10 seconds for SSE to connect

    return () => clearTimeout(timeout);
  }, [readyState]);

  // Update connection status based on readyState
  useEffect(() => {
    if (!usePolling) {
      switch (readyState) {
        case 0: // CONNECTING
          setConnectionStatus('connecting');
          break;
        case 1: // OPEN
          setConnectionStatus('connected');
          break;
        case 2: // CLOSED
          setConnectionStatus('disconnected');
          setUsePolling(true); // Fallback to polling
          break;
        default:
          setConnectionStatus('error');
          setUsePolling(true); // Fallback to polling
      }
    }
  }, [readyState, usePolling]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <Activity className="w-3 h-3 text-green-500" />, text: 'Live', color: 'text-green-400' };
      case 'connecting':
        return { icon: <Clock className="w-3 h-3 text-yellow-500 animate-spin" />, text: 'Connecting', color: 'text-yellow-400' };
      case 'disconnected':
        return { icon: <AlertCircle className="w-3 h-3 text-red-500" />, text: 'Disconnected', color: 'text-red-400' };
      case 'error':
        return { icon: <AlertCircle className="w-3 h-3 text-red-500" />, text: 'Error', color: 'text-red-400' };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div className="space-y-4">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">System Health</h2>
        <div className="flex items-center space-x-2">
          {connectionDisplay.icon}
          <span className={`text-sm font-medium ${connectionDisplay.color}`}>
            {connectionDisplay.text}
          </span>
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Status */}
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">API Status</h3>
                  <p className="text-xs text-slate-400">
                    {systemStatus?.api?.description || 'Checking...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus?.api?.status || 'unknown')}
                <span className={`text-sm capitalize ${getStatusColor(systemStatus?.api?.status || 'unknown')}`}>
                  {systemStatus?.api?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Engine Status */}
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Content Engine</h3>
                  <p className="text-xs text-slate-400">
                    {systemStatus?.contentEngine?.description || 'Checking...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus?.contentEngine?.status || 'unknown')}
                <span className={`text-sm capitalize ${getStatusColor(systemStatus?.contentEngine?.status || 'unknown')}`}>
                  {systemStatus?.contentEngine?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Data Storage</h3>
                  <p className="text-xs text-slate-400">
                    {systemStatus?.storage?.description || 'Checking...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus?.storage?.status || 'unknown')}
                <span className={`text-sm capitalize ${getStatusColor(systemStatus?.storage?.status || 'unknown')}`}>
                  {systemStatus?.storage?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Row */}
      {systemStatus?.statistics && (
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {systemStatus.statistics.totalActive}
                </div>
                <div className="text-xs text-slate-400">Active Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {systemStatus.statistics.running}
                </div>
                <div className="text-xs text-slate-400">Currently Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {systemStatus.statistics.completed}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {systemStatus.statistics.failed}
                </div>
                <div className="text-xs text-slate-400">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}