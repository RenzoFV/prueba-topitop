import { env } from "../env.js";

export function minAllowedPrice(cost: number): number {
  const factor = 1 + env.PRICING_MIN_MARGIN_PCT / 100;
  return +(cost * factor).toFixed(2);
}

export function marginPercent(cost: number, price: number): number {
  if (cost <= 0) return 0;
  return +(((price - cost) / cost) * 100).toFixed(2);
}

export type PriceValidation =
  | { ok: true; margin: number }
  | { ok: false; margin: number; minPrice: number; minMargin: number };

export function validatePrice(cost: number, price: number): PriceValidation {
  const margin = marginPercent(cost, price);
  if (margin < env.PRICING_MIN_MARGIN_PCT) {
    return {
      ok: false,
      margin,
      minPrice: minAllowedPrice(cost),
      minMargin: env.PRICING_MIN_MARGIN_PCT,
    };
  }
  return { ok: true, margin };
}

export function applyDiscount(
  basePrice: number,
  discountType: "percent" | "fixed",
  discountValue: number,
): number {
  if (discountType === "percent") {
    return +(basePrice * (1 - discountValue / 100)).toFixed(2);
  }
  return +Math.max(0, basePrice - discountValue).toFixed(2);
}
