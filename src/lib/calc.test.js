import { describe, it, expect } from "vitest";
import { calc, dayBandPremium } from "./calc.js";
import { PRODUCTS } from "../data/products.js";
import { RATE_TABLES } from "../data/rateTables.js";

// The premium calculator is the one part of this app where being wrong costs
// someone money, and it is the only part with no UI to notice a wrong answer
// in. Every expectation below is worked out from the rate table by hand rather
// than recorded from a previous run, so a change in behaviour fails the test
// instead of quietly rewriting what "correct" means.

const product = (id) => PRODUCTS.find((p) => p.id === id);
const quoteFor = (id, overrides = {}, factor = 1) => {
  const p = product(id);
  return calc(p, factor, { ...p.defaults, ...overrides });
};
const row = (quote, fragment) => quote.rows.find((r) => r.label.includes(fragment));

describe("per_mille products", () => {
  it("prices an individual personal accident policy off the Directive 2078 floor", () => {
    // Rs 5,00,000 at Rs 2 per 1,000 = 1,000; RSMDST at 15 paisa = 75; no VAT
    // on this line; stamp duty Rs 20.
    const q = quoteFor("pa-individual-1");
    expect(row(q, "Normal premium").value).toBe(1000);
    expect(row(q, "RSMDST").value).toBe(75);
    expect(q.net).toBe(1095);
  });

  it("applies the direct-business discount to the normal rate but not to RSMDST", () => {
    // Section 15(2) allows 5% off, explicitly excluding the RSMDST premium:
    // 2.00 -> 1.90 per mille = 950, with RSMDST unchanged at 75.
    const q = quoteFor("pa-individual-1", { direct_business: true });
    expect(row(q, "Normal premium").value).toBe(950);
    expect(row(q, "RSMDST").value).toBe(75);
    expect(q.net).toBe(1045);
  });

  it("enforces the Rs 100 minimum premium on a tiny sum insured", () => {
    // Rs 1,000 sum insured earns Rs 2 + 0.15 + 20 stamp = 22.15, below the
    // Section 17(1) floor, so the policy still costs Rs 100.
    const q = quoteFor("pa-individual-1", { sum_insured: 1000 });
    expect(q.net).toBe(100);
    expect(row(q, "Minimum premium floor")).toBeTruthy();
  });

  it("picks the group-size tier for group personal accident", () => {
    // 30 people is Section 16(1)(kha): Rs 1.75 per 1,000, on each person's own
    // sum insured. 30 x 3,00,000 = 90,00,000 -> 15,750 normal, 1,350 RSMDST.
    const q = quoteFor("pa-1", { sum_insured_per_person: 300000, number_of_persons: 30 });
    expect(row(q, "Normal premium").value).toBe(15750);
    expect(row(q, "RSMDST").value).toBe(1350);
    expect(q.net).toBe(17120);
  });

  it("moves down a tier as the group grows past 100", () => {
    const small = quoteFor("pa-1", { sum_insured_per_person: 100000, number_of_persons: 25 });
    const large = quoteFor("pa-1", { sum_insured_per_person: 100000, number_of_persons: 101 });
    expect(row(small, "Normal premium").value).toBe(25 * 100000 * 2.0 / 1000);
    expect(row(large, "Normal premium").value).toBe(101 * 100000 * 1.5 / 1000);
  });
});

describe("motor", () => {
  it("prices a motorcycle at 1.5% of declared value with the fixed third-party fee", () => {
    // 3,00,000 x 1.5% = 4,500; 15% no-claim discount = 675; own damage 3,825.
    // 150cc falls in the first third-party band, Rs 1,500. VAT 13% on the sum
    // of the two, plus Rs 100 stamp duty.
    const q = quoteFor("motor-1");
    expect(row(q, "Own-damage premium").value).toBe(4500);
    expect(row(q, "No-claim discount").value).toBe(-675);
    expect(row(q, "Third-party").value).toBe(1500);
    expect(q.net).toBeCloseTo(3825 + 1500 + (3825 + 1500) * 0.13 + 100, 2);
  });

  it("does not scale the third-party premium by the insurer factor", () => {
    // Third-party is a market-wide mandated rate: every insurer charges it.
    const cheap = quoteFor("motor-1", {}, 0.93);
    const dear = quoteFor("motor-1", {}, 1.07);
    expect(row(cheap, "Third-party").value).toBe(row(dear, "Third-party").value);
    expect(row(cheap, "Own-damage premium").value).toBeLessThan(row(dear, "Own-damage premium").value);
  });

  it("charges the over-10-years surcharge on a motorcycle", () => {
    // 25% surcharge on the rate itself: 1.5% -> 1.875%.
    const q = quoteFor("motor-1", { vehicle_age_band: "over10" });
    expect(row(q, "Own-damage premium").value).toBe(300000 * 0.01875);
  });

  it("never drops own-damage below the minimum premium", () => {
    const q = quoteFor("motor-1", { sum_insured: 10000, no_claim_discount: "3yr+_35pct", direct_business: true });
    expect(row(q, "Own-damage premium").value).toBe(RATE_TABLES["motor-1"].min_own_damage_premium);
  });

  it("splits a car's declared value across the two rate tiers", () => {
    // 30 lakh is in the top band: 0.90% on the first 20 lakh, 1.12% on the
    // remaining 10 lakh, with that band's own Rs 6,000 third-party fee.
    const q = quoteFor("private-car-1", { sum_insured: 3000000, no_claim_discount: "0yr_0pct" });
    expect(row(q, "Own-damage premium").value).toBeCloseTo(2000000 * 0.009 + 1000000 * 0.0112, 2);
    expect(row(q, "Third-party").value).toBe(6000);
  });
});

describe("travel day bands", () => {
  it("looks a trip up by the band its length falls in", () => {
    // 10 days is the 8-14 band: asian/package/5-40 is USD 22.
    const q = quoteFor("travel-1", { days: 10, plan: "asian", cover_type: "package", age_band: "5-40", usd_rate: 138 });
    expect(q.net).toBeCloseTo(22 * 138 * 1.13 + 50, 2);
  });

  it("charges the same for every day inside one band", () => {
    const base = { plan: "asian", cover_type: "package", age_band: "5-40", usd_rate: 138 };
    expect(quoteFor("travel-1", { ...base, days: 8 }).net).toBe(quoteFor("travel-1", { ...base, days: 14 }).net);
    expect(quoteFor("travel-1", { ...base, days: 15 }).net).toBeGreaterThan(quoteFor("travel-1", { ...base, days: 14 }).net);
  });

  it("loads the 71-79 band at twice the 61-70 rate", () => {
    // Rating note 4: older ages price off the 61-70 row with a multiplier,
    // not off a row of their own.
    const base = { days: 10, plan: "asian", cover_type: "package", usd_rate: 1 };
    const sixties = quoteFor("travel-1", { ...base, age_band: "61-70" });
    const seventies = quoteFor("travel-1", { ...base, age_band: "71-79" });
    const eighties = quoteFor("travel-1", { ...base, age_band: "80-84" });
    expect(row(seventies, "Premium").label).toContain("2×");
    expect(row(seventies, "Premium").value).toBeCloseTo(row(sixties, "Premium").value * 2, 2);
    expect(row(eighties, "Premium").value).toBeCloseTo(row(sixties, "Premium").value * 3, 2);
  });

  it("extends a trip past 180 days as the 180-day rate plus the excess days", () => {
    // Rating note 5. asian/package/5-40: 148-180 is 125, and the extra 20 days
    // price as the 15-21 band at 23.
    const table = RATE_TABLES["travel-1"];
    const ageRow = table.plans.asian.package["5-40"];
    expect(dayBandPremium(table.day_bands, ageRow, 200)).toBe(125 + 23);
    expect(dayBandPremium(table.day_bands, ageRow, 180)).toBe(125);
  });

  it("uses the SAARC plan's single combined table, ignoring cover type", () => {
    const base = { days: 10, plan: "saarc", age_band: "5-40", usd_rate: 1 };
    expect(quoteFor("travel-1", { ...base, cover_type: "medical_only" }).net)
      .toBe(quoteFor("travel-1", { ...base, cover_type: "package" }).net);
  });

  it("prices Schengen off its own EUR table", () => {
    // 10 days, 5-40 is EUR 20.60 on the 2025 Euro Plan sheet.
    const q = quoteFor("schengen-1", { days: 10, age_band: "5-40", fx_rate: 150 });
    expect(q.net).toBeCloseTo(20.6 * 150 * 1.13 + 50, 2);
  });
});

describe("marine cargo", () => {
  it("converts a foreign-currency invoice before rating it", () => {
    // The sum insured is 110% of the invoice value, and a USD invoice has to be
    // converted first — getting this wrong quotes off a bare USD number.
    const q = quoteFor("marine-1", { invoice_currency: "USD", fx_rate: 138, sum_insured: 10000 });
    expect(row(q, "Sum insured").value).toBeCloseTo(10000 * 138 * 1.1, 2);
  });

  it("ignores the FX rate for a NPR invoice", () => {
    const q = quoteFor("marine-1", { invoice_currency: "NPR", fx_rate: 138, sum_insured: 1000000 });
    expect(row(q, "Sum insured").value).toBeCloseTo(1100000, 2);
  });

  it("clamps the insurer factor at 1.0, because the directive rate is a minimum", () => {
    const floor = quoteFor("marine-1", {}, 1.0);
    const cheaper = quoteFor("marine-1", {}, 0.93);
    const dearer = quoteFor("marine-1", {}, 1.07);
    expect(cheaper.net).toBe(floor.net);
    expect(dearer.net).toBeGreaterThan(floor.net);
  });

  it("discounts the base premium by transit mode", () => {
    const sea = quoteFor("marine-1", { transit_mode: "sea" });
    const air = quoteFor("marine-1", { transit_mode: "air" });
    expect(row(sea, "Transit discount")).toBeUndefined();
    expect(row(air, "Transit discount").value).toBeCloseTo(-row(air, "Base premium").value * 0.2, 2);
  });
});

describe("property and matrix products", () => {
  it("rates a home across both tiers", () => {
    // 2 crore: the first 1 crore at 0.5 per mille, the rest at 1.5 per mille.
    const q = quoteFor("property-1", { sum_insured: 20000000 });
    expect(row(q, "Premium").value).toBe(10000000 * 0.0005 + 10000000 * 0.0015);
    expect(q.net).toBeCloseTo(20000 * 1.13 + 100, 2);
  });

  it("allows only the 5% direct-business discount on a home policy", () => {
    const q = quoteFor("property-1", { sum_insured: 20000000, direct_business: true });
    expect(row(q, "Direct business discount").value).toBe(-1000);
  });

  it("reads individual health premiums straight out of the band matrix", () => {
    const q = quoteFor("health-1", { sum_insured: "500000", plan_tier: "basic", age_band: "26-35" });
    expect(row(q, "Premium").value).toBe(7700);
    expect(q.net).toBe(7740);
  });
});

describe("every product quotes", () => {
  it("returns a positive net premium on its own defaults, for any insurer factor", () => {
    // A product with no rate table, or one whose shape doesn't match its
    // rateStructureType, silently returns zero — which looks like a free
    // policy on the comparison screen rather than an error.
    PRODUCTS.forEach((p) => {
      [0.93, 1.0, 1.07].forEach((factor) => {
        const q = calc(p, factor, p.defaults);
        expect(q.net, `${p.id} at factor ${factor}`).toBeGreaterThan(0);
        expect(q.rows.length, `${p.id} has no breakdown`).toBeGreaterThan(0);
        q.rows.forEach((r) => expect(Number.isFinite(r.value), `${p.id}: ${r.label}`).toBe(true));
      });
    });
  });

  it("has a rate table for every product in the catalogue", () => {
    PRODUCTS.forEach((p) => expect(RATE_TABLES[p.id], `no rate table for ${p.id}`).toBeTruthy());
  });
});
