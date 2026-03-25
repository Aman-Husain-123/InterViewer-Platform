/**
 * useUser hook — returns the current Supabase session user and profile.
 * Handles loading state, sign-out, and role-based routing.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UseUserReturn {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(
        async (userId: string) => {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            setProfile(data ?? null);
        },
        [supabase]
    );

    useEffect(() => {
        // Get initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) fetchProfile(user.id).finally(() => setIsLoading(false));
            else setIsLoading(false);
        });

        // Subscribe to auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, fetchProfile]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }, [supabase, router]);

    return { user, profile, isLoading, signOut };
}
