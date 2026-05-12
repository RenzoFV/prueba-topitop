import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import type { Role } from "@/lib/roles";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  if (isPending) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const role = session.user.role as Role | null | undefined;
  if (role !== "admin" && (!role || !roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
