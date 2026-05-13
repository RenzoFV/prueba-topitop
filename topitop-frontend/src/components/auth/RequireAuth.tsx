import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useStableSession } from "@/lib/use-stable-session";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isInitialLoading } = useStableSession();
  const location = useLocation();
  if (isInitialLoading) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
