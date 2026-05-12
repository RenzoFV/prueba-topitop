import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/roles";

type ListUsersParams = {
  limit?: number;
  offset?: number;
  searchValue?: string;
};

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: params.limit ?? 50,
          offset: params.offset ?? 0,
          ...(params.searchValue
            ? {
                searchField: "email" as const,
                searchOperator: "contains" as const,
                searchValue: params.searchValue,
              }
            : {}),
        },
      });
      if (error) throw new Error(error.message ?? "Error listando usuarios");
      return data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      password: string;
      role: Role;
    }) => {
      const { data, error } = await authClient.admin.createUser({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role as "admin",
      });
      if (error) throw new Error(error.message ?? "Error creando usuario");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: Role }) => {
      const { data, error } = await authClient.admin.setRole({
        userId: input.userId,
        role: input.role as "admin",
      });
      if (error) throw new Error(error.message ?? "Error cambiando rol");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; banReason?: string }) => {
      const { data, error } = await authClient.admin.banUser({
        userId: input.userId,
        banReason: input.banReason ?? "Banned by admin",
      });
      if (error) throw new Error(error.message ?? "Error baneando usuario");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string }) => {
      const { data, error } = await authClient.admin.unbanUser({
        userId: input.userId,
      });
      if (error) throw new Error(error.message ?? "Error desbaneando usuario");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string }) => {
      const { data, error } = await authClient.admin.removeUser({
        userId: input.userId,
      });
      if (error) throw new Error(error.message ?? "Error eliminando usuario");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
