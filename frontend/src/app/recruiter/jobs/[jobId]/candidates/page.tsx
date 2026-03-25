"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { listApplicationsByJob } from "@/services/api";
import type { Application } from "@/services/api";
import { Video, Mail, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming toast is available

export default function JobCandidatesPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const fetchCandidates = () => {
    listApplicationsByJob(jobId)
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  const handleInvite = async (applicationId: string) => {
    setInvitingId(applicationId);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/schedule/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId }),
      });

      if (!response.ok) throw new Error("Failed to send invite");

      toast.success("Invitation sent successfully!");
      fetchCandidates(); // Refresh list to show 'invited' status
    } catch (err) {
      toast.error("Error sending invitation");
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <DashboardNav />
      <main className="flex-1 overflow-auto">
        <div className="flex h-16 items-center border-b border-white/5 bg-slate-900/50 px-8 backdrop-blur-md sticky top-0 z-10">
          <Link href="/recruiter/dashboard" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors font-medium">← Dashboard</Link>
          <div className="w-px h-4 bg-white/10 mx-4" />
          <h1 className="text-xl font-black text-white tracking-tight uppercase italic">Candidate List</h1>
        </div>

        <div className="max-w-6xl mx-auto p-8 lg:p-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="group bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-white text-xl">
                        {app.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{app.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{app.email}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${app.status === 'invited' || app.status === 'interview_scheduled'
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-slate-800 text-slate-500"
                            }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="mr-6 text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">MATCH SCORE</p>
                        <p className={`text-2xl font-black ${app.match_score >= 80 ? "text-emerald-400" : "text-indigo-400"}`}>
                          {app.match_score != null ? `${Math.round(app.match_score)}%` : "—"}
                        </p>
                      </div>

                      {app.status === 'pending_review' && (
                        <Button
                          onClick={() => handleInvite(app.id)}
                          disabled={invitingId === app.id}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 py-6 font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-1"
                        >
                          {invitingId === app.id ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <Mail className="w-5 h-5 mr-2" />
                          )}
                          INVITE
                        </Button>
                      )}

                      {app.status === 'invited' && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-3 px-4 rounded-xl flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          INVITED Sent
                        </Badge>
                      )}

                      {(app.status === 'interview_scheduled' || app.status === 'completed') && app.interview_id && (
                        <Link href={`/recruiter/assessments/${app.interview_id}`}>
                          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-2xl px-6 py-6 font-bold transition-all hover:scale-105">
                            <Video className="w-5 h-5 mr-2" />
                            VIEW RESULT
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                  <p className="text-slate-500 font-medium italic">No applications found for this role yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
