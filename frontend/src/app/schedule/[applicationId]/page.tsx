"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScheduleSlot {
  time: string;
  original: string;
}

export default function SchedulingPage() {
  const { applicationId } = useParams();
  const router = useRouter();

  const [slots, setSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch available slots
  useEffect(() => {
    async function fetchSlots() {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/schedule/slots?application_id=${applicationId}`);
        if (!response.ok) throw new Error("Failed to load available slots");
        const data = await response.json();

        // Convert strings to Date objects
        const parsedSlots = data.slots.map((s: string) => new Date(s));
        setSlots(parsedSlots);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [applicationId]);

  // 2. Group slots by date
  const groupedSlots: Record<string, Date[]> = {};
  slots.forEach(slot => {
    const day = format(slot, "yyyy-MM-dd");
    if (!groupedSlots[day]) groupedSlots[day] = [];
    groupedSlots[day].push(slot);
  });

  const uniqueDays = Object.keys(groupedSlots).sort();

  // 3. Handle Booking
  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/schedule/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          scheduled_at: selectedSlot.toISOString()
        })
      });

      if (!response.ok) {
        const detail = await response.json();
        throw new Error(detail.detail || "Booking failed");
      }

      const result = await response.json();
      // Redirect to success page with interview ID
      router.push(`/schedule/success?interviewId=${result.interview_id}&time=${result.scheduled_at}&link=${encodeURIComponent(result.unique_link)}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Synchronizing available time slots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase">
            Scheduling Portal
          </Badge>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6 leading-none">
            PICK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">SESSION.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Select a convenient time slot for your AI-guided interview. We'll send you a calendar invite immediately after booking.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 mb-8 max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Calendar Grid */}
          <div className="space-y-6">
            {uniqueDays.map((dayStr) => (
              <section key={dayStr} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 lg:p-8 hover:bg-slate-900/60 transition-all">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      {format(new Date(dayStr), "EEEE, MMMM do")}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {groupedSlots[dayStr].map((slot) => {
                    const isSelected = selectedSlot?.getTime() === slot.getTime();
                    return (
                      <button
                        key={slot.toISOString()}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          group relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden
                          ${isSelected
                            ? "bg-indigo-600 border-indigo-400 ring-2 ring-indigo-500/50"
                            : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                          }
                        `}
                      >
                        <Clock className={`w-4 h-4 mb-2 ${isSelected ? "text-indigo-200" : "text-slate-500"}`} />
                        <span className={`text-sm font-bold tracking-tight ${isSelected ? "text-white" : "text-slate-300"}`}>
                          {format(slot, "h:mm a")}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Booking Summary Sidebar */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <Card className="bg-slate-900/80 border-white/5 p-8 rounded-[40px] shadow-2xl backdrop-blur-xl border-t-2 border-t-indigo-500/20">
              <h3 className="text-2xl font-black text-white tracking-tight mb-8">SUMMARY</h3>

              <div className="space-y-6 mb-10">
                <div className="p-4 rounded-2xl bg-white/5 space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Application ID</p>
                  <p className="text-xs font-mono text-slate-400 text-ellipsis overflow-hidden">{applicationId}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 space-y-1 min-h-[80px] flex flex-col justify-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Selected Slot</p>
                  {selectedSlot ? (
                    <p className="text-lg font-bold text-white tracking-tight">
                      {format(selectedSlot, "MMM d, h:mm a")}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-slate-500 italic">No slot selected yet</p>
                  )}
                </div>
              </div>

              <Button
                disabled={!selectedSlot || booking}
                onClick={handleBook}
                className={`
                  w-full py-8 rounded-[24px] text-lg font-black tracking-wider shadow-2xl transition-all
                  ${selectedSlot
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:-translate-y-1"
                    : "bg-white/5 text-slate-500 border border-white/5"
                  }
                `}
              >
                {booking ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    CONFIRM BOOKING
                    <ChevronRight className="w-6 h-6 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest mt-6">
                Secure 256-bit automated scheduling
              </p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
