"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users, LayoutDashboard, Briefcase, ChevronRight, Settings } from "lucide-react";
import type { Database } from "@/types/database";
import Link from "next/link";
import { format } from "date-fns";
import { Video } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
    applicantCount: number;
};

interface RecruiterDashboardClientProps {
    profile: Profile | null;
    jobs: any[];
    upcomingSessions: any[];
    interviewsCompleted: number;
    userEmail: string;
}

export function RecruiterDashboardClient({
    profile,
    jobs,
    upcomingSessions,
    interviewsCompleted,
    userEmail,
}: RecruiterDashboardClientProps) {
    const { signOut } = useUser();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-900/30 hidden lg:flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">AI</div>
                    <span className="font-bold text-xl tracking-tight text-white">HireOS</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/recruiter/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20">
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link href="/recruiter/jobs" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Briefcase className="w-5 h-5" />
                        Active Jobs
                    </Link>
                    <Link href="/recruiter/candidates" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Users className="w-5 h-5" />
                        Candidates
                    </Link>
                    <Link href="/recruiter/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>
                <div className="p-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {profile?.full_name?.charAt(0) || "R"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{profile?.full_name || "Recruiter"}</p>
                            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 px-4 h-11 rounded-xl">
                        <LogOut className="w-4 h-4 mr-3" />
                        Log out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-screen">
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-indigo-500/40 underline-offset-8">Recruiter Hub</h1>
                            <p className="text-slate-500 mt-4 text-sm font-medium tracking-wide">Managing {jobs.length} active global talent hunts</p>
                        </div>
                        <Link href="/recruiter/jobs/new">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 px-6 py-6 rounded-2xl flex items-center gap-3 text-sm font-bold tracking-wider transition-all hover:-translate-y-1 active:translate-y-0">
                                <Plus className="w-5 h-5" />
                                CREATE NEW JOB
                            </Button>
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: "Active Jobs", value: jobs.length, icon: Briefcase, color: "bg-blue-500/10 text-blue-400" },
                            { label: "Total Candidates", value: jobs.reduce((acc, j) => acc + j.applicantCount, 0), icon: Users, color: "bg-emerald-500/10 text-emerald-400" },
                            { label: "Interviews Complete", value: interviewsCompleted, icon: LayoutDashboard, color: "bg-purple-500/10 text-purple-400" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-slate-900/60 transition-all border-b-4 border-b-indigo-500/20">
                                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-4xl font-black text-white mt-1 tabular-nums tracking-tighter">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 mb-12">
                        {/* 1. UPCOMING SESSIONS (REPLIED) */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
                                <Video className="w-6 h-6 text-emerald-400" />
                                Candidates Replied ({upcomingSessions.length})
                            </h2>
                            <div className="space-y-4">
                                {upcomingSessions.length === 0 ? (
                                    <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-10 text-center">
                                        <p className="text-slate-500 text-sm italic">Waiting for candidates to pick slots...</p>
                                    </div>
                                ) : (
                                    upcomingSessions.map((session) => (
                                        <div key={session.id} className="bg-slate-900/40 border border-emerald-500/10 p-6 rounded-[32px] hover:bg-slate-900/60 transition-all border-l-4 border-l-emerald-600 group">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                                                            {format(new Date(session.scheduled_at), "MMM do, h:mm a")}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white uppercase group-hover:text-emerald-400 transition-colors">
                                                        {session.applications?.name}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{session.applications?.jobs?.title}</p>
                                                </div>
                                                <Link href={`/room/${session.id}`}>
                                                    <Button className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl py-5 px-5 flex items-center gap-2 transition-all">
                                                        <Video className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">JOIN MEET</span>
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 2. UPLOADED JOBS */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
                                <Briefcase className="w-6 h-6 text-indigo-400" />
                                Uploaded Jobs
                            </h2>
                            <div className="space-y-4">
                                {jobs.map(job => (
                                    <div key={job.id} className="group bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 rounded-[32px] p-6 transition-all">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic">{job.title}</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{job.applicantCount} Applicants</p>
                                            </div>
                                            <Link href={`/recruiter/jobs/${job.id}/candidates`}>
                                                <button className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {jobs.length === 0 && (
                                    <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-10 text-center">
                                        <p className="text-slate-500 text-sm italic">No active listings.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
