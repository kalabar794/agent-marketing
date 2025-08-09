import { NextResponse } from 'next/server';
import { createJob, getJob } from '@/lib/multi-agent-workflow';

/**
 * Multi‑agent job API.
 *
 *  • POST – create a new multi‑agent job.  The request body can include
 *    arbitrary data; the response contains `{ jobId: string }`.
 *  • GET – fetch the current state of an existing job using the `jobId`
 *    query parameter.  A 404 is returned if the job is missing.
 */

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const job = createJob(data);
    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error('Failed to create multi‑agent job:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create job' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing jobId parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const job = getJob(jobId);
  if (!job) {
    return new NextResponse(
      JSON.stringify({ status: 'not_found', message: 'Job not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return NextResponse.json(job);
}