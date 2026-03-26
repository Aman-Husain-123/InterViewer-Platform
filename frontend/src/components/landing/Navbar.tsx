"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronRight, Briefcase } from "lucide-react";

export function Navbar() {
  const { user, profile, signOut } = useUser();

  const isRecruiter = profile?.role === "recruiter";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-all">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">AI</div>
          <span className="font-bold text-xl tracking-tight text-white">Interviewer</span>
        </Link>

        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <Link href="/candidate/login" className="text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-all uppercase tracking-[0.2em] hidden md:block">
                Candidate Entry
              </Link>
              <div className="w-px h-4 bg-white/10 hidden md:block mx-2" />
              <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                SIGN IN
              </Link>
              <Link href="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold px-6 h-10 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5">
                  GET STARTED
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href={isRecruiter ? "/recruiter/dashboard" : "/candidate/dashboard"}
                className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest"
              >
                Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
