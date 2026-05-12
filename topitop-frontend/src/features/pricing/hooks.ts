import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Product,
  Promotion,
  StockMovement,
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

export type PricedProduct = Product & { margin: number };

export function usePricingConfig() {
  return useQuery({
    queryKey: ["pricing", "config"],
    queryFn: () =>
      fetchJson<{ minMarginPct: number }>("/api/pricing/config"),
  });
}

export function usePricingProducts() {
  return useQuery({
    queryKey: ["pricing", "products"],
    queryFn: () =>
      fetchJson<{ products: PricedProduct[] }>(
        "/api/pricing/products",
      ).then((d) => d.products),
  });
}

export function useUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      fetchJson<{ product: PricedProduct }>(
        `/api/pricing/products/${id}/price`,
        {
          method: "PATCH",
          body: JSON.stringify({ price }),
        },
      ).then((d) => d.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing"] }),
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: ["pricing", "promotions"],
    queryFn: () =>
      fetchJson<{ promotions: Promotion[] }>("/api/pricing/promotions").then(
        (d) => d.promotions,
      ),
  });
}

export type PromotionInput = {
  productId: string | null;
  name: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  startsAt: string;
  endsAt: string;
};

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromotionInput) =>
      fetchJson<{ promotion: Promotion }>("/api/pricing/promotions", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((d) => d.promotion),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing", "promotions"] }),
  });
}

export function useTogglePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fetchJson<{ promotion: Promotion }>(
        `/api/pricing/promotions/${id}/toggle`,
        { method: "PATCH", body: JSON.stringify({ active }) },
      ).then((d) => d.promotion),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing", "promotions"] }),
  });
}

export function useRestock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      deltaQty,
      reason,
      note,
    }: {
      id: string;
      deltaQty: number;
      reason: "restock" | "adjustment" | "return";
      note?: string;
    }) =>
      fetchJson<{ stock: number }>(`/api/pricing/products/${id}/restock`, {
        method: "POST",
        body: JSON.stringify({ deltaQty, reason, note }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing"] }),
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: ["pricing", "stock-movements"],
    queryFn: () =>
      fetchJson<{ movements: StockMovement[] }>(
        "/api/pricing/stock-movements",
      ).then((d) => d.movements),
  });
}
