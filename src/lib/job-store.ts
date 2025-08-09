/**
 * Persistent job storage for serverless environments
 * Uses filesystem to maintain job state across function invocations
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AgentStatus {
  agentId: string;
  status: 'pending' | 'running' | 'completed';
  startTime?: number;
  endTime?: number;
}

export interface JobResult {
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    generatedAt: string;
    requestData?: any;
  };
}

export interface Job {
  id: string;
  status: 'running' | 'completed';
  createdAt: number;
  agents: AgentStatus[];
  requestData?: any;
  result?: JobResult;
}

// Use /tmp for Netlify functions (writable in serverless)
const STORAGE_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/jobs' 
  : path.join(process.cwd(), '.jobs');

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// Generate unique job ID
export function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `job_${timestamp}_${random}`;
}

// Save job to filesystem
export function saveJob(job: Job): void {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${job.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(job, null, 2));
}

// Load job from filesystem
export function loadJob(jobId: string): Job | null {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${jobId}.json`);
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading job ${jobId}:`, error);
  }
  
  return null;
}

// List all jobs
export function listJobs(): Job[] {
  ensureStorageDir();
  
  try {
    const files = fs.readdirSync(STORAGE_DIR)
      .filter(f => f.endsWith('.json'));
    
    return files.map(file => {
      const data = fs.readFileSync(path.join(STORAGE_DIR, file), 'utf-8');
      return JSON.parse(data);
    }).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing jobs:', error);
    return [];
  }
}

// Clean old jobs (optional, for maintenance)
export function cleanOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  ensureStorageDir();
  const now = Date.now();
  
  try {
    const files = fs.readdirSync(STORAGE_DIR)
      .filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(STORAGE_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error cleaning old jobs:', error);
  }
}