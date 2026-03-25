"use client";

import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, CalendarDays, ExternalLink, Download, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BookingSuccessPage() {
    const searchParams = useSearchParams();
    const time = searchParams.get("time");
    const link = searchParams.get("link");
    const dateObj = time ? new Date(time) : new Date();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
            <div className="max-w-xl w-full text-center">
                {/* Animated Checkmark */}
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-emerald-500/20 relative">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-50" />
                </div>

                <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-4">
                    INTERVIEW <span className="text-emerald-400 uppercase italic">BOOKED!</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium mb-12">
                    Your AI interview is confirmed. We've sent a calendar invite with all the details and room link to your inbox.
                </p>

                {/* Info Card */}
                <div className="bg-slate-900/60 border border-white/5 rounded-[40px] p-8 lg:p-12 mb-10 text-left space-y-8 backdrop-blur-3xl shadow-2xl">
                    <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">SCHEDULED FOR</p>
                            <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">
                                {format(dateObj, "EEEE, MMMM do")}
                            </h3>
                            <p className="text-slate-400 font-bold tracking-wide mt-1">
                                at {format(dateObj, "h:mm a")} (UTC)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Video className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">LINK TO JOIN</p>
                            <p className="text-sm font-mono text-slate-400 truncate break-all selection:bg-indigo-500/30">{link}</p>
                        </div>
                        <Link href={link || "#"} target="_blank">
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400">
                                <ExternalLink className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Buttons */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="py-7 rounded-2xl border-white/10 hover:bg-white/5 text-slate-400 font-bold flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" />
                        GET .ICS CALENDAR
                    </Button>
                    <Link href="/candidate/dashboard">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-2xl text-white font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                            GO TO DASHBOARD
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
