import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { RecruiterDashboardClient } from "./RecruiterDashboardClient";

export default async function RecruiterDashboardPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();    if (!user) redirect("/login");

    // Check if user is a recruiter - fetch both full profile and role
    const results = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
            .from("jobs")
            .select("*, applications(id, status)")
            .eq("recruiter_id", user.id)
            .order("created_at", { ascending: false }),
        supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single(),
    ]);

    const recProfile = results[0].data;
    const jobs = results[1].data;
    const roleProfile = results[2].data as { role?: string } | null;

    // Verify recruiter role
    if ((roleProfile?.role as string) !== "recruiter") {
        redirect("/candidate/dashboard");
    }

    const profile = recProfile;

    const jobIds = (jobs || []).map((j: any) => j.id);
    
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
        .limit(5);    // Transform data to include application counts
    const jobsWithCount = (jobs || []).map((job: any) => ({
        ...job,
        applicantCount: Array.isArray(job.applications) ? job.applications.length : 0
    }));

    const interviewsCompleted = (jobs || []).reduce((acc: number, job: any) => {
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
