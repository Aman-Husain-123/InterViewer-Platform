import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { RecruiterDashboardClient } from "./RecruiterDashboardClient";

export default async function RecruiterDashboardPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Parallel fetch: profile + jobs + application details (status included)
    const [{ data: profile }, { data: jobs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
            .from("jobs")
            .select("*, applications(id, status)")
            .eq("recruiter_id", user.id)
            .order("created_at", { ascending: false }),
    ]);

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
            interviewsCompleted={interviewsCompleted}
            userEmail={user.email ?? ""}
        />
    );
}
