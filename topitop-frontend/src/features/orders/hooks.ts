import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/features/products/types";

const API = import.meta.env.VITE_API_URL;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function useOrders(params: { status?: OrderStatus } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  return useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () =>
      fetchJson<{ orders: Order[] }>(`/api/orders/orders?${qs.toString()}`).then(
        (d) => d.orders,
      ),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    enabled: !!id,
    queryFn: () =>
      fetchJson<{ order: Order; items: OrderItem[] }>(`/api/orders/orders/${id}`),
  });
}

export type OrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
};

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) =>
      fetchJson<{ order: Order }>("/api/orders/orders", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      fetchJson<{ order: Order }>(`/api/orders/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      carrier,
      trackingNumber,
      trackingUrl,
    }: {
      id: string;
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
    }) =>
      fetchJson<{ order: Order }>(`/api/orders/orders/${id}/tracking`, {
        method: "PATCH",
        body: JSON.stringify({ carrier, trackingNumber, trackingUrl }),
      }).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ products: number; orders: number; promotions: number }>(
        "/api/seed/run",
        { method: "POST" },
      ),
    onSuccess: () => qc.invalidateQueries(),
  });
}
