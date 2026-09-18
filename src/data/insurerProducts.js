import { ALL_INSURER_IDS } from "./insurers.js";

// Build a product's insurer map: `entry` for every id in `ids`.
const offeredBy = (ids, entry) => Object.fromEntries(ids.map((id) => [id, entry]));

// Which insurer sells which product, and on what rating basis:
//
//   "tariff"     The insurer prices this line at the common Nepal Insurance
//                Authority tariff that RATE_TABLES already models. No
//                insurer-specific number exists, so everyone quotes the same
//                premium. On these lines that identical price is the real
//                answer, not a gap in this app.
//   "published"  The insurer publishes its own rate for this line and
//                `ratePerMille` is it — it replaces the table's base rate.
//   "indicative" The insurer sells the cover but quotes only "on request",
//                so the figure shown is this app's own placeholder and is
//                labelled as indicative wherever it appears.
//
// An insurer absent from a product's map does not sell that product, and is
// not shown on that product's comparison screen.
//
// Availability and every published rate below come from one secondary
// source — BFIS Compare's non-life listings, read 18 Sep 2026
// (https://bfis.nepsetrading.com/en/insurance/non-life). That site states its
// own premium figures are illustrative samples, so a "published" rate here is
// a comparison-site listing, NOT an insurer's tariff filing with the
// Authority. None of it has been confirmed against the insurers themselves.
export const INSURER_PRODUCTS = {
  // --- Motor ---------------------------------------------------------------
  // A tariff line, and the listings confirm it: the headline rates quoted for
  // each insurer are the directive's own figures restated. Rs 8.4 and Rs 8.7
  // per 1,000 are its private-car first-tier rates of 0.84% and 0.87%; Rs 15
  // per 1,000 is its 1.5% motorcycle rate. So there is no price spread between
  // insurers on motor, and none is modelled.
  "motor-1": offeredBy(ALL_INSURER_IDS, { basis: "tariff" }),
  "private-car-1": offeredBy(ALL_INSURER_IDS, { basis: "tariff" }),
  // "Auto Plus" is a branded add-on, not a market-wide cover — only these two
  // sell one, and neither publishes a rate.
  "auto-plus-1": offeredBy(["igi-prudential", "shikhar"], { basis: "indicative" }),

  // --- Health --------------------------------------------------------------
  // Retail health is not tariffed, but no insurer publishes a rate table for
  // it, so every premium on this product is still this app's placeholder.
  "health-1": offeredBy(
    ALL_INSURER_IDS.filter((id) => id !== "united-ajod"),
    { basis: "indicative" }
  ),
  // A Shikhar-branded product; nobody else sells it.
  "shikhar-swasthya-1": { shikhar: { basis: "indicative" } },
  "group-medical-1": {
    "nepal-insurance": { basis: "published", ratePerMille: 15 },
    shikhar: { basis: "indicative" },
    prabhu: { basis: "indicative" },
    national: { basis: "indicative" },
  },

  // --- Travel --------------------------------------------------------------
  // The USD rate table this app prices from is Oriental's own filed rate, so
  // it is a published rate for Oriental and a stand-in for everyone else.
  "travel-1": {
    oriental: { basis: "published", note: "The rate table this app prices from is Oriental's own 2024 filing." },
    ...offeredBy(
      ALL_INSURER_IDS.filter((id) => id !== "oriental" && id !== "igi-prudential"),
      { basis: "indicative", note: "Priced off Oriental's filed rate table as a stand-in — this insurer's own travel rates are not published." }
    ),
  },
  // Only Oriental's Schengen Euro Plan rate sheet is public.
  "schengen-1": { oriental: { basis: "published" } },
  "trekkers-1": offeredBy(["shikhar", "prabhu", "neco"], { basis: "indicative" }),

  // --- Accident ------------------------------------------------------------
  // Accident Insurance Directive 2078 sets statutory MINIMUM rates, so this is
  // a tariff line. Neco's listed Rs 2 per 1,000 is exactly the directive's
  // floor for a 2-25 person group, which confirms it.
  "pa-1": {
    ...offeredBy(
      ["nepal-insurance", "oriental", "national", "himalayan-everest", "united-ajod", "neco", "nlg"],
      { basis: "tariff" }
    ),
    shikhar: { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
    sagarmatha: { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
    "sanima-gic": { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
  },
  "pa-individual-1": {
    ...offeredBy(
      ["nepal-insurance", "oriental", "national", "himalayan-everest", "united-ajod", "neco", "nlg"],
      { basis: "tariff" }
    ),
    shikhar: { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
    sagarmatha: { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
    "sanima-gic": { basis: "tariff", note: "Lists Rs 1 per 1,000, below the Directive 2078 Sec. 15(1) minimum of Rs 2 — the statutory floor is applied here instead." },
  },

  // --- Property ------------------------------------------------------------
  // Householder cover is where insurers visibly differ: Shikhar lists the
  // Directive 2080 tier-1 rate of Rs 0.5 per 1,000, three others list Rs 0.75.
  "property-1": {
    shikhar: { basis: "published", ratePerMille: 0.5 },
    "nepal-insurance": { basis: "published", ratePerMille: 0.75 },
    neco: { basis: "published", ratePerMille: 0.75 },
    nlg: { basis: "published", ratePerMille: 0.75 },
    prabhu: { basis: "indicative" },
    oriental: { basis: "indicative" },
  },
  // Commercial fire/property — the widest genuine spread in the whole app,
  // Rs 0.4 to Rs 1.0 per 1,000, a 2.5x difference between the cheapest and
  // dearest insurer on the same cover.
  "property-commercial-1": {
    oriental: { basis: "published", ratePerMille: 0.4 },
    sagarmatha: { basis: "published", ratePerMille: 0.5 },
    "siddhartha-premier": { basis: "published", ratePerMille: 0.75 },
    nlg: { basis: "published", ratePerMille: 0.75 },
    "igi-prudential": { basis: "published", ratePerMille: 0.75 },
    "rastriya-beema": { basis: "published", ratePerMille: 0.75 },
    national: { basis: "published", ratePerMille: 0.75 },
    "nepal-insurance": { basis: "published", ratePerMille: 0.85 },
    "himalayan-everest": { basis: "published", ratePerMille: 1.0 },
    shikhar: { basis: "published", ratePerMille: 1.0 },
    neco: { basis: "published", ratePerMille: 1.0 },
    "united-ajod": { basis: "published", ratePerMille: 1.0 },
    "sanima-gic": { basis: "published", ratePerMille: 1.0 },
    prabhu: { basis: "indicative", note: "Quotes a flat annual figure rather than a rate, so it cannot be applied to an arbitrary sum insured." },
  },

  // --- Marine --------------------------------------------------------------
  // Priced off the 2065 directive's per-cargo-category minimum rates, which
  // every insurer shares. The per-1,000 headline figures the listings show
  // for marine are on a different basis (a single blended rate rather than a
  // cargo-category one) and range from Rs 0.25 to Rs 8.7, so they are not
  // comparable to this table and are not applied.
  "marine-1": offeredBy(ALL_INSURER_IDS, { basis: "tariff" }),

  // --- Aviation ------------------------------------------------------------
  // Four of the fourteen do not write aviation at all.
  "aviation-1": {
    "himalayan-everest": { basis: "published", ratePerMille: 0.75 },
    prabhu: { basis: "published", ratePerMille: 0.75 },
    oriental: { basis: "published", ratePerMille: 0.75 },
    "rastriya-beema": { basis: "published", ratePerMille: 0.75 },
    shikhar: { basis: "published", ratePerMille: 1.25 },
    "igi-prudential": { basis: "published", ratePerMille: 1.5 },
    sagarmatha: { basis: "published", ratePerMille: 5.0 },
    "nepal-insurance": { basis: "indicative" },
    neco: { basis: "indicative" },
    nlg: { basis: "indicative" },
  },

  // --- Business ------------------------------------------------------------
  // Contractors' and Erection All Risk are both written off the same
  // engineering rate, so they share a map.
  "contractors-ar-1": {
    oriental: { basis: "published", ratePerMille: 1.0 },
    "rastriya-beema": { basis: "published", ratePerMille: 1.0 },
    "siddhartha-premier": { basis: "published", ratePerMille: 1.5 },
    "himalayan-everest": { basis: "published", ratePerMille: 2.0 },
    "united-ajod": { basis: "published", ratePerMille: 2.0 },
    "igi-prudential": { basis: "published", ratePerMille: 2.0 },
    nlg: { basis: "published", ratePerMille: 2.5 },
    sagarmatha: { basis: "published", ratePerMille: 3.0 },
    shikhar: { basis: "indicative" },
    prabhu: { basis: "indicative" },
    "nepal-insurance": { basis: "indicative" },
    neco: { basis: "indicative" },
    "sanima-gic": { basis: "indicative" },
    national: { basis: "indicative" },
  },

  // The four covers below are sold inside a combined "miscellaneous lines"
  // policy, and the rate listed is for that whole bucket rather than for the
  // individual cover — noted on each entry so the quote does not read as a
  // product-specific rate.
  "cash-1": {
    "himalayan-everest": { basis: "published", ratePerMille: 0.75, note: "The insurer's combined miscellaneous-lines rate, not a cash-in-transit rate specifically." },
    nlg: { basis: "published", ratePerMille: 2.5, note: "The insurer's combined miscellaneous-lines rate, not a cash-in-transit rate specifically." },
    sagarmatha: { basis: "indicative" },
    "nepal-insurance": { basis: "indicative" },
    "united-ajod": { basis: "indicative" },
    "sanima-gic": { basis: "indicative" },
    national: { basis: "indicative" },
  },
  "bankers-indemnity-1": offeredBy(
    ["nepal-insurance", "united-ajod", "sagarmatha", "sanima-gic"],
    { basis: "indicative" }
  ),
  "fidelity-1": {
    "himalayan-everest": { basis: "published", ratePerMille: 0.75, note: "The insurer's combined miscellaneous-lines rate, not a fidelity guarantee rate specifically." },
    oriental: { basis: "published", ratePerMille: 0.75, note: "The insurer's combined miscellaneous-lines rate, not a fidelity guarantee rate specifically." },
    nlg: { basis: "published", ratePerMille: 2.5, note: "The insurer's combined miscellaneous-lines rate, not a fidelity guarantee rate specifically." },
    sagarmatha: { basis: "indicative" },
    "nepal-insurance": { basis: "indicative" },
    "united-ajod": { basis: "indicative" },
    "sanima-gic": { basis: "indicative" },
  },
  "public-liability-1": {
    "himalayan-everest": { basis: "published", ratePerMille: 0.75, note: "The insurer's combined miscellaneous-lines rate, not a public liability rate specifically." },
    oriental: { basis: "published", ratePerMille: 0.75, note: "The insurer's combined miscellaneous-lines rate, not a public liability rate specifically." },
    nlg: { basis: "published", ratePerMille: 2.5, note: "The insurer's combined miscellaneous-lines rate, not a public liability rate specifically." },
    "nepal-insurance": { basis: "indicative" },
    "sanima-gic": { basis: "indicative" },
  },
  // A Shikhar-branded loan-protection product; nobody else sells it.
  "secure-mind-1": { shikhar: { basis: "indicative" } },
};

// Erection All Risk is written off the same engineering rate as Contractors'
// All Risk, by the same insurers.
INSURER_PRODUCTS["erection-ar-1"] = INSURER_PRODUCTS["contractors-ar-1"];

// Where a product's own rate table came from, when it came from anywhere real.
// A product missing from this map is priced entirely off invented placeholder
// figures, and every screen that shows its premium says so.
export const RATE_TABLE_SOURCE = {
  "motor-1": "NIA Motor Insurance Tariff Directive 2073, Annex 7",
  "private-car-1": "NIA Motor Insurance Tariff Directive 2073, Annex 8",
  "travel-1": "Oriental Insurance — Overseas Mediclaim rate filing, 2024",
  "schengen-1": "Oriental Insurance — Schengen Euro Plan rating, 2025",
  "pa-1": "Accident Insurance Directive 2078, Sec. 16",
  "pa-individual-1": "Accident Insurance Directive 2078, Sec. 15",
  "marine-1": "Marine Insurance Rate Directive 2065, Annex-6",
  "property-1": "Property Insurance Directive 2080, Annex-16",
};
