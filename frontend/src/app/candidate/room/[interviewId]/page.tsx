"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebRTC, InterviewRound } from "@/hooks/useWebRTC";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Settings, Shield, User,
  Activity, Clock, ChevronRight, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROUND_DETAILS: Record<InterviewRound, { label: string; description: string }> = {
  INTRO: { label: "Introduction", description: "Identity verification & background" },
  TECHNICAL: { label: "Technical Round", description: "Deep dive into skills & JD" },
  HR: { label: "Behavioral / HR", description: "Soft skills & STAR method" },
  SALARY: { label: "Negotiation", description: "Compensation & CTC discussion" },
  COMPLETED: { label: "Finished", description: "Interview successfully completed" },
};

const ROUNDS: InterviewRound[] = ["INTRO", "TECHNICAL", "HR", "SALARY", "COMPLETED"];

export default function InterviewRoomPage() {
  const { interviewId } = useParams() as { interviewId: string };
  const router = useRouter();

  const {
    isConnected,
    isConnecting,
    error,
    localStream,
    currentRound,
    isAgentSpeaking,
    messages,
    connect,
    disconnect,
    sendMessage,
  } = useWebRTC({
    interviewId,
    backendUrl: "ws://localhost:8000/ws/v1/interview",
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState("");

  // Start connection on mount (user clicks 'Join' in a real app, but here we auto-join)
  useEffect(() => {
    // connect(); // We'll let the user click a visual 'Ready' button first
  }, [connect]);

  const handleToggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    disconnect();
    router.push("/candidate/dashboard");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Header / Status Bar */}
      <header className="h-16 px-6 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">AI Skills Assessment</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Interview Room • {interviewId.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-mono">12:45 / 45:00</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          
          {/* Top Info Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Current Round</span>
                <span className="text-lg font-semibold text-white">{ROUND_DETAILS[currentRound].label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
              <p className="text-sm text-slate-400 mt-4">{ROUND_DETAILS[currentRound].description}</p>
            </div>
            
            {/* Round Stepper */}
            <div className="flex gap-2">
                  {ROUNDS.map((round) => (
                <div 
                  key={round}
                  className={`w-10 h-1.5 rounded-full transition-all duration-500 ${
                    currentRound === round ? 'bg-blue-500 w-16' : 
                    ROUNDS.indexOf(round) < ROUNDS.indexOf(currentRound) ? 'bg-green-500/50' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {!isConnected && !isConnecting ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 flex flex-col items-center text-center max-w-md gap-6 shadow-2xl">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Video className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to start?</h2>
                  <p className="text-slate-400 text-sm">Join the AI interviewer for your scheduled session. Ensure your microphone and camera are working.</p>
                </div>
                <button 
                  onClick={connect}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Enter Interview Room <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
              {/* AI Presenter (Large) */}
              <div className="col-span-12 lg:col-span-8 bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden group">
                {/* Virtual AI Avatar Placeholder / Speaking Viz */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <AnimatePresence>
                      {isAgentSpeaking && (
                        <>
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: [0.1, 0.3, 0.1] }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
                          />
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: [0.2, 0.4, 0.2] }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                            className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl"
                          />
                        </>
                      )}
                    </AnimatePresence>
                    <div className="relative z-10 w-48 h-48 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center shadow-2xl">
                      <Activity className={`w-16 h-16 ${isAgentSpeaking ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                    </div>
                  </div>
                </div>

                {/* AI Label */}
                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Interviewer</span>
                </div>

                {/* Subtitles / Latest Message Overlay */}
                <div className="absolute bottom-10 inset-x-0 flex justify-center px-12">
                  <AnimatePresence mode="wait">
                    {messages.length > 0 && messages[messages.length - 1].type === "agent_response" && (
                      <motion.div
                        key={messages[messages.length - 1].text}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="bg-black/60 backdrop-blur-lg px-6 py-4 rounded-2xl border border-white/10 text-center max-w-2xl"
                      >
                        <p className="text-white text-lg font-medium leading-relaxed">
                          "{messages[messages.length - 1].text}"
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Local Participant (Small) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="aspect-video lg:aspect-square bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden group">
                  {localStream && !isVideoOff ? (
                    <video 
                      ref={el => { if (el) el.srcObject = localStream; }} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-600" />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Camera is off</span>
                    </div>
                  )}
                  
                  {/* Local Label */}
                  <div className="absolute top-4 left-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">You (Candidate)</span>
                  </div>

                  {isMuted && (
                    <div className="absolute top-4 right-4 bg-red-500/80 p-1.5 rounded-full">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Chat / Transcript Panel */}
                <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Live Transcript</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.type === 'user_input' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          msg.type === 'user_input' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                        <MessageSquare className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-medium uppercase tracking-widest">Awaiting interaction...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="h-20 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/5 flex items-center justify-between px-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleToggleMute}
                className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button 
                onClick={handleToggleVideo}
                className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
              <button className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all">
                <Settings className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden md:flex items-center bg-slate-950/50 rounded-2xl border border-white/5 px-2 py-1 w-1/3">
               <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                 <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or response..."
                  className="bg-transparent border-none focus:ring-0 text-sm py-2 px-2 flex-1 outline-none"
                 />
                 <button type="submit" className="p-2 text-blue-500 hover:text-blue-400">
                    <ChevronRight className="w-6 h-6" />
                 </button>
               </form>
            </div>

            <div>
              <button 
                onClick={handleEndCall}
                className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">End Interview</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
