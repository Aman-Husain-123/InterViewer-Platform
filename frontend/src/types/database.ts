/**
 * Hand-crafted Supabase Database type definitions.
 * Replace with generated types from `supabase gen types typescript` for production.
 */

export type UserRole = "candidate" | "recruiter" | "admin";
export type ApplicationStatus =
    | "pending_review"
    | "invited"
    | "interview_scheduled"
    | "completed"
    | "rejected";
export type InterviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    role: UserRole;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    role: UserRole;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
            };
            jobs: {
                Row: {
                    id: string;
                    recruiter_id: string;
                    title: string;
                    description: string;
                    requirements: string[];
                    location: string | null;
                    salary_range: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["jobs"]["Row"], "id" | "created_at" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
            };
            applications: {
                Row: {
                    id: string;
                    job_id: string;
                    candidate_id: string | null;
                    name: string;
                    email: string;
                    phone: string | null;
                    resume_text: string;
                    status: ApplicationStatus;
                    match_score: number | null;
                    parsed_data: Record<string, unknown> | null;
                    interview_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "created_at" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
            };
            interviews: {
                Row: {
                    id: string;
                    application_id: string;
                    scheduled_at: string | null;
                    started_at: string | null;
                    ended_at: string | null;
                    status: InterviewStatus;
                    recording_url: string | null;
                    transcript: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["interviews"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["interviews"]["Insert"]>;
            };
            assessments: {
                Row: {
                    id: string;
                    interview_id: string;
                    technical_score: number | null;
                    communication_score: number | null;
                    problem_solving_score: number | null;
                    overall_score: number | null;
                    feedback: string | null;
                    ai_report: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["assessments"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["assessments"]["Insert"]>;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            user_role: UserRole;
            application_status: ApplicationStatus;
            interview_status: InterviewStatus;
        };
    };
}
