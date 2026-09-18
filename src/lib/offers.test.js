import { describe, it, expect } from "vitest";
import { BASIS_LABEL, insurersFor, isIndicative, offerFor } from "./offers.js";
import { INSURER_PRODUCTS, RATE_TABLE_SOURCE } from "../data/insurerProducts.js";
import { INSURERS } from "../data/insurers.js";
import { PRODUCTS } from "../data/products.js";

// The comparison screen is only honest if the map behind it is: a typo'd
// insurer id silently drops a company off a product, and a product missing
// from the map shows an empty screen with no error.

const product = (id) => PRODUCTS.find((p) => p.id === id);
const insurer = (id) => INSURERS.find((i) => i.id === id);

describe("the offer map", () => {
  it("names only insurers that exist", () => {
    const known = new Set(INSURERS.map((i) => i.id));
    Object.entries(INSURER_PRODUCTS).forEach(([productId, map]) => {
      Object.keys(map).forEach((insurerId) =>
        expect(known.has(insurerId), `${productId} lists unknown insurer ${insurerId}`).toBe(true)
      );
    });
  });

  it("names only products that exist, and covers every one of them", () => {
    const catalogue = new Set(PRODUCTS.map((p) => p.id));
    Object.keys(INSURER_PRODUCTS).forEach((id) =>
      expect(catalogue.has(id), `offer map has a stale product ${id}`).toBe(true)
    );
    PRODUCTS.forEach((p) =>
      expect(insurersFor(p).length, `nobody sells ${p.id}`).toBeGreaterThan(0)
    );
  });

  it("gives every offer a basis the screens know how to label", () => {
    Object.entries(INSURER_PRODUCTS).forEach(([productId, map]) => {
      Object.entries(map).forEach(([insurerId, offer]) => {
        expect(BASIS_LABEL[offer.basis], `${productId}/${insurerId}: ${offer.basis}`).toBeTruthy();
        if (offer.ratePerMille != null) {
          expect(offer.basis, `${productId}/${insurerId} carries a rate but isn't published`).toBe("published");
          expect(offer.ratePerMille).toBeGreaterThan(0);
        }
      });
    });
  });

  it("only cites a rate-table source for a product that has one", () => {
    const catalogue = new Set(PRODUCTS.map((p) => p.id));
    Object.keys(RATE_TABLE_SOURCE).forEach((id) =>
      expect(catalogue.has(id), `rate-table source for a product that no longer exists: ${id}`).toBe(true)
    );
  });
});

describe("what counts as indicative", () => {
  it("marks a placeholder premium indicative", () => {
    const p = product("health-1");
    expect(isIndicative(p, offerFor(p, insurer("shikhar")))).toBe(true);
  });

  it("does not mark a tariff premium indicative when the tariff is real", () => {
    const p = product("motor-1");
    expect(isIndicative(p, offerFor(p, insurer("shikhar")))).toBe(false);
  });

  it("does not mark an insurer's own listed rate indicative", () => {
    // Commercial fire has no directive behind its table, but Oriental's Rs 0.4
    // per 1,000 is a real listing, so the premium is not a placeholder.
    const p = product("property-commercial-1");
    expect(RATE_TABLE_SOURCE[p.id]).toBeUndefined();
    expect(isIndicative(p, offerFor(p, insurer("oriental")))).toBe(false);
  });

  it("treats an insurer who does not sell the cover as indicative rather than crashing", () => {
    const p = product("secure-mind-1");
    expect(offerFor(p, insurer("oriental"))).toBeNull();
    expect(isIndicative(p, offerFor(p, insurer("oriental")))).toBe(true);
  });
});

describe("who sells what", () => {
  it("lists all 14 insurers on a tariffed line and a single one on a branded product", () => {
    expect(insurersFor(product("motor-1"))).toHaveLength(INSURERS.length);
    expect(insurersFor(product("shikhar-swasthya-1")).map((i) => i.id)).toEqual(["shikhar"]);
  });

  it("keeps the two engineering covers on the same panel of insurers", () => {
    expect(insurersFor(product("erection-ar-1")).map((i) => i.id))
      .toEqual(insurersFor(product("contractors-ar-1")).map((i) => i.id));
  });
});
