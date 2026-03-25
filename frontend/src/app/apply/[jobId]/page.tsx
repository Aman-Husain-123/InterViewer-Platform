"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Briefcase, Upload, Send, Loader2, MapPin } from "lucide-react";

export default function JobApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      setJob(data);
      setFetching(false);
    };
    fetchJob();
  }, [jobId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please upload your resume");

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_id", jobId);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);

    try {
      const res = await fetch("http://localhost:8000/api/v1/applications/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/apply/success?applicationId=${data.application_id}&score=${data.match_score}&status=${data.status}`);
      } else {
        alert(data.detail || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Network error. Make sure your backend API is running.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="py-12 border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Briefcase className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-black text-white italic underline decoration-indigo-500/50 underline-offset-4">{job?.title || "Apply for Position"}</h1>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job?.location || "Remote"}</span>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <span>JD-Verified System Assessment</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                placeholder="+1 (234) 567-8900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Upload Resume (PDF/DOCX)</label>
              <label className={`flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/5 rounded-3xl cursor-pointer hover:border-indigo-500/40 transition-all ${file ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-800/20'}`}>
                <div className="flex flex-col items-center">
                  <Upload className={`w-8 h-8 mb-2 ${file ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                  <span className="text-sm font-bold text-slate-400 tracking-tight">{file ? file.name : "Click to upload resume"}</span>
                  <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mt-1">Maximum 5mb • PDF or Word</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 tracking-widest shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              SUBMIT APPLICATION
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
