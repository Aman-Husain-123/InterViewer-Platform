"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole; label: string; description: string }[] = [
    {
        value: "candidate",
        label: "Candidate",
        description: "Apply for jobs and attend AI-powered interviews",
    },
    {
        value: "recruiter",
        label: "Recruiter",
        description: "Post jobs, review applications, and evaluate candidates",
    },
];

export default function RegisterPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<UserRole>("candidate");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 1. Sign up with Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // 2. Sync to separate tables based on role
        if (data.user) {
            const table = role === "recruiter" ? "recruiters" : "candidates";
            await supabase.from(table).upsert({
                id: data.user.id,
                email,
                full_name: fullName,
            }, { on_conflict: 'id' }).execute();
        }

        setSuccess(true);
        setLoading(false);

        // If email confirmation is disabled, redirect directly
        if (data.session) {
            const destination =
                role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
            router.push(destination);
            router.refresh();
        }
    }

    if (success && !loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10 text-center max-w-md w-full shadow-2xl">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Account created!</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Check your email to confirm your account, then sign in.
                    </p>
                    <Link
                        href={role === 'recruiter' ? "/login" : "/candidate/login"}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 text-sm transition-all shadow-lg shadow-indigo-600/30"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4 py-12">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo mark */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40 mb-4">
                        <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create account</h1>
                    <p className="text-slate-400 mt-1 text-sm">
                        Join AI Interviewer in seconds
                    </p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
                        {/* Full name */}
                        <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Full name
                            </label>
                            <input
                                id="full-name"
                                type="text"
                                autoComplete="name"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Jane Smith"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email address
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Role selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                I am a…
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {ROLES.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        id={`role-${r.value}`}
                                        onClick={() => setRole(r.value)}
                                        className={`relative flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all ${role === r.value
                                                ? "border-indigo-500 bg-indigo-600/20 ring-1 ring-indigo-500"
                                                : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
                                            }`}
                                    >
                                        <span className="font-semibold text-white text-sm">{r.label}</span>
                                        <span className="text-xs text-slate-400 mt-0.5 leading-snug">{r.description}</span>
                                        {role === r.value && (
                                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="register-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-all shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            {loading ? "Creating account…" : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
