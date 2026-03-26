"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { 
  Calendar, 
  Clock, 
  Video, 
  Mail, 
  LogOut, 
  User, 
  ChevronRight, 
  Bell,
  CheckCircle2,
  Loader2,
  Trophy,
  History,
  Briefcase,
  Search,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";

export default function CandidateDashboard() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/candidate/dashboard";
  const errorParam = searchParams.get("error");
  const [activeTab, setActiveTab] = useState<"overview" | "notifications" | "history" | "browse">("overview");
  const [invites, setInvites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Candidate");

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/candidate/login");
        return;
      }

      setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Candidate");

      const headers = { "Authorization": `Bearer ${session.access_token}` };
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      try {
        const [invitesRes, historyRes, interviewsRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/applications/my-invites`, { headers }),
          fetch(`${API_BASE}/api/v1/applications/my-history`, { headers }),
          fetch(`${API_BASE}/api/v1/applications/my-interviews`, { headers }),
          fetch(`${API_BASE}/api/v1/jobs/`)
        ]);

        if (invitesRes.ok) setInvites(await invitesRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
        if (interviewsRes.ok) setInterviews(await interviewsRes.json());
        if (jobsRes.ok) setAvailableJobs(await jobsRes.json());
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/candidate/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-black animate-pulse tracking-widest uppercase text-[10px]">Loading Your Profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="flex min-h-screen">
        {/* Navigation Sidebar */}
        <nav className="hidden lg:flex w-80 flex-col bg-slate-900/60 border-r border-white/5 p-8 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">AI Candidate</span>
          </div>

          <div className="space-y-3 flex-1">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <User className="w-5 h-5" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest ${activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                Notifications
              </div>
              {(invites.length > 0 || interviews.length > 0) && (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${activeTab === 'notifications' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white animate-pulse'}`}>
                  {invites.length + interviews.length}
                </div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <History className="w-5 h-5" />
              App History
            </button>
            <button 
              onClick={() => setActiveTab("browse")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest ${activeTab === 'browse' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <Search className="w-5 h-5" />
              Browse Jobs
            </button>
          </div>

          <div className="pt-8 border-t border-white/5">
             <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-4 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">
                <LogOut className="w-5 h-5" />
                Sign Out
             </button>
          </div>
        </nav>

        {/* Main Section */}
        <main className="flex-1 p-6 lg:p-14 max-w-6xl mx-auto">
          {/* Top Bar for Mobile */}
          <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-500" />
                <span className="font-black text-white tracking-tighter">CANDIDATE</span>
            </div>
            <button onClick={handleLogout} className="text-rose-500 font-bold text-[10px] uppercase">Logout</button>
          </div>

          {/* Dynamic Content Based on Tabs */}
          {activeTab === "overview" && (
            <div className="space-y-12">
               <header>
                <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-4 leading-none">
                    Hello, <span className="text-indigo-400">{userName}.</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium">Your application summary and upcoming action items.</p>
              </header>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/40 border-white/5 p-8 rounded-[36px] flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">Invitations</p>
                    <p className="text-5xl font-black text-white">{invites.length}</p>
                </Card>
                <Card className="bg-slate-900/40 border-white/5 p-8 rounded-[36px] flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-purple-400 mb-2 uppercase tracking-widest">Active Apps</p>
                    <p className="text-5xl font-black text-white">{history.length}</p>
                </Card>
                <Card className="bg-slate-900/40 border-white/5 p-8 rounded-[36px] flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Sessions</p>
                    <p className="text-5xl font-black text-white">{interviews.length}</p>
                </Card>
              </div>

              {interviews.length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Quick Access: Upcoming Interviews
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {interviews.map(session => (
                            <Card key={session.id} className="bg-slate-900/60 border-indigo-500/20 p-6 rounded-[32px] hover:border-indigo-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">{format(new Date(session.scheduled_at), "MMM d, h:mm a")}</p>
                                        <h3 className="text-xl font-bold text-white uppercase">{session.applications?.jobs?.title}</h3>
                                    </div>
                                    <Link href={`/room/${session.id}`}>
                                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 text-xs font-black uppercase">Start</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                  </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-12">
               <header>
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                    Recruiter <span className="text-indigo-400">Updates.</span>
                </h2>
                <p className="text-slate-400 text-lg font-medium mt-4">Manage your job invitations and confirmed interview links here.</p>
              </header>

              <div className="grid md:grid-cols-2 gap-10">
                {/* Panel: Active Invites */}
                <div className="space-y-6">
                    <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Pending Invitations ({invites.length})
                    </h2>
                    {invites.length === 0 ? (
                        <Card className="bg-slate-900/40 border-white/5 p-12 text-center rounded-[40px]">
                            <p className="text-slate-500 italic text-sm">No new invites right now.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {invites.map(invite => (
                                <Card key={invite.id} className="group bg-slate-900/60 border-white/5 hover:border-indigo-500/30 p-8 rounded-[36px] transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{invite.jobs?.title}</h3>
                                            <p className="text-slate-500 text-xs font-bold mt-2 uppercase">{invite.jobs?.department}</p>
                                        </div>
                                        <Button 
                                            onClick={() => router.push(`/schedule/${invite.id}`)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 w-14 p-0 shadow-lg shadow-indigo-600/30"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panel: Upcoming Interviews */}
                <div className="space-y-6">
                    <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Confirmed Sessions ({interviews.length})
                    </h2>
                    {interviews.length === 0 ? (
                        <Card className="bg-slate-900/40 border-white/5 p-12 text-center rounded-[40px]">
                            <p className="text-slate-500 italic text-sm">No interviews scheduled yet.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {interviews.map(session => (
                                <Card key={session.id} className="bg-slate-900/40 border-white/5 p-8 rounded-[36px] hover:bg-slate-900/60 transition-all border-l-4 border-l-indigo-600">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {format(new Date(session.scheduled_at), "MMM do, h:mm a")}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase">{session.applications?.jobs?.title}</h3>
                                        </div>
                                        <Link href={`/room/${session.id}`}>
                                            <Button className="bg-white/5 hover:bg-indigo-600 text-white rounded-2xl py-6 px-4 flex flex-col items-center">
                                                <Video className="w-5 h-5 mb-1" />
                                                <span className="text-[8px] font-black uppercase">Enter</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-10">
               <header>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-8">Application History</h2>
              </header>
              <div className="grid gap-4">
                 {history.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">You haven't applied to any jobs yet.</div>
                 ) : (
                    history.map(app => (
                        <Card key={app.id} className="bg-slate-900/40 border-white/5 p-8 rounded-[36px] flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{app.jobs?.title}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(app.created_at), "MMM d, yyyy")}</span>
                                    <Badge className={`${app.status === 'invited' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'} rounded-full text-[10px] uppercase font-black`}>
                                        {app.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">SCORE</p>
                                <p className="text-2xl font-black text-indigo-400">{Math.round(app.match_score)}%</p>
                            </div>
                        </Card>
                    ))
                 )}
              </div>
            </div>
          )}

          {activeTab === "browse" && (
            <div className="space-y-10">
               <header className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Explore Careers</h2>
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input placeholder="Filter roles..." className="bg-white/5 border border-white/5 rounded-2xl pl-11 pr-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
              </header>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableJobs.map(job => (
                    <Card key={job.id} className="bg-slate-900/40 border-white/5 hover:border-indigo-500/30 p-8 rounded-[40px] flex flex-col justify-between transition-all group overflow-hidden">
                        <div className="relative z-10">
                            <Badge className="bg-white/5 text-indigo-400 mb-6 uppercase text-[10px] font-black tracking-widest px-3 py-1 rounded-full">{job.department}</Badge>
                            <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-none mb-4">{job.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-8">{job.description}</p>
                        </div>
                        <Button 
                            onClick={() => router.push(`/apply?jobId=${job.id}`)}
                            className="bg-white/5 hover:bg-indigo-600 text-white rounded-2xl py-6 font-bold uppercase tracking-widest text-xs transition-all relative z-10"
                        >
                            Apply Now
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
