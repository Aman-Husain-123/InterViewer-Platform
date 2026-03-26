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

      if (profile?.role !== "candidate") {
        // If they are a recruiter, we don't just push them; we explain the portal is separate.
        // Or we just push to Recruiter Dashboard if they were ALREADY there.
        // But for better UX during testing, lets just sign them out so they can log in as candidate.
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
