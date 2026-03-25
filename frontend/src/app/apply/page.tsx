"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Briefcase, MapPin, ChevronRight, Loader2 } from "lucide-react";

export default function ApplyPage() {
  const supabase = getSupabaseBrowserClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    fetchJobs();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="py-12 border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase italic italic underline decoration-indigo-500/50 underline-offset-8">Open Positions</h1>
          <p className="text-slate-400 mt-4 text-sm font-medium tracking-wide">Find your next challenge in our AI-driven ecosystem</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-center text-slate-400 py-20 bg-slate-900/40 rounded-3xl border border-dashed border-white/10">No active job listings at the moment. Please check back later.</p>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="group bg-slate-900/40 border border-white/5 hover:border-indigo-500/40 rounded-3xl p-6 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex gap-6 items-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight uppercase italic">{job.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-bold tracking-widest uppercase">
                          <MapPin className="w-3 h-3" />
                          {job.location || "Remote"}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                        <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/apply/${job.id}`}>
                    <button className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
