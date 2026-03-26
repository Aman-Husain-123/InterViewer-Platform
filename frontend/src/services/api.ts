import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/**
 * API client for BRD backend (FastAPI /api/v1) with Auth support.
 */
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

const supabase = getSupabaseBrowserClient();

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { "Authorization": `Bearer ${session.access_token}` } : {};
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  department: string;
  recruiter_id?: string;
}

export interface Application {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  resume_text: string;
  status: string;
  match_score?: number;
  parsed_data?: Record<string, unknown>;
  interview_id?: string | null;
}

export async function createJob(data: {
  title: string;
  description: string;
  requirements: string[];
  department: string;
}): Promise<Job> {
  const headers = await getAuthHeaders();
  const r = await fetch(`${API_BASE}/api/v1/jobs/`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data),
  });

  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || "Failed to create job");
  }
  return r.json();
}

export async function listJobs(): Promise<Job[]> {
  const r = await fetch(`${API_BASE}/api/v1/jobs/`);
  if (!r.ok) throw new Error("Failed to fetch jobs");
  return r.json();
}

export async function listApplicationsByJob(jobId: string): Promise<Application[]> {
  const headers = await getAuthHeaders();
  const r = await fetch(`${API_BASE}/api/v1/applications/${jobId}`, {
    headers
  });
  if (!r.ok) throw new Error("Failed to fetch applications");
  return r.json();
}

// ... Add other exports as needed or keep old ones if they don't need auth

/**
 * Returns the WebSocket URL for a specific interview.
 */
export function getInterviewWebSocketUrl(interviewId: string): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/api/v1/interview/${interviewId}`;
}
