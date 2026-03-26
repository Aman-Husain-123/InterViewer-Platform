// filepath: frontend/src/components/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "recruiter" | "candidate";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // Not authenticated
    if (!user || !role) {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role if required
    if (requiredRole && role !== requiredRole) {
      // Redirect to appropriate dashboard based on actual role
      const dashboardUrl = role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
      router.push(dashboardUrl);
      return;
    }
  }, [user, role, loading, pathname, router, requiredRole]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-600"></div>
          </div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has correct role
  if (!user || !role) {
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
