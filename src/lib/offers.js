import { INSURERS } from "../data/insurers.js";
import { INSURER_PRODUCTS, RATE_TABLE_SOURCE } from "../data/insurerProducts.js";

// The insurers who sell a product, in the order INSURERS lists them, each
// carrying the offer that says how it is rated.
export function insurersFor(product) {
  const map = INSURER_PRODUCTS[product.id] || {};
  return INSURERS.filter((i) => map[i.id]).map((i) => ({ ...i, offer: map[i.id] }));
}

export function offerFor(product, insurer) {
  if (!product || !insurer) return null;
  return INSURER_PRODUCTS[product.id]?.[insurer.id] || null;
}

// A premium is indicative unless the product has a real rate table AND this
// insurer either prices at that tariff or publishes its own rate.
export function isIndicative(product, offer) {
  if (!offer) return true;
  if (offer.basis === "indicative") return true;
  return !RATE_TABLE_SOURCE[product.id] && offer.basis !== "published";
}

export const BASIS_LABEL = {
  published: "Insurer's own listed rate",
  tariff: "Authority tariff rate",
  indicative: "Indicative — rate on request",
};
