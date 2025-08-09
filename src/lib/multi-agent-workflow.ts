/**
 * In-memory multi‑agent job store and scheduler.
 *
 * This module manages multi‑agent jobs created by the content creation UI.
 * When a job is created via the API, it is assigned a unique `jobId` and
 * an initial status along with a list of agents. The job is then
 * automatically progressed over time to simulate each agent performing its
 * work. Consumers can poll the current job status via the `getJob` API.
 *
 * Note: This implementation uses a simple in-memory Map to persist job
 * state across API requests. In a serverless or edge environment the
 * state may not persist across cold starts; for a production system you
 * should replace this with a durable storage mechanism such as a database
 * or Redis.
 */

export type AgentStatus = {
  /** Identifier for the agent (e.g. `content-writer`). */
  agentId: string;
  /** Agents begin as `pending`, transition to `running`, and end `completed`. */
  status: 'pending' | 'running' | 'completed';
  /** Timestamp when the agent started; undefined until then. */
  startTime?: number;
  /** Timestamp when the agent completed; undefined until then. */
  endTime?: number;
  /** Optional error if the agent fails. */
  error?: string;
};

export type MultiAgentJob = {
  /** Unique ID prefixed with `job_` to distinguish from other IDs. */
  id: string;
  /** Overall job status (starts `running`, ends `completed`). */
  status: 'running' | 'completed';
  /** Creation timestamp. */
  createdAt: number;
  /** Array of participating agents and their current statuses. */
  agents: AgentStatus[];
};

// Global job store. Replace this with durable storage for production.
const jobs = new Map<string, MultiAgentJob>();

/** Generate a unique job identifier. */
function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `job_${timestamp}_${random}`;
}

/**
 * Create a new multi‑agent job and schedule asynchronous execution.
 * Agents begin one second apart and run for five seconds each; when all
 * finish the job status is set to `completed`.
 *
 * @param data Arbitrary request payload (currently unused).
 */
export function createJob(data: any): MultiAgentJob {
  const id = generateJobId();
  const agentIds = [
    'market-researcher',
    'audience-analyzer',
    'content-strategist',
    'content-writer',
    'ai-seo-optimizer',
    'social-media-specialist',
    'content-editor',
  ];
  const agents: AgentStatus[] = agentIds.map(agentId => ({ agentId, status: 'pending' }));

  const job: MultiAgentJob = {
    id,
    status: 'running',
    createdAt: Date.now(),
    agents,
  };

  jobs.set(id, job);

  // Progress each agent sequentially.
  agents.forEach((agent, index) => {
    const startDelayMs = 1000 * index;
    const runDurationMs = 5000;
    setTimeout(() => {
      agent.status = 'running';
      agent.startTime = Date.now();
      setTimeout(() => {
        agent.status = 'completed';
        agent.endTime = Date.now();
        const allDone = agents.every(a => a.status === 'completed');
        if (allDone) job.status = 'completed';
      }, runDurationMs);
    }, startDelayMs);
  });

  return job;
}

/** Fetch a job by ID; returns undefined if it doesn't exist. */
export function getJob(id: string): MultiAgentJob | undefined {
  return jobs.get(id);
}