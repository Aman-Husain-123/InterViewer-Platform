import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { CandidateDashboardClient } from "./CandidateDashboardClient";

export default async function CandidateDashboardPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch profile + applications in parallel
    const [{ data: profile }, { data: applications }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
            .from("applications")
            .select("*, jobs(title, location)")
            .eq("candidate_id", user.id)
            .order("created_at", { ascending: false }),
    ]);

    return (
        <CandidateDashboardClient
            profile={profile}
            applications={applications ?? []}
            userEmail={user.email ?? ""}
        />
    );
}
