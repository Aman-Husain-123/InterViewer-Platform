"use client";

import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  Download,
  ArrowRight,
  Video,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

// ── iCalendar download helper ──────────────────────────────────────────────
function buildIcsDataUrl(
  interviewDate: Date,
  interviewLink: string,
  jobTitle: string = "AI Interview"
): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const endDate = new Date(interviewDate.getTime() + 60 * 60 * 1000); // +1 hour
  const uid = `interview-${Date.now()}@aiinterviewer`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Interviewer//HireOS//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(interviewDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${jobTitle}`,
    `DESCRIPTION:Join your interview room: ${interviewLink}`,
    `LOCATION:${interviewLink}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return (
    "data:text/calendar;charset=utf-8," + encodeURIComponent(ics)
  );
}

// ── Inner page (uses useSearchParams — must be inside Suspense) ────────────
function SuccessContent() {
  const searchParams = useSearchParams();
  const time        = searchParams.get("time");
  const link        = searchParams.get("link");
  const interviewId = searchParams.get("interviewId");

  const dateObj   = time ? new Date(time) : new Date();
  const isValidDate = !isNaN(dateObj.getTime());

  const icsUrl = isValidDate
    ? buildIcsDataUrl(dateObj, link || "", "AI Interview")
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center">
        {/* Animated checkmark */}
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/10 relative">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-40" />
        </div>

        <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-4">
          INTERVIEW{" "}
          <span className="text-emerald-400 uppercase italic">BOOKED!</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium mb-12">
          Your AI interview is confirmed. A calendar invite with all details has
          been sent to your inbox.
        </p>

        {/* Info card */}
        <div className="bg-slate-900/60 border border-white/5 rounded-[40px] p-8 lg:p-12 mb-10 text-left space-y-8 backdrop-blur-3xl shadow-2xl">
          {/* Date/time row */}
          <div className="flex items-center gap-6 border-b border-white/5 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                SCHEDULED FOR
              </p>
              <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">
                {isValidDate ? format(dateObj, "EEEE, MMMM do") : "—"}
              </h3>
              <p className="text-slate-400 font-bold tracking-wide mt-1">
                {isValidDate ? `at ${format(dateObj, "h:mm a")} (UTC)` : ""}
              </p>
            </div>
          </div>

          {/* Link row */}
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Video className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                YOUR INTERVIEW ROOM
              </p>
              <p className="text-sm font-mono text-slate-400 truncate break-all">
                {link || "—"}
              </p>
            </div>
            {link && (
              <Link href={link} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400"
                >
                  <ExternalLink className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Interview ID (subtle) */}
          {interviewId && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">
                Interview ID
              </p>
              <p className="text-xs font-mono text-slate-600 truncate">{interviewId}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* .ics download — real browser download */}
          {icsUrl ? (
            <a
              href={icsUrl}
              download="interview.ics"
              className="flex items-center justify-center gap-2 py-5 px-6 rounded-2xl border border-white/10 hover:bg-white/5 text-slate-400 font-bold text-sm transition-all"
            >
              <Download className="w-5 h-5" />
              ADD TO CALENDAR (.ICS)
            </a>
          ) : (
            <Button
              disabled
              variant="outline"
              className="py-7 rounded-2xl border-white/10 text-slate-600 font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              ADD TO CALENDAR
            </Button>
          )}

          {/* Go to room */}
          {link ? (
            <Link href={link} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-2xl text-white font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                JOIN ROOM NOW
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/candidate/dashboard" className="w-full">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-2xl text-white font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                GO TO DASHBOARD
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        <p className="text-[10px] text-center text-slate-700 font-bold uppercase tracking-widest mt-8">
          Secure · Automated · AI-Powered Interview Platform
        </p>
      </div>
    </div>
  );
}

// ── Page export — wraps in Suspense (required for useSearchParams in Next 13+) 
export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
