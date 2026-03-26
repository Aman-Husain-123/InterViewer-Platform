"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden bg-slate-950">
      {/* Background kinetic effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-10 animate-bounce">
          <Sparkles className="w-3 h-3" />
          The Future of Hiring is AI
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
          HIRE SMARTER <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 italic">NOT HARDER.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
          AI Interviewer automates your first-round assessments using state-of-the-art LLMs,
          giving you deep insights into technical and communication skills in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/candidate/login">
            <Button className="group bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl px-12 py-8 text-lg shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              START YOUR CAREER
              <Sparkles className="w-5 h-5 group-hover:animate-spin transition-transform" />
            </Button>
          </Link>
          <Link href="/apply">
            <Button variant="outline" className="border-white/10 text-white font-black rounded-2xl px-12 py-8 text-lg hover:bg-white/5 transition-all bg-white/5 backdrop-blur-md">
              BROWSE JOBS
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm font-bold uppercase tracking-widest">
            <Link href="/login?role=recruiter" className="text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-2">
                For Employers: Recruiter Portal <ArrowRight className="w-4 h-4" />
            </Link>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Zap, text: "Instant Screening" },
            { icon: CheckCircle, text: "Unbiased Results" },
            { icon: Sparkles, text: "Deep AI Insights" },
            { icon: ArrowRight, text: "Seamless Integration" }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 transition-all">
                <feature.icon className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-all" />
              </div>
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] group-hover:text-white transition-all">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
