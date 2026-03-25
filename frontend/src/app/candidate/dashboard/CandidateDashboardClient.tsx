"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { LogOut, Briefcase, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"] & {
    jobs: { title: string; location: string | null } | null;
};

interface CandidateDashboardClientProps {
    profile: Profile | null;
    applications: Application[];
    userEmail: string;
}

const statusConfig: Record<string, { color: string; icon: any }> = {
    pending_review: { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Clock },
    invited: { color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", icon: Calendar },
    interview_scheduled: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Calendar },
    completed: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
    rejected: { color: "text-rose-400 bg-rose-400/10 border-rose-400/20", icon: CheckCircle2 },
};

export function CandidateDashboardClient({
    profile,
    applications,
    userEmail,
}: CandidateDashboardClientProps) {
    const { signOut } = useUser();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">AI</div>
                        <span className="font-bold text-xl tracking-tight text-white">Interviewer</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">{profile?.full_name || "Candidate"}</p>
                            <p className="text-xs text-slate-400">{userEmail}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white hover:bg-white/5">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
                        <p className="text-slate-400 uppercase tracking-widest text-xs font-semibold">Track your journey with top companies</p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all">
                        Browse Jobs
                    </Button>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-20 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8">Start applying for jobs to see them tracked here and begin your AI-interviews.</p>
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                            Find my first job
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map((app) => {
                            const status = statusConfig[app.status] || statusConfig.pending_review;
                            const StatusIcon = status.icon;
                            return (
                                <div key={app.id} className="group bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600/10 transition-colors">
                                                <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                    {app.jobs?.title || "Unknown Position"}
                                                </h3>
                                                <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                                                    Applied on {new Date(app.created_at).toLocaleDateString()}
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    {app.jobs?.location || "Remote"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${status.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {app.status.replace("_", " ")}
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5">
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
