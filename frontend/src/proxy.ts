/**
 * Next.js Middleware — protects /candidate/* and /recruiter/* using Supabase SSR.
 * Redirects unauthenticated users to /login, and redirected logged-in users
 * away from /login and /register to their role-based dashboard.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT add code between createServerClient and getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Protect /candidate/* and /recruiter/* — redirect to /login if not authed
    const isProtected =
        pathname.startsWith("/candidate") || pathname.startsWith("/recruiter");
    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from /login and /register
    if (user && (pathname === "/login" || pathname === "/register")) {
        // Fetch role from profiles table
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role ?? "candidate";
        const url = request.nextUrl.clone();
        url.pathname =
            role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
