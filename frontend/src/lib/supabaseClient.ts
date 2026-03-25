/**
 * Supabase client utilities for both browser and server environments.
 * Uses @supabase/ssr for proper cookie-based session handling.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton browser client — safe to call in Client Components.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Convenience default export for quick usage.
 */
export const supabase = getSupabaseBrowserClient();
