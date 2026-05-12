import { Navigate } from "react-router";
import { useSession } from "@/lib/auth-client";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ROLE_HOME, type Role } from "@/lib/roles";

export function HomeRedirect() {
  const { data: session, isPending } = useSession();
  if (isPending) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  const role = session.user.role as Role | null | undefined;
  const target = role && role in ROLE_HOME ? ROLE_HOME[role] : "/unauthorized";
  return <Navigate to={target} replace />;
}
