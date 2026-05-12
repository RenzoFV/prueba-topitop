import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuditEntry,
  Product,
  ProductStatus,
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

export function useProducts(params: { q?: string; status?: ProductStatus } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  return useQuery({
    queryKey: ["pim", "products", params],
    queryFn: () =>
      fetchJson<{ products: Product[] }>(
        `/api/pim/products?${qs.toString()}`,
      ).then((d) => d.products),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["pim", "product", id],
    enabled: !!id,
    queryFn: () =>
      fetchJson<{ product: Product }>(`/api/pim/products/${id}`).then(
        (d) => d.product,
      ),
  });
}

export function useProductAudit(id: string | undefined) {
  return useQuery({
    queryKey: ["pim", "product-audit", id],
    enabled: !!id,
    queryFn: () =>
      fetchJson<{ entries: AuditEntry[] }>(
        `/api/pim/products/${id}/audit`,
      ).then((d) => d.entries),
  });
}

export type ProductInput = {
  sku: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: ProductStatus;
  cost: number;
  price: number;
  stock: number;
};

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      fetchJson<{ product: Product }>("/api/pim/products", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((d) => d.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pim"] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) =>
      fetchJson<{ product: Product }>(`/api/pim/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }).then((d) => d.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pim"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/pim/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pim"] }),
  });
}

export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("productId", productId);
  const res = await fetch(`${API}/api/pim/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
