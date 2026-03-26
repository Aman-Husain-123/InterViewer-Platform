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

      // Verify role
      const userId = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      // IF PROFILE IS MISSING (After a DB wipe): 
      // Auto-restore it as 'candidate' so they aren't locked out of their own dashboard.
      if (!profile) {
          console.log("Profile missing, auto-restoring as candidate...");
          await supabase.from("profiles").upsert({
              id: userId,
              email: session.user.email,
              role: 'candidate',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Candidate"
          }, { on_conflict: 'id' }).execute();
          setLoading(false);
          return;
      }

      if (profile.role !== "candidate") {
        // Only block if they are explicitly marked as a recruiter
        await supabase.auth.signOut();
        router.push("/candidate/login?error=recruiter_mismatch");
        return;
      }

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
