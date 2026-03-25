"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createJob } from "@/services/api";
import { Briefcase, ChevronLeft, Plus, Sparkles, Building2, Send, Loader2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "Engineering",
    requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const reqs = form.requirements.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      await createJob({
        title: form.title,
        description: form.description,
        department: form.department,
        requirements: reqs.length ? reqs : ["Python"],
      });
      router.push("/recruiter/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/recruiter/dashboard" className="flex items-center gap-2 group transition-all">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">AI</div>
            <span className="font-bold text-xl tracking-tight text-white italic underline decoration-indigo-500/30 underline-offset-4">HireOS</span>
          </Link>
          <Link href="/recruiter/dashboard">
            <Button variant="ghost" className="text-slate-400 hover:text-white transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2 px-0 hover:bg-transparent group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              BACK TO DASHBOARD
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3 h-3" />
            Vibrant Recruitment
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
            Post New Listing
          </h1>
          <p className="text-slate-500 mt-4 text-sm font-medium tracking-wide">Enter the details of your next high-impact open position.</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-700" />

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <Briefcase className="w-3 h-3" /> Position Title
                </label>
                <input
                  required
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-slate-800/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <Building2 className="w-3 h-3" /> Department
                </label>
                <input
                  placeholder="e.g. Engineering"
                  className="w-full bg-slate-800/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                DESCRIPTION & RESPONSIBILITIES
              </label>
              <textarea
                required
                placeholder="Describe the role, impact, and expectations..."
                rows={6}
                className="w-full bg-slate-800/40 border border-white/5 rounded-[2rem] px-6 py-5 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 resize-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                TECHNICAL REQUIREMENTS (COMMA-SEPARATED)
              </label>
              <div className="relative group">
                <input
                  placeholder="Python, FastAPI, TypeScript, React..."
                  className="w-full bg-slate-800/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 pr-12"
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                />
                <Plus className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-2 ml-1">Separate keywords with commas for best AI matching</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold py-3 px-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/40 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                PUBLISH LISTING
              </button>

              <Link href="/recruiter/dashboard" className="flex-[0.3]">
                <button
                  type="button"
                  className="w-full h-16 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black rounded-[2rem] flex items-center justify-center tracking-[0.2em] text-[10px] transition-all"
                >
                  CANCEL
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
