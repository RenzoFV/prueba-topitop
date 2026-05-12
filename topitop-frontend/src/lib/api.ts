import { hc } from "hono/client";
import type { AppType } from "@backend/index.js";

export const api = hc<AppType>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...(init ?? {}), credentials: "include" }),
});
