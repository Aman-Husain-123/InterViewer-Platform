"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAudioStream } from "@/hooks/useAudioStream";
import { 
  Mic, Video, PhoneOff, MessageSquare, 
  ChevronRight, CheckCircle2, AlertCircle,
  Activity, Shield, User, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROUNDS = ["INTRO", "TECHNICAL", "HR", "SALARY", "COMPLETED"];
const ROUND_LABELS = {
  INTRO: "Introduction",
  TECHNICAL: "Technical Round",
  HR: "Behavioral Round",
  SALARY: "Salary Negotiation",
  COMPLETED: "Interview Finished"
};

export default function InterviewRoomPage() {
  const { interviewId } = useParams() as { interviewId: string };
  const router = useRouter();

  // Tasks 1/2: Core Hooks
  const { isConnected, error, connect, disconnect, socket } = useAudioStream(interviewId);
  const { localStream, remoteStream, startCall, endCall } = useWebRTC(socket);

  const [currentRound, setCurrentRound] = useState("INTRO");
  const [messages, setMessages] = useState<any[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  // Sync state between socket and page
  useEffect(() => {
    if (!socket) return;
    const handleMsg = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "agent_response") {
          setMessages(prev => [...prev, { role: "agent", text: data.text }]);
          setIsAgentSpeaking(true);
          setTimeout(() => setIsAgentSpeaking(false), 3000); // Simple speaking detection
        } else if (data.type === "round_update") {
          setCurrentRound(data.round);
        }
      } catch (e) {}
    };
    socket.addEventListener("message", handleMsg);
    return () => socket.removeEventListener("message", handleMsg);
  }, [socket]);

  const handleStart = async () => {
    connect();
    // Also start WebRTC (for candidate cam display)
    await startCall();
  };

  const handleEnd = () => {
    disconnect();
    endCall();
    router.push("/candidate/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col overflow-hidden font-sans">
      
      {/* Header (Task 3: Meta Info) */}
      <header className="h-14 px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Interview • {interviewId.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-4">
           {isConnected && <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/30">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
           </div>}
           <Clock className="w-4 h-4 text-slate-600" />
           <span className="text-xs font-mono text-slate-500">22:04</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 relative min-h-0">
        
        {/* Progress Bar (Task 3: Round Indicator) */}
        <div className="max-w-xl mx-auto w-full mb-6 text-center">
          <div className="flex justify-between mb-2 px-1">
            {ROUNDS.slice(0, 4).map((r) => (
              <span key={r} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${currentRound === r ? 'text-blue-400' : 'text-slate-700'}`}>
                {r}
              </span>
            ))}
          </div>
          <div className="h-1 bg-slate-900 rounded-full flex gap-1 p-0.5">
            {ROUNDS.slice(0, 4).map((r, i) => (
              <div 
                key={r}
                className={`h-full rounded-full transition-all duration-1000 ${
                  ROUNDS.indexOf(currentRound) >= i ? 'bg-blue-600' : 'bg-slate-800'
                } ${currentRound === r ? 'flex-1' : 'w-8'}`}
              />
            ))}
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Current Round: <span className="text-white">{ROUND_LABELS[currentRound as keyof typeof ROUND_LABELS]}</span>
          </p>
        </div>

        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center max-w-sm"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold mb-3 tracking-tight">Ready for your interview?</h1>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">Ensure you're in a quiet place and your peripherals are working correctly.</p>
              <button 
                onClick={handleStart}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group"
              >
                Join Interview Room <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 min-h-0">
             
             {/* Main AI Avatar Panel (Task 3) */}
             <div className="lg:col-span-8 bg-slate-900/30 rounded-[2rem] border border-white/5 relative overflow-hidden group">
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative">
                   <AnimatePresence>
                     {isAgentSpeaking && (
                       <div className="absolute -inset-20 flex items-center justify-center gap-1.5">
                         {[...Array(6)].map((_, i) => (
                           <motion.div 
                             key={i}
                             initial={{ height: 20 }}
                             animate={{ height: [20, 80, 20] }}
                             transition={{ repeat: Infinity, duration: 0.6 + i * 0.1 }}
                             className="w-1.5 bg-blue-500/40 rounded-full blur-[1px]"
                           />
                         ))}
                       </div>
                     )}
                   </AnimatePresence>
                   <div className="w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-2xl relative z-10 transition-transform group-hover:scale-105">
                     <Activity className={`w-12 h-12 ${isAgentSpeaking ? 'text-blue-500' : 'text-slate-600'}`} />
                   </div>
                 </div>
               </div>

               <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">AI Interviewer</span>
               </div>
             </div>

             {/* Right Panel: Transcript & Local Video (Task 3) */}
             <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
               <div className="aspect-video bg-slate-900 rounded-[2rem] border border-white/5 relative overflow-hidden ring-1 ring-white/5">
                 {localStream ? (
                   <video 
                     ref={v => { if (v) v.srcObject = localStream; }}
                     autoPlay playsInline muted 
                     className="w-full h-full object-cover -scale-x-100"
                   />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                     <User className="w-8 h-8 text-slate-700" />
                     <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Camera Loading...</span>
                   </div>
                 )}
                 <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-bold uppercase tracking-wider">
                   You
                 </div>
               </div>

               <div className="flex-1 bg-slate-900/30 rounded-[2.5rem] border border-white/5 p-6 flex flex-col min-h-0 overflow-hidden backdrop-blur-sm">
                 <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                   <MessageSquare className="w-4 h-4 text-blue-500" />
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Live Interaction</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                   {messages.map((m, i) => (
                     <div key={i} className={`flex flex-col ${m.role === 'agent' ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          m.role === 'agent' 
                            ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5' 
                            : 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                        }`}>
                          {m.text}
                        </div>
                     </div>
                   ))}
                   {messages.length === 0 && (
                     <p className="text-[10px] text-slate-600 text-center italic mt-20">Start speaking to begin your response...</p>
                   )}
                 </div>

                 <div className="mt-4 pt-4 border-t border-white/5">
                   <div className="flex items-center bg-slate-950 rounded-2xl border border-white/5 overflow-hidden group focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                     <form onSubmit={(e) => {
                       e.preventDefault();
                       if (inputText.trim() && socket) {
                         socket.send(JSON.stringify({ type: "text", content: inputText }));
                         setMessages(prev => [...prev, { role: "user", text: inputText }]);
                         setInputText("");
                       }
                     }} className="flex-1 flex items-center">
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Type fallback message..."
                          className="bg-transparent border-none focus:ring-0 text-xs px-4 py-3 flex-1 outline-none text-slate-400 placeholder:text-slate-700"
                        />
                        <button type="submit" className="p-2 text-blue-600 hover:text-blue-400 transition-colors mr-1">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                     </form>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {isConnected && <div className="h-20 mt-4 flex items-center justify-between px-6 bg-slate-950/60 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shrink-0">
           <div className="flex gap-2">
             <button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-xl transition-all border border-white/5"><Mic className="w-6 h-6" /></button>
             <button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-xl transition-all border border-white/5"><Video className="w-6 h-6" /></button>
           </div>
           
           <div className="hidden md:block bg-slate-900/50 px-6 py-3 rounded-full border border-white/5 select-none">
             <span className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500">Secure AES-256 Session</span>
           </div>

           <div>
              <button 
                onClick={() => setShowEndModal(true)}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-950/10 flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">End Interview</span>
              </button>
           </div>
        </div>}

      </main>

      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-white/10 p-8 shadow-2xl relative"
             >
               <div className="absolute top-0 inset-x-0 h-1 bg-red-500/50" />
               <h2 className="text-xl font-bold mb-2">End interview?</h2>
               <p className="text-sm text-slate-400 mb-8 leading-relaxed">This will terminate the session and save your progress.</p>
               <div className="flex gap-4">
                 <button onClick={() => setShowEndModal(false)} className="flex-1 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl">Stay</button>
                 <button onClick={handleEnd} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl">End</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}
