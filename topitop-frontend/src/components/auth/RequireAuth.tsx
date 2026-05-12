import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  if (isPending) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
