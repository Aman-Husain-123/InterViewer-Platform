"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Calendar, ChevronRight, FileCheck, Target, Sparkles } from "lucide-react";

export default function AppSuccessPage() {
  const searchParams = useSearchParams();
  const score = searchParams.get("score");
  const status = searchParams.get("status");
  const applicationId = searchParams.get("applicationId");

  const isInvited = status === "invited";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background Kinetic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${isInvited ? 'bg-indigo-600/10' : 'bg-slate-500/5'} rounded-full blur-[120px]`} />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 shadow-2xl ${isInvited ? 'bg-indigo-600 shadow-indigo-600/40 scale-110 rotate-3' : 'bg-slate-800'}`}>
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase italic mb-2 italic underline decoration-indigo-500/30 underline-offset-8">Submission Success</h1>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs mb-10">Application #{applicationId?.slice(0, 8)}</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all">
            <Target className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Match Score</p>
            <h3 className="text-3xl font-black text-white tabular-nums">{score}%</h3>
          </div>
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all">
            <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">AI Status</p>
            <h3 className={`text-sm font-black uppercase tracking-widest mt-3.5 ${isInvited ? 'text-indigo-400' : 'text-slate-400'}`}>
              {isInvited ? "Auto-Invited" : "Pending Review"}
            </h3>
          </div>
        </div>

        {isInvited ? (
          <div className="space-y-4">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 mb-8 text-left relative overflow-hidden group">
              <Sparkles className="absolute top-4 right-4 text-indigo-500/20 w-12 h-12 grayscale" />
              <h4 className="text-white font-black tracking-tight mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                NEXT STEP: INTERVIEW
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Your profile is a strong match. You can now schedule your AI-led assessment immediately.
              </p>
              <Link href={`/schedule/${applicationId}`}>
                <button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 tracking-widest text-[10px] transition-all group-hover:shadow-xl group-hover:shadow-indigo-600/30">
                  SCHEDULE INTERVIEW <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 mb-10 text-left">
            <h4 className="text-slate-400 font-black tracking-tight mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-500" />
              WHAT HAPPENS NEXT?
            </h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Our team (assisted by AI) will review your full experience in detail. We'll update you via email if we move forward.
            </p>
          </div>
        )}

        <Link href="/" className="text-slate-500 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors">
          Back to careers
        </Link>
      </div>
    </div>
  );
}
