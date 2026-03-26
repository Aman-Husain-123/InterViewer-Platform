import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { RecruiterDashboardClient } from "./RecruiterDashboardClient";

export default async function RecruiterDashboardPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Fetch profile and jobs
    const [{ data: profile }, { data: jobs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
            .from("jobs")
            .select("*, applications(id, status)")
            .eq("recruiter_id", user.id)
            .order("created_at", { ascending: false }),
    ]);

    const jobIds = (jobs || []).map(j => j.id);
    
    // 2. Fetch upcoming interview sessions for recruiter's jobs
    const { data: rawSessions } = await supabase
        .from("interview_sessions")
        .select(`
            id,
            scheduled_at,
            applications!inner (
                id,
                name,
                job_id,
                jobs!inner (
                    id,
                    title,
                    recruiter_id
                )
            )
        `)
        .eq("applications.jobs.recruiter_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

    // Transform data to include application counts
    const jobsWithCount = (jobs || []).map(job => ({
        ...job,
        applicantCount: Array.isArray(job.applications) ? job.applications.length : 0
    }));

    const interviewsCompleted = (jobs || []).reduce((acc, job) => {
        const completed = Array.isArray(job.applications)
            ? job.applications.filter((a: any) => a.status === 'completed').length
            : 0;
        return acc + completed;
    }, 0);

    return (
        <RecruiterDashboardClient
            profile={profile}
            jobs={jobsWithCount}
            upcomingSessions={rawSessions || []}
            interviewsCompleted={interviewsCompleted}
            userEmail={user.email ?? ""}
        />
    );
}
