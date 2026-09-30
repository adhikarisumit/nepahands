import type { StoreSettings } from "./types";

/**
 * Shipping rule (edited in Admin → Settings):
 *   - `rate`      flat charge per order (store_settings.shipping_flat)
 *   - `minPrice`  products priced AT OR BELOW this ship free (store_settings.free_shipping_threshold)
 * An order pays the flat rate only if it contains at least one product priced above `minPrice`.
 * `minPrice` = 0 means every order pays shipping; `rate` = 0 means shipping is always free.
 */
export type ShippingRule = { rate: number; minPrice: number };

export function shippingRule(settings: Pick<StoreSettings, "shipping_flat" | "free_shipping_threshold">): ShippingRule {
  return {
    rate: Math.max(0, Number(settings.shipping_flat) || 0),
    minPrice: Math.max(0, Number(settings.free_shipping_threshold) || 0),
  };
}

/** Does a product at this price trigger the shipping charge? */
export const productNeedsShipping = (price: number, rule: ShippingRule) => rule.rate > 0 && Number(price) > rule.minPrice;

/** Shipping for a whole cart: the flat rate once, if any item triggers it. */
export const cartShipping = (prices: number[], rule: ShippingRule) => (prices.some((p) => productNeedsShipping(p, rule)) ? rule.rate : 0);
