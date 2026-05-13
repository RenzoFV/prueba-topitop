import { useRef } from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Wrapper de useSession() que distingue la carga inicial de los refetches
 * por foco de ventana. Después de la primera resolución, `isInitialLoading`
 * es siempre `false` aunque Better Auth refetch en background.
 */
export function useStableSession() {
  const result = useSession();
  const hasResolvedRef = useRef(false);
  if (!result.isPending) hasResolvedRef.current = true;
  return {
    ...result,
    isInitialLoading: !hasResolvedRef.current && result.isPending,
  };
}
