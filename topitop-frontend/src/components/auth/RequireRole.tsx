import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useStableSession } from "@/lib/use-stable-session";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import type { Role } from "@/lib/roles";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { data: session, isInitialLoading } = useStableSession();
  const location = useLocation();
  if (isInitialLoading) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const role = session.user.role as Role | null | undefined;
  if (role !== "admin" && (!role || !roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
