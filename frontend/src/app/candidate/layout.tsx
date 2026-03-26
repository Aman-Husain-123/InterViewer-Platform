"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Allow the login page itself to pass through
      if (window.location.pathname.endsWith("/candidate/login")) {
        setLoading(false);
        return;
      }

      if (!session) {
        // Redirect to Candidate specific login instead of main login
        router.push("/candidate/login");
        return;
      }

      // Verify role in separate pools
      const userId = session.user.id;
      
      // Check if they exist in the Recruiters table (If so, they shouldn't be here)
      const { data: recProfile } = await supabase
        .from("recruiters")
        .select("id")
        .eq("id", userId)
        .single();

      if (recProfile) {
        // Explicitly block recruiters from the candidate flow
        await supabase.auth.signOut();
        router.push("/candidate/login?error=recruiter_mismatch");
        return;
      }

      // Ensure Candidate existence in our dedicated table
      await supabase.from("candidates").upsert({
          id: userId,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Candidate"
      }, { on_conflict: 'id' });

      setLoading(false);

      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse tracking-widest uppercase text-xs">Authenticating Portal</p>
      </div>
    );
  }

  return <>{children}</>;
}
