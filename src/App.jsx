import { useState, useEffect } from "react";
import { Car, HeartPulse, Plane, ShieldCheck, Home, ChevronRight, Check, ArrowLeft, Ship, PlaneTakeoff, Briefcase } from "lucide-react";
import { jsPDF } from "jspdf";

const colors = {
  ink: "#1c2b28",
  paper: "#f6f3ea",
  slate: "#4b5a56",
  moss: "#2f5d4f",
  mossDeep: "#16302a",
  line: "#ddd6c4",
  card: "#ffffff",
};

// #rrggbb -> [r, g, b] ints, for jsPDF's setTextColor/setDrawColor (which take
// 0-255 components, not hex) — keeps the PDF's palette in sync with `colors`.
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const CATEGORIES = [
  { slug: "motor", label: "Motor", Icon: Car },
  { slug: "health", label: "Health", Icon: HeartPulse },
  { slug: "travel", label: "Travel", Icon: Plane },
  { slug: "personal_accident", label: "Accident", Icon: ShieldCheck },
  { slug: "property", label: "Property", Icon: Home },
  { slug: "marine", label: "Marine", Icon: Ship },
  { slug: "aviation", label: "Aviation", Icon: PlaneTakeoff },
  { slug: "business", label: "Business", Icon: Briefcase },
];

// Product TYPES — not tied to a single insurer. Selecting one shows a
// choice of insurers who offer that type, matching a real comparison flow.
const PRODUCTS = [
  {
    id: "motor-1",
    category: "motor",
    name: "Motorcycle insurance — comprehensive",
    rateStructureType: "formula",
    fields: [
      { key: "sum_insured", label: "Declared value (Rs.)", type: "number" },
      { key: "cubic_capacity_cc", label: "Cubic capacity (cc)", type: "number" },
      { key: "vehicle_age_band", label: "Vehicle age", type: "enum", options: [
        { value: "under5", label: "Under 5 years" }, { value: "5to10", label: "5–10 years" }, { value: "over10", label: "Over 10 years" },
      ]},
      { key: "no_claim_discount", label: "No-claim discount (insurer-specific)", type: "enum", options: [
        { value: "0yr_0pct", label: "0 yrs (0%)" }, { value: "1yr_15pct", label: "1 yr (15%)" },
        { value: "2yr_25pct", label: "2 yrs (25%)" }, { value: "3yr+_35pct", label: "3+ yrs (35%)" },
      ]},
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 300000, cubic_capacity_cc: 150, vehicle_age_band: "under5", no_claim_discount: "1yr_15pct", direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "vehicle_bluebook", label: "Vehicle bluebook" }],
  },
  {
    id: "private-car-1",
    category: "motor",
    name: "Private vehicle insurance — comprehensive",
    rateStructureType: "formula_tiered_value",
    fields: [
      { key: "sum_insured", label: "Declared value (Rs.)", type: "number" },
      { key: "vehicle_age_band", label: "Vehicle age", type: "enum", options: [
        { value: "under10", label: "10 years or less" }, { value: "over10", label: "Over 10 years" },
      ]},
      { key: "no_claim_discount", label: "No-claim discount (insurer-specific)", type: "enum", options: [
        { value: "0yr_0pct", label: "0 yrs (0%)" }, { value: "1yr_15pct", label: "1 yr (15%)" },
        { value: "2yr_25pct", label: "2 yrs (25%)" }, { value: "3yr+_35pct", label: "3+ yrs (35%)" },
      ]},
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 1500000, vehicle_age_band: "under10", no_claim_discount: "1yr_15pct", direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "vehicle_bluebook", label: "Vehicle bluebook" }],
  },
  {
    id: "health-1",
    category: "health",
    name: "Health insurance — individual",
    rateStructureType: "lookup_matrix",
    fields: [
      // Sum-insured bands and plan tiers are real, from Oriental Insurance's
      // "Youth Eco Care" policy wording — the actual premium for each
      // combination is still a placeholder; that document has no rate table.
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "enum", options: [
        { value: "300000", label: "3 lakh" }, { value: "500000", label: "5 lakh" }, { value: "700000", label: "7 lakh" },
        { value: "1000000", label: "10 lakh" }, { value: "1500000", label: "15 lakh" }, { value: "2000000", label: "20 lakh" },
      ]},
      { key: "plan_tier", label: "Plan", type: "enum", options: [
        { value: "basic", label: "Basic" }, { value: "premium", label: "Premium (+ maternity, daily cash allowance)" },
      ]},
      { key: "age_band", label: "Age band", type: "enum", options: [
        { value: "18-25", label: "18–25 yrs" }, { value: "26-35", label: "26–35 yrs" },
        { value: "36-45", label: "36–45 yrs" },
      ]},
    ],
    defaults: { sum_insured: "500000", plan_tier: "basic", age_band: "26-35" },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "travel-1",
    category: "travel",
    name: "Travel medical insurance",
    rateStructureType: "usd_base",
    fields: [
      { key: "plan", label: "Plan / area", type: "enum", options: [
        { value: "saarc", label: "SAARC countries" }, { value: "asian", label: "Asian, incl. SAARC" },
        { value: "worldwide_ex_us", label: "Worldwide, excl. US/Canada (Plan A)" }, { value: "worldwide_incl_us", label: "Worldwide, incl. US/Canada (Plan B)" },
      ]},
      // SAARC has only one combined table (no medical/package split) — this
      // field is hidden for that plan and ignored by the rate lookup.
      { key: "cover_type", label: "Cover type", type: "enum", options: [
        { value: "medical_only", label: "Medical only" },
        { value: "package", label: "Package (all sections)" },
      ]},
      { key: "age_band", label: "Age band", type: "enum", options: [
        { value: "5-40", label: "5–40 years" },
        { value: "41-60", label: "41–60 years" },
        { value: "61-70", label: "61–70 years" },
        { value: "71-79", label: "71–79 years (2× the 61–70 rate, clean medical exam required)" },
        { value: "80-84", label: "80–84 years (3× the 61–70 rate, clean medical exam required)" },
      ]},
      { key: "days", label: "Trip length (days, up to 365)", type: "number" },
      { key: "usd_rate", label: "USD to NPR rate (NRB sell rate, live)", type: "number" },
    ],
    defaults: { plan: "asian", cover_type: "package", age_band: "5-40", days: 10, usd_rate: 138 },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "passport", label: "Passport copy" }],
  },
  {
    id: "schengen-1",
    category: "travel",
    coverageKey: "schengen_travel",
    name: "Schengen Travel Insurance (Euro Plan)",
    rateStructureType: "eur_base",
    fields: [
      { key: "age_band", label: "Age band", type: "enum", options: [
        { value: "5-40", label: "5–40 years" },
        { value: "41-60", label: "41–60 years" },
        { value: "61-70", label: "61–70 years" },
      ]},
      { key: "days", label: "Trip length (days, up to 180)", type: "number" },
      { key: "fx_rate", label: "EUR to NPR rate (NRB sell rate, live)", type: "number" },
    ],
    defaults: { age_band: "5-40", days: 10, fx_rate: 150 },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "passport", label: "Passport copy" }],
  },
  {
    id: "pa-1",
    category: "personal_accident",
    name: "Group personal accident insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured_per_person", label: "Sum insured per person (Rs.)", type: "number" },
      { key: "number_of_persons", label: "Number of persons", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured_per_person: 500000, number_of_persons: 1, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "property-1",
    category: "property",
    name: "Home insurance",
    rateStructureType: "property_tiered",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business (no agent — only discount NIA allows here)", type: "boolean" },
    ],
    defaults: { sum_insured: 2000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "property_documents", label: "Property ownership documents" }],
  },
  {
    id: "shikhar-swasthya-1",
    category: "health",
    name: "Shikhar Swasthya Surakshya",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 500000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "group-medical-1",
    category: "health",
    name: "Group Medical Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured_per_person", label: "Sum insured per person (Rs.)", type: "number" },
      { key: "number_of_persons", label: "Number of persons", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured_per_person: 300000, number_of_persons: 10, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "auto-plus-1",
    category: "motor",
    name: "Auto Plus Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Additional cover amount (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 200000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "vehicle_bluebook", label: "Vehicle bluebook" }],
  },
  {
    id: "trekkers-1",
    category: "travel",
    name: "Trekker's Assistance Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 500000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "pa-individual-1",
    category: "personal_accident",
    name: "Personal Accident Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 500000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "property-commercial-1",
    category: "property",
    name: "Property Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 5000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }, { key: "property_documents", label: "Property ownership documents" }],
  },
  {
    id: "marine-1",
    category: "marine",
    name: "Marine Transit Insurance",
    rateStructureType: "marine_cargo",
    fields: [
      { key: "invoice_currency", label: "Invoice currency", type: "enum", options: [
        { value: "NPR", label: "NPR" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
        { value: "INR", label: "INR" }, { value: "GBP", label: "GBP" }, { value: "CNY", label: "CNY" },
      ]},
      { key: "fx_rate", label: "Exchange rate (NRB sell rate, live)", type: "number" },
      { key: "sum_insured", label: "Invoice value", type: "number" },
      { key: "cargo_category", label: "Cargo category", type: "enum", options: [
        { value: "automobiles", label: "Automobiles" },
        { value: "bagged_cargo_jute", label: "Bagged cargo — new jute/gunny bags" },
        { value: "betelnuts", label: "Betelnuts" },
        { value: "beverages_glass", label: "Beverages/mineral water — glass bottles" },
        { value: "cables_wires", label: "Cables and wires" },
        { value: "cement", label: "Cement" },
        { value: "chemicals_non_hazardous", label: "Chemicals — non-hazardous" },
        { value: "chemicals_hazardous", label: "Chemicals — hazardous" },
        { value: "coal", label: "Coal" },
        { value: "cotton_yarn", label: "Cotton, yarn, thread" },
        { value: "edible_oil_bulk", label: "Edible oil/ghee — in bulk" },
        { value: "electric_electronic", label: "Electric & electronic items" },
        { value: "fragile_articles", label: "Fragile articles (china, glassware)" },
        { value: "footwear", label: "Footwear" },
        { value: "furniture_wooden", label: "Furniture — wooden" },
        { value: "gold_silver", label: "Gold, silver & precious stones" },
        { value: "machinery_power_tools", label: "Machinery — power tools" },
        { value: "metal_billets", label: "Metal — billets/ingots" },
        { value: "matches_explosives", label: "Matches, fireworks, explosives" },
      ]},
      { key: "risk_tier", label: "Cover type", type: "enum", options: [
        { value: "all_risk", label: "All Risk" }, { value: "basic_risk", label: "Basic Risk" }, { value: "minimum_risk", label: "Minimum Risk" },
      ]},
      { key: "transit_mode", label: "Transit mode", type: "enum", options: [
        { value: "sea", label: "Sea (no discount)" }, { value: "air", label: "Air (20% discount)" },
        { value: "inland_limited", label: "Inland, limited distance (30% discount)" },
        { value: "inland_nepal", label: "Inland within Nepal (25% discount)" },
        { value: "inland_other", label: "Other inland (20% discount)" },
      ]},
      { key: "pan_number", label: "PAN number", type: "text" },
      { key: "business_address", label: "Business address", type: "text" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 1000000, invoice_currency: "NPR", fx_rate: 1, cargo_category: "electric_electronic", risk_tier: "basic_risk", transit_mode: "sea", pan_number: "", business_address: "", direct_business: false },
    docsRequired: [{ key: "proforma_invoice", label: "Proforma invoice" }, { key: "pan_certificate", label: "PAN certificate" }],
  },
  {
    id: "aviation-1",
    category: "aviation",
    name: "Aviation Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Aircraft value (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 50000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "contractors-ar-1",
    category: "business",
    name: "Contractors' All Risk Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Contract value (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 10000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "erection-ar-1",
    category: "business",
    name: "Erection All Risk Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Plant & machinery value (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 10000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "cash-1",
    category: "business",
    name: "Cash Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Cash sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 500000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "bankers-indemnity-1",
    category: "business",
    name: "Banker's Indemnity Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 20000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "fidelity-1",
    category: "business",
    name: "Fidelity Guarantee Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 1000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "public-liability-1",
    category: "business",
    name: "Public Liability Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Liability limit (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 5000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
  {
    id: "secure-mind-1",
    category: "business",
    name: "Secure Mind Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Outstanding loan amount (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 2000000, direct_business: false },
    docsRequired: [{ key: "citizenship", label: "Citizenship document" }],
  },
];

// All 14 non-life insurers currently licensed by the Nepal Insurance
// Authority (as of May 2026). `claimRatio` is each insurer's published claim
// settlement ratio — a real, insurer-specific number, and the axis on which
// these companies most clearly and verifiably differ.
//
// There is deliberately no per-insurer pricing "factor" here any more. On
// Nepal's tariffed non-life lines (motor, fire/property, accident, marine)
// the Authority sets the rate and every insurer quotes it, so a multiplier
// that made one insurer permanently 7% dearer than another was inventing a
// difference that does not exist in the market. Where an insurer genuinely
// publishes its own rate for a line, that rate lives in INSURER_PRODUCTS.
//
// `code` is the short prefix at the front of a policy number issued by that
// insurer, so a policy bought from Oriental is not numbered as if Shikhar
// had issued it. Plain abbreviations for the prototype, not official Nepal
// Insurance Authority registry codes.
//
// Claim ratios: BFIS Compare's non-life listings, read 18 Sep 2026
// (https://bfis.nepsetrading.com/en/insurance/non-life). Rastriya Beema and
// National Insurance publish none there, hence null.
const INSURERS = [
  { id: "nepal-insurance", name: "Nepal Insurance Company", code: "NICL", claimRatio: 74 },
  { id: "oriental", name: "The Oriental Insurance Company", code: "OICN", claimRatio: 80.02 },
  { id: "national", name: "National Insurance Company", code: "NATL", claimRatio: null },
  { id: "himalayan-everest", name: "Himalayan Everest Insurance", code: "HEIL", claimRatio: 98.31 },
  { id: "united-ajod", name: "United Ajod Insurance", code: "UAIL", claimRatio: 65.87 },
  { id: "neco", name: "Neco Insurance", code: "NECO", claimRatio: 70 },
  { id: "sagarmatha", name: "Sagarmatha Lumbini Insurance", code: "SLIC", claimRatio: 78.14 },
  { id: "prabhu", name: "Prabhu Insurance", code: "PRIN", claimRatio: 85.84 },
  { id: "igi-prudential", name: "IGI Prudential Insurance", code: "IGIP", claimRatio: 62 },
  { id: "shikhar", name: "Shikhar Insurance", code: "SICL", claimRatio: 94 },
  { id: "nlg", name: "NLG Insurance", code: "NLGI", claimRatio: 69 },
  { id: "siddhartha-premier", name: "Siddhartha Premier Insurance", code: "SPIL", claimRatio: 89.94 },
  { id: "rastriya-beema", name: "Rastriya Beema Company", code: "RBCL", claimRatio: null },
  { id: "sanima-gic", name: "Sanima GIC Insurance", code: "SGIC", claimRatio: 63.3 },
];

const ALL_INSURER_IDS = INSURERS.map((i) => i.id);

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
const INSURER_PRODUCTS = {
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
const RATE_TABLE_SOURCE = {
  "motor-1": "NIA Motor Insurance Tariff Directive 2073, Annex 7",
  "private-car-1": "NIA Motor Insurance Tariff Directive 2073, Annex 8",
  "travel-1": "Oriental Insurance — Overseas Mediclaim rate filing, 2024",
  "schengen-1": "Oriental Insurance — Schengen Euro Plan rating, 2025",
  "pa-1": "Accident Insurance Directive 2078, Sec. 16",
  "pa-individual-1": "Accident Insurance Directive 2078, Sec. 15",
  "marine-1": "Marine Insurance Rate Directive 2065, Annex-6",
  "property-1": "Property Insurance Directive 2080, Annex-16",
};

// The insurers who sell a product, in the order INSURERS lists them, each
// carrying the offer that says how it is rated.
function insurersFor(product) {
  const map = INSURER_PRODUCTS[product.id] || {};
  return INSURERS.filter((i) => map[i.id]).map((i) => ({ ...i, offer: map[i.id] }));
}

function offerFor(product, insurer) {
  return INSURER_PRODUCTS[product.id]?.[insurer.id] || null;
}

// A premium is indicative unless the product has a real rate table AND this
// insurer either prices at that tariff or publishes its own rate.
function isIndicative(product, offer) {
  if (!offer) return true;
  if (offer.basis === "indicative") return true;
  return !RATE_TABLE_SOURCE[product.id] && offer.basis !== "published";
}

const BASIS_LABEL = {
  published: "Insurer's own listed rate",
  tariff: "Authority tariff rate",
  indicative: "Indicative — rate on request",
};

// ---- Placeholder rate tables, one shape per rate_structure_type ----
const RATE_TABLES = {
  // Motorcycle, non-government — NIA Motor Insurance Tariff Directive 2073, Annex 7.
  // Base rate is flat regardless of CC; CC only affects the fixed third-party fee.
  // Age surcharge and direct-business discount are the actual mandated figures;
  // no-claim discount is NOT in this document — it's modeled as an insurer-specific
  // discretionary discount, which is realistic but not itself a regulated number.
  "motor-1": {
    base_rate_pct: 1.5,
    age_surcharge_pct: { under5: 0, "5to10": 15, over10: 25 },
    min_own_damage_premium: 1000,
    third_party_flat_by_cc: [{ max_cc: 150, amount: 1500 }, { max_cc: 250, amount: 1700 }, { max_cc: 999999, amount: 1900 }],
    ncd_discount_pct: { "0yr_0pct": 0, "1yr_15pct": 15, "2yr_25pct": 25, "3yr+_35pct": 35 },
    direct_business_discount_pct: 10, // real figure — corrected from an earlier guess of 2.5%
    stamp_duty_flat: 100, // still a placeholder — not found in the extracted tariff pages
  },
  // Private vehicle (car), non-government — NIA Motor Insurance Tariff Directive
  // 2073, Annex 8. Real figures: three declared-value bands, each with a
  // two-tier rate (first Rs 20 lakh vs. the remainder) and its own fixed TP fee.
  "private-car-1": {
    value_bands: [
      { max_value: 1000000, first20L_rate: 0.84, remainder_rate: 1.12, tp: 3000 },
      { max_value: 1600000, first20L_rate: 0.87, remainder_rate: 1.12, tp: 4000 },
      { max_value: Infinity, first20L_rate: 0.90, remainder_rate: 1.12, tp: 6000 },
    ],
    age_surcharge_pct_over10: 10,
    min_own_damage_premium: 2000,
    ncd_discount_pct: { "0yr_0pct": 0, "1yr_15pct": 15, "2yr_25pct": 25, "3yr+_35pct": 35 },
    direct_business_discount_pct: 10,
    stamp_duty_flat: 100, // still a placeholder — not found in the extracted tariff pages
  },
  // SI bands match Oriental Insurance's real "Youth Eco Care" bands; the
  // premium figures inside are still invented placeholders — no rate table
  // was found in that policy document, only the bands and plan structure.
  "health-1": {
    individual: {
      "300000": { basic: { "18-25": 4200, "26-35": 5000, "36-45": 6600 }, premium: { "18-25": 5400, "26-35": 6400, "36-45": 8300 } },
      "500000": { basic: { "18-25": 6500, "26-35": 7700, "36-45": 10200 }, premium: { "18-25": 8200, "26-35": 9700, "36-45": 12700 } },
      "700000": { basic: { "18-25": 8600, "26-35": 10100, "36-45": 13400 }, premium: { "18-25": 10800, "26-35": 12700, "36-45": 16700 } },
      "1000000": { basic: { "18-25": 11800, "26-35": 14000, "36-45": 18500 }, premium: { "18-25": 14800, "26-35": 17500, "36-45": 23000 } },
      "1500000": { basic: { "18-25": 16500, "26-35": 19500, "36-45": 25800 }, premium: { "18-25": 20600, "26-35": 24300, "36-45": 32100 } },
      "2000000": { basic: { "18-25": 21000, "26-35": 24800, "36-45": 32700 }, premium: { "18-25": 26200, "26-35": 30900, "36-45": 40700 } },
    },
    stamp_duty_flat: 40,
  },
  // Travel medical insurance — The Oriental Insurance Co. Ltd, "Overseas
  // Mediclaim Insurance", U/Y 2024 rate filing @ 16 Jul 2024. Real day-band x
  // age-band USD tables (previously an invented flat placeholder that ignored
  // both trip length and age entirely).
  "travel-1": {
    day_bands: [
      { max_days: 7, key: "1-7" }, { max_days: 14, key: "8-14" }, { max_days: 21, key: "15-21" },
      { max_days: 28, key: "22-28" }, { max_days: 35, key: "29-35" }, { max_days: 47, key: "36-47" },
      { max_days: 60, key: "48-60" }, { max_days: 75, key: "61-75" }, { max_days: 90, key: "76-90" },
      { max_days: 120, key: "91-120" }, { max_days: 147, key: "121-147" }, { max_days: 180, key: "148-180" },
    ],
    plans: {
      // SAARC Countries Plan — single table, no medical-only/package split.
      saarc: {
        single: {
          "5-40": { "1-7": 11, "8-14": 14, "15-21": 15, "22-28": 16, "29-35": 19, "36-47": 21, "48-60": 23, "61-75": 28, "76-90": 32, "91-120": 51, "121-147": 62, "148-180": 76 },
          "41-60": { "1-7": 13, "8-14": 15, "15-21": 16, "22-28": 17, "29-35": 21, "36-47": 23, "48-60": 25, "61-75": 31, "76-90": 35, "91-120": 56, "121-147": 67, "148-180": 83 },
          "61-70": { "1-7": 17, "8-14": 21, "15-21": 22, "22-28": 24, "29-35": 28, "36-47": 32, "48-60": 36, "61-75": 44, "76-90": 51, "91-120": 82, "121-147": 97, "148-180": 124 },
        },
      },
      // Asian Countries Plan (including SAARC countries) — source table's own
      // top age band is labeled "61-69", kept as the "61-70" bucket here for
      // consistency with the other three plans; figures are unchanged.
      asian: {
        medical_only: {
          "5-40": { "1-7": 16, "8-14": 20, "15-21": 21, "22-28": 22, "29-35": 26, "36-47": 29, "48-60": 33, "61-75": 38, "76-90": 45, "91-120": 71, "121-147": 85, "148-180": 104 },
          "41-60": { "1-7": 18, "8-14": 21, "15-21": 22, "22-28": 24, "29-35": 28, "36-47": 30, "48-60": 35, "61-75": 42, "76-90": 48, "91-120": 78, "121-147": 93, "148-180": 114 },
          "61-70": { "1-7": 23, "8-14": 28, "15-21": 30, "22-28": 33, "29-35": 38, "36-47": 43, "48-60": 49, "61-75": 61, "76-90": 70, "91-120": 115, "121-147": 137, "148-180": 200 },
        },
        package: {
          "5-40": { "1-7": 18, "8-14": 22, "15-21": 23, "22-28": 25, "29-35": 30, "36-47": 33, "48-60": 38, "61-75": 45, "76-90": 52, "91-120": 85, "121-147": 102, "148-180": 125 },
          "41-60": { "1-7": 20, "8-14": 23, "15-21": 25, "22-28": 26, "29-35": 31, "36-47": 35, "48-60": 41, "61-75": 49, "76-90": 57, "91-120": 94, "121-147": 111, "148-180": 138 },
          "61-70": { "1-7": 28, "8-14": 32, "15-21": 34, "22-28": 38, "29-35": 43, "36-47": 50, "48-60": 58, "61-75": 71, "76-90": 84, "91-120": 138, "121-147": 165, "148-180": 206 },
        },
      },
      // Standard Plan "A" — worldwide excluding USA & Canada.
      worldwide_ex_us: {
        medical_only: {
          "5-40": { "1-7": 25, "8-14": 32, "15-21": 33, "22-28": 35, "29-35": 41, "36-47": 46, "48-60": 50, "61-75": 61, "76-90": 70, "91-120": 113, "121-147": 137, "148-180": 168 },
          "41-60": { "1-7": 30, "8-14": 34, "15-21": 35, "22-28": 38, "29-35": 45, "36-47": 49, "48-60": 56, "61-75": 67, "76-90": 78, "91-120": 123, "121-147": 150, "148-180": 183 },
          "61-70": { "1-7": 38, "8-14": 45, "15-21": 47, "22-28": 53, "29-35": 62, "36-47": 70, "48-60": 79, "61-75": 98, "76-90": 114, "91-120": 182, "121-147": 216, "148-180": 275 },
        },
        package: {
          "5-40": { "1-7": 28, "8-14": 35, "15-21": 36, "22-28": 39, "29-35": 47, "36-47": 52, "48-60": 60, "61-75": 73, "76-90": 85, "91-120": 140, "121-147": 167, "148-180": 208 },
          "41-60": { "1-7": 32, "8-14": 37, "15-21": 39, "22-28": 43, "29-35": 51, "36-47": 57, "48-60": 66, "61-75": 80, "76-90": 95, "91-120": 147, "121-147": 175, "148-180": 220 },
          "61-70": { "1-7": 44, "8-14": 52, "15-21": 54, "22-28": 61, "29-35": 70, "36-47": 81, "48-60": 93, "61-75": 113, "76-90": 132, "91-120": 219, "121-147": 268, "148-180": 325 },
        },
      },
      // Standard Plan "B" — worldwide including USA & Canada.
      worldwide_incl_us: {
        medical_only: {
          "5-40": { "1-7": 40, "8-14": 55, "15-21": 58.3, "22-28": 63.8, "29-35": 74.8, "36-47": 86.9, "48-60": 119.9, "61-75": 168.3, "76-90": 200.2, "91-120": 277.2, "121-147": 364.1, "148-180": 524.7 },
          "41-60": { "1-7": 55, "8-14": 73.7, "15-21": 78.1, "22-28": 88, "29-35": 100.1, "36-47": 119.9, "48-60": 172.7, "61-75": 245.3, "76-90": 292.6, "91-120": 409.2, "121-147": 541.2, "148-180": 622.6 },
          "61-70": { "1-7": 72, "8-14": 80.3, "15-21": 84.7, "22-28": 95.7, "29-35": 112.2, "36-47": 135.3, "48-60": 192.5, "61-75": 273.9, "76-90": 327.8, "91-120": 459.8, "121-147": 609.4, "148-180": 722.7 },
        },
        package: {
          "5-40": { "1-7": 50, "8-14": 62.7, "15-21": 66, "22-28": 73.7, "29-35": 86.9, "36-47": 101.2, "48-60": 143, "61-75": 202.4, "76-90": 242, "91-120": 336.6, "121-147": 444.4, "148-180": 641.3 },
          "41-60": { "1-7": 68, "8-14": 85.8, "15-21": 90.2, "22-28": 103.4, "29-35": 121, "36-47": 145.2, "48-60": 209, "61-75": 297, "76-90": 355.3, "91-120": 499.4, "121-147": 662.2, "148-180": 788.7 },
          "61-70": { "1-7": 80, "8-14": 94.6, "15-21": 100.1, "22-28": 113.3, "29-35": 134.2, "36-47": 161.7, "48-60": 232.1, "61-75": 333.3, "76-90": 399.3, "91-120": 561, "121-147": 745.8, "148-180": 885.5 },
        },
      },
    },
    // Rating note 4: ages 71-79 and 80-84 are priced as a multiple of the
    // 61-70 band rate (subject to a clean medical exam); 85+ is by request
    // only and isn't modeled here.
    age_loading_multiplier: { "71-79": 2, "80-84": 3 },
    // Rating note 5: trips of 181-365 days are the 180-day rate plus the
    // rate applicable to the days beyond 180 — handled in calc() by re-running
    // the day-band lookup on the excess days.
    // Rating note 2 (family = 2.5x single premium, with free/discounted child
    // rates) and note 3 are NOT modeled — this product only prices a single
    // traveler today.
    stamp_duty_flat: 50, // no stamp duty figure in the source filing — carried over from the prior placeholder
  },
  // Schengen Travel Insurance (Euro Plan) — The Oriental Insurance Co. Ltd,
  // "Schengen - Euro Plan Benefits and Rating 2025". Same day-band structure
  // as travel-1, EUR-denominated, single combined table (no medical/package
  // split), and only three age bands in the source sheet — no 71-79/80-84
  // loading is stated for this specific plan.
  "schengen-1": {
    day_bands: [
      { max_days: 7, key: "1-7" }, { max_days: 14, key: "8-14" }, { max_days: 21, key: "15-21" },
      { max_days: 28, key: "22-28" }, { max_days: 35, key: "29-35" }, { max_days: 47, key: "36-47" },
      { max_days: 60, key: "48-60" }, { max_days: 75, key: "61-75" }, { max_days: 90, key: "76-90" },
      { max_days: 120, key: "91-120" }, { max_days: 147, key: "121-147" }, { max_days: 180, key: "148-180" },
    ],
    age_bands: {
      "5-40": { "1-7": 16.48, "8-14": 20.6, "15-21": 21.63, "22-28": 22.66, "29-35": 26.78, "36-47": 29.87, "48-60": 33.99, "61-75": 39.14, "76-90": 46.35, "91-120": 73.13, "121-147": 87.55, "148-180": 107.12 },
      "41-60": { "1-7": 18.54, "8-14": 21.63, "15-21": 22.66, "22-28": 24.72, "29-35": 28.84, "36-47": 30.9, "48-60": 36.05, "61-75": 43.26, "76-90": 49.44, "91-120": 80.34, "121-147": 95.79, "148-180": 117.42 },
      "61-70": { "1-7": 23.69, "8-14": 28.84, "15-21": 30.9, "22-28": 33.99, "29-35": 39.14, "36-47": 44.29, "48-60": 50.47, "61-75": 62.83, "76-90": 72.1, "91-120": 118.45, "121-147": 141.11, "148-180": 206 },
    },
    stamp_duty_flat: 50, // no stamp duty figure in the source documents — carried over from travel-1's placeholder
  },
  // Group Personal Accident Insurance — Accident Insurance Directive 2078
  // (दुर्घटना बीमा निर्देशिका, २०७८), Beema Samiti, effective 2078.08.01 (17 Nov 2021).
  // Section 16(1): minimum per-mille rate tiered by group size (rate applies
  // per person, on that person's own sum insured).
  "pa-1": {
    group_tiers: [
      { max_persons: 25, rate_per_mille: 2.0 }, // (क) 2–25 persons: Rs 2 per Rs 1,000
      { max_persons: 100, rate_per_mille: 1.75 }, // (ख) 26–100 persons: Rs 1.75 per Rs 1,000
      { max_persons: Infinity, rate_per_mille: 1.5 }, // (ग) 101+ persons: Rs 1.50 per Rs 1,000
    ],
    // Section 20(2): riot/strike/malicious-damage/terrorism (RSMDST) risk group
    // rate is a flat 15 paisa per Rs 1,000 sum insured per person, across all products.
    rsmdst_rate_per_mille: 0.15,
    // Section 15(2) proviso: direct (no-agent) sales may discount up to 5%,
    // explicitly excluding the RSMDST premium — modeled below by applying the
    // discount only to the normal-rate portion, not rsmdst_rate_per_mille.
    direct_business_discount_pct: 5,
    min_rate_per_mille: 1.5, // Section 16(1): the lowest tier is itself a floor
    min_premium_flat: 100, // Section 17(1): no policy may charge less than Rs 100 total premium
    stamp_duty_flat: 20, // still unverified against this directive — kept as prior placeholder
    apply_vat: false,
  },

  // Everything below is an invented placeholder rate — none of these came from
  // a real tariff document or insurer filing. They exist so the product is
  // browsable and quotable in the app, not because the numbers mean anything.
  "shikhar-swasthya-1": { normal_rate_per_mille: 12, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 5, stamp_duty_flat: 40, apply_vat: false },
  "group-medical-1": { normal_rate_per_mille: 10, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 5, stamp_duty_flat: 40, apply_vat: false },
  "auto-plus-1": { normal_rate_per_mille: 8, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 10, stamp_duty_flat: 50, apply_vat: true },
  "trekkers-1": { normal_rate_per_mille: 6, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 5, stamp_duty_flat: 50, apply_vat: true },
  // Personal Accident Insurance (individual) — same Directive 2078, Section 15(1):
  // minimum premium Rs 2 per Rs 1,000 sum insured (flat — not group-size tiered,
  // since Section 16's tiers only govern the group product). Section 15(3) also
  // bars increasing/decreasing the sum insured mid-term on an individual policy.
  "pa-individual-1": {
    normal_rate_per_mille: 2.0,
    min_rate_per_mille: 2.0, // Section 15(1): Rs 2 per 1,000 is a statutory minimum, not a guide
    rsmdst_rate_per_mille: 0.15, // Section 20(2), same as pa-1
    direct_business_discount_pct: 5, // Section 15(2) proviso
    min_premium_flat: 100, // Section 17(1)
    stamp_duty_flat: 20,
    apply_vat: false,
  },
  "property-commercial-1": { normal_rate_per_mille: 2.0, rsmdst_rate_per_mille: 0.3, direct_business_discount_pct: 5, stamp_duty_flat: 100, apply_vat: true },
  // Marine Transit Insurance — Marine Insurance Rate Directive 2065 (B.S.),
  // Annex-6: "Minimum Insurance Premium Rate for Marine Insurance" (per hundred
  // sum insured — i.e. a %, not a per-mille). Titled a MINIMUM rate, so the
  // this is a floor every insurer shares. This directive predates the current
  // Insurance Act 2079/2081
  // — treat as a structural reference, not a confirmed current rate.
  "marine-1": {
    category_rates: {
      automobiles: { all_risk: 0.26, basic_risk: 0.14, minimum_risk: 0.06 },
      bagged_cargo_jute: { all_risk: 0.25, basic_risk: 0.15, minimum_risk: 0.06 },
      betelnuts: { all_risk: 0.5, basic_risk: 0.3, minimum_risk: 0.12 },
      beverages_glass: { all_risk: 0.4, basic_risk: 0.25, minimum_risk: 0.1 },
      cables_wires: { all_risk: 0.15, basic_risk: 0.1, minimum_risk: 0.04 },
      cement: { all_risk: 0.5, basic_risk: 0.15, minimum_risk: 0.06 },
      chemicals_non_hazardous: { all_risk: 0.3, basic_risk: 0.18, minimum_risk: 0.07 },
      chemicals_hazardous: { all_risk: 0.4, basic_risk: 0.25, minimum_risk: 0.1 },
      coal: { all_risk: 0.5, basic_risk: 0.4, minimum_risk: 0.3 },
      cotton_yarn: { all_risk: 0.1, basic_risk: 0.08, minimum_risk: 0.04 },
      edible_oil_bulk: { all_risk: 0.35, basic_risk: 0.2, minimum_risk: 0.08 },
      electric_electronic: { all_risk: 0.3, basic_risk: 0.2, minimum_risk: 0.08 },
      fragile_articles: { all_risk: 0.8, basic_risk: 0.5, minimum_risk: 0.2 },
      footwear: { all_risk: 0.2, basic_risk: 0.12, minimum_risk: 0.05 },
      furniture_wooden: { all_risk: 0.7, basic_risk: 0.4, minimum_risk: 0.2 },
      gold_silver: { all_risk: 0.5, basic_risk: 0.3, minimum_risk: 0.12 },
      machinery_power_tools: { all_risk: 0.3, basic_risk: 0.2, minimum_risk: 0.08 },
      metal_billets: { all_risk: 0.06, basic_risk: 0.04, minimum_risk: 0.02 },
      matches_explosives: { all_risk: 0.9, basic_risk: 0.55, minimum_risk: 0.25 },
    },
    transit_discount_pct: { sea: 0, air: 20, inland_limited: 30, inland_nepal: 25, inland_other: 20 },
    // Set to 2.5% per explicit instruction — the 2065 directive text itself
    // states 10% ("Direct business discount (10% of L)"). This 2.5% figure
    // is not from that document; it overrides the previously-verified number.
    direct_business_discount_pct: 2.5,
    apply_vat: true,
    stamp_duty_flat: 20,
  },
  "aviation-1": { normal_rate_per_mille: 5.0, rsmdst_rate_per_mille: 0.6, direct_business_discount_pct: 10, stamp_duty_flat: 100, apply_vat: true },
  "contractors-ar-1": { normal_rate_per_mille: 4.0, rsmdst_rate_per_mille: 0.4, direct_business_discount_pct: 10, stamp_duty_flat: 100, apply_vat: true },
  "erection-ar-1": { normal_rate_per_mille: 4.0, rsmdst_rate_per_mille: 0.4, direct_business_discount_pct: 10, stamp_duty_flat: 100, apply_vat: true },
  "cash-1": { normal_rate_per_mille: 3.0, rsmdst_rate_per_mille: 0.3, direct_business_discount_pct: 10, stamp_duty_flat: 50, apply_vat: true },
  "bankers-indemnity-1": { normal_rate_per_mille: 2.5, rsmdst_rate_per_mille: 0.2, direct_business_discount_pct: 10, stamp_duty_flat: 100, apply_vat: true },
  "fidelity-1": { normal_rate_per_mille: 3.0, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 10, stamp_duty_flat: 50, apply_vat: true },
  "public-liability-1": { normal_rate_per_mille: 2.0, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 10, stamp_duty_flat: 50, apply_vat: true },
  "secure-mind-1": { normal_rate_per_mille: 6.0, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 5, stamp_duty_flat: 40, apply_vat: false },
  // Home insurance — Property Insurance Directive 2080, Annex-16, risk category 1
  // (residential building/home, temples, worship places, and contents).
  // The stated rate is all-inclusive of riot/strike/terrorism — no separate
  // add-on. No-claim or negotiated discounts are not permitted on this line;
  // only a direct-business (no-agent) discount of 5% is allowed, per Section 25.
  "property-1": {
    tier1_max: 10000000,
    tier1_rate_per_mille: 0.5,
    tier2_rate_per_mille: 1.5,
    direct_business_discount_pct: 5,
    apply_vat: true,
    stamp_duty_flat: 100, // still a placeholder — not found in the extracted pages
  },
};

// Claim-side benefit schedule, keyed by product category (or a product's own
// coverageKey, when more than one product in a category needs its own
// schedule) — separate from RATE_TABLES, which only prices the premium.
const COVERAGE_SCHEDULES = {
  personal_accident: {
    sourceLabel: "Accident Insurance Directive, 2078 (Beema Samiti)",
    benefits: [
      { label: "Accidental death, within 183 days of the accident", detail: "100% of sum insured", source: "Sec. 3" },
      { label: "Body transport / repatriation", detail: "Flat Rs 10,000", source: "Sec. 4" },
      { label: "Last rites (funeral) expense", detail: "10% of sum insured or Rs 50,000, whichever is lower — paid on top of the death benefit", source: "Sec. 5" },
      { label: "Temporary total disability", detail: "5% of sum insured or Rs 20,000/month, whichever is lower, for up to 6 months", source: "Sec. 8" },
      { label: "Medical treatment", detail: "Up to Rs 100,000 on top of the sum insured, against bills", source: "Sec. 9" },
    ],
    permanentTotal: {
      title: "Permanent total disability — % of sum insured",
      source: "Sec. 6",
      rows: [
        { label: "Total, irrecoverable paralysis (spinal injury)", pct: 100 },
        { label: "Loss of use of one full arm (from wrist) or one full leg (from ankle)", pct: 100 },
        { label: "Total loss of sight, both eyes", pct: 100 },
        { label: "Total loss of hearing, both ears", pct: 100 },
        { label: "Total loss of speech", pct: 100 },
        { label: "Total loss of sight, one eye", pct: 50 },
        { label: "Total loss of hearing, one ear", pct: 50 },
      ],
    },
    permanentPartial: {
      title: "Permanent partial disability — % of sum insured",
      source: "Sec. 7",
      rows: [
        { label: "Loss of use of arm below elbow, or leg below knee", pct: 50 },
        { label: "Loss of use of arm below wrist, or leg below ankle", pct: 50 },
        { label: "Loss of thumb or big toe", pct: 20 },
        { label: "Memory loss caused by the accident", pct: 20 },
        { label: "Loss of use of any other finger or toe", pct: 10 },
        { label: "Any other permanent bodily impairment", pct: "Proportionate" },
      ],
    },
    riders: {
      title: "Optional extra-premium riders",
      source: "Sec. 19",
      rows: [
        { label: "Mountaineering", detail: "+0.75% of sum insured" },
        { label: "Rally/wheel racing, horse racing, bungee jumping, paragliding, motorcycle racing, polo, hunting, scuba diving, sharp-shooting", detail: "+0.5% of sum insured" },
      ],
    },
    exclusions: {
      title: "Not covered",
      source: "Sec. 10-12",
      rows: [
        "Self-inflicted injury, suicide or attempted suicide",
        "Under the influence of alcohol or drugs",
        "Unauthorized flying, other than as a fare-paying passenger on a licensed airline",
        "Adventure sports listed above, unless separately covered with the extra premium",
        "Insanity or mental disorder",
        "War, riot, invasion, or radioactive/chemical/biological weapons",
      ],
    },
    minClaim: 2500, // Sec. 22(1) — no claim below this amount is payable under the policy
  },
  schengen_travel: {
    sourceLabel: "Overseas Mediclaim Insurance Policy — The Oriental Insurance Co. Ltd (Schengen Euro Plan)",
    benefits: [
      { label: "A — Personal accident (death / loss of limb / loss of sight / permanent total disablement)", detail: "Max EUR 10,000 · Nil excess", source: "Sched." },
      { label: "B — Emergency medical, evacuation & air ambulance", detail: "Max EUR 30,000 · EUR 100 excess", source: "Sched." },
      { label: "B — Emergency dental care (pain relief only)", detail: "Max EUR 50 · Nil excess", source: "Sched." },
      { label: "B — Repatriation of mortal remains", detail: "Covered · EUR 100 excess", source: "Sched." },
      { label: "C — Hospital cash benefit", detail: "EUR 10 per 24 hrs, up to EUR 100 (min. 24 hrs hospitalised)", source: "Sched." },
      { label: "D — Loss of passport", detail: "Max EUR 100 · Nil excess", source: "Sched." },
      { label: "E — Personal liability", detail: "Max EUR 15,000 · EUR 250 excess (property damage only)", source: "Sched." },
      { label: "F — Travel delay (air only)", detail: "EUR 10/hour up to EUR 50 · first 12 hrs is the excess", source: "Sched." },
      { label: "G — Hijack", detail: "EUR 50/day up to EUR 500, plus EUR 50 per 24-hr period of detention", source: "Sched." },
    ],
    permanentTotal: {
      title: "Section A — payout by event, % of the EUR 10,000 sum insured",
      source: "Policy wording, Table of Events",
      rows: [
        { label: "Death", pct: 100 },
        { label: "Permanent total disablement", pct: 100 },
        { label: "Loss of one or more limbs", pct: 100 },
        { label: "Loss of sight, both eyes", pct: 100 },
        { label: "Loss of sight, one eye", pct: 50 },
      ],
    },
    permanentPartial: {
      title: "Conditions on Section A",
      source: "Policy wording",
      rows: [
        { label: "Death benefit capped at USD 5,000 for insureds under 18 or over 65 — worded in USD in the source policy even though this plan's own limits are in EUR", pct: "" },
        { label: "No permanent total disablement benefit for insureds over 65", pct: "" },
        { label: "Only one loss payable per accident, even if more than one applies", pct: "" },
      ],
    },
    riders: {
      title: "Claims — what you must do",
      source: "Policy wording",
      rows: [
        { label: "Death, hospital admission, accident, or medical expenses over USD 500", detail: "Contact GLOBAL RESPONSE (24/7) before treatment — costs aren't payable without their prior approval" },
        { label: "Non-emergency claims", detail: "Notify within 31 days of returning to Nepal, with a completed claim form and all bills/receipts" },
      ],
    },
    exclusions: {
      title: "Not covered",
      source: "Policy wording",
      rows: [
        "Pre-existing medical conditions",
        "Travelling against medical advice, or to obtain treatment",
        "Adventure sports — off-piste skiing, mountaineering with ropes, hang-gliding, paragliding, bungee jumping, scuba diving, motor racing, motorcycling above 50cc — unless separately arranged",
        "Self-inflicted injury, suicide, or under the influence of alcohol/drugs",
        "War, terrorism, or radioactive/nuclear/chemical contamination",
        "Any pandemic declared by the World Health Organization",
      ],
    },
    minClaim: null,
    eligibilityNote: "The policy wording states eligibility up to age 70 at inception, yet the 2025 rate sheet separately prices ages up to 84 at a loaded multiple of an adjacent band elsewhere in this insurer's filings — an inconsistency in the source documents themselves, not something this app introduced. This plan's own rate sheet stops at age 70; ask the insurer directly for older travellers.",
  },
};

const r = (n) => Math.round(n * 100) / 100;

// Shared by travel-1 (USD) and schengen-1 (EUR): both price a trip length in
// days off the same day-band table shape. Trips over 180 days (only possible
// for travel-1 — schengen-1's UI caps at 180) use rating note 5: the 180-day
// rate plus the rate for the days beyond 180.
function dayBandPremium(dayBands, ageRow, days) {
  const lookup = (d) => {
    const band = dayBands.find((b) => d <= b.max_days) || dayBands[dayBands.length - 1];
    return ageRow[band.key];
  };
  if (days <= 180) return lookup(days);
  return ageRow["148-180"] + lookup(Math.min(days - 180, 180));
}

// `offer` is this insurer's entry from INSURER_PRODUCTS (see there for what
// each basis means). It is the only insurer-specific input to a premium: on a
// tariff line it carries no rate at all and every insurer gets the same
// number, which is what the regulation actually produces.
function calc(product, offer, v) {
  const rt = RATE_TABLES[product.id];
  // The insurer's own listed rate, when it has one. A rate listed below a
  // directive-set statutory minimum can't lawfully be sold at that price, so
  // the floor wins over the listing.
  const listedRate =
    offer && offer.basis === "published" && typeof offer.ratePerMille === "number"
      ? Math.max(offer.ratePerMille, rt.min_rate_per_mille ?? 0)
      : null;
  if (product.rateStructureType === "formula") {
    const si = Number(v.sum_insured || 0);
    const cc = Number(v.cubic_capacity_cc || 0);
    const ageSurchargePct = rt.age_surcharge_pct[v.vehicle_age_band] || 0;
    const effectiveRatePct = rt.base_rate_pct * (1 + ageSurchargePct / 100);
    const basic = Math.max(si * (effectiveRatePct / 100), rt.min_own_damage_premium);
    const ncdPct = rt.ncd_discount_pct[v.no_claim_discount] || 0;
    const ncdAmt = basic * (ncdPct / 100);
    const dbDiscount = v.direct_business ? (basic - ncdAmt) * (rt.direct_business_discount_pct / 100) : 0;
    const normal = Math.max(basic - ncdAmt - dbDiscount, rt.min_own_damage_premium);
    // Third-party liability is a NIA-mandated market-wide rate — same for every insurer.
    const tp = rt.third_party_flat_by_cc.find((t) => cc <= t.max_cc)?.amount || 0;
    const subtotal = normal + tp;
    const vat = subtotal * 0.13;
    return {
      rows: [
        { label: `Own-damage premium (${effectiveRatePct.toFixed(2)}% of declared value)`, value: r(basic) },
        { label: `No-claim discount (${ncdPct}%, insurer-specific)`, value: r(-ncdAmt) },
        ...(v.direct_business ? [{ label: "Direct business discount (10%)", value: r(-dbDiscount) }] : []),
        { label: "Third-party premium (fixed, market-wide)", value: r(tp) },
        { label: "VAT (13%)", value: r(vat) },
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(subtotal + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "formula_tiered_value") {
    const si = Number(v.sum_insured || 0);
    const band = rt.value_bands.find((b) => si <= b.max_value);
    const first20L = Math.min(si, 2000000);
    const remainder = Math.max(si - 2000000, 0);
    const rawBasic = first20L * (band.first20L_rate / 100) + remainder * (band.remainder_rate / 100);
    const ageSurcharge = v.vehicle_age_band === "over10" ? rawBasic * (rt.age_surcharge_pct_over10 / 100) : 0;
    const basic = Math.max(rawBasic + ageSurcharge, rt.min_own_damage_premium);
    const ncdPct = rt.ncd_discount_pct[v.no_claim_discount] || 0;
    const ncdAmt = basic * (ncdPct / 100);
    const dbDiscount = v.direct_business ? (basic - ncdAmt) * (rt.direct_business_discount_pct / 100) : 0;
    const normal = Math.max(basic - ncdAmt - dbDiscount, rt.min_own_damage_premium);
    // Third-party fee is tied to the declared-value band — market-wide.
    const tp = band.tp;
    const subtotal = normal + tp;
    const vat = subtotal * 0.13;
    return {
      rows: [
        { label: "Own-damage premium (tiered on declared value)", value: r(basic) },
        { label: `No-claim discount (${ncdPct}%, insurer-specific)`, value: r(-ncdAmt) },
        ...(v.direct_business ? [{ label: "Direct business discount (10%)", value: r(-dbDiscount) }] : []),
        { label: "Third-party premium (fixed, market-wide)", value: r(tp) },
        { label: "VAT (13%)", value: r(vat) },
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(subtotal + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "lookup_matrix") {
    const base = rt.individual?.[v.sum_insured]?.[v.plan_tier]?.[v.age_band] ?? 0;
    const premium = r(base);
    return { rows: [{ label: "Premium", value: premium }, { label: "Stamp duty", value: rt.stamp_duty_flat }], net: r(premium + rt.stamp_duty_flat) };
  }
  if (product.rateStructureType === "usd_base") {
    const planTable = rt.plans[v.plan];
    const table = planTable.single || planTable[v.cover_type] || planTable.package;
    const lookupBand = v.age_band === "71-79" || v.age_band === "80-84" ? "61-70" : v.age_band;
    const loading = rt.age_loading_multiplier[v.age_band] || 1;
    const usd = dayBandPremium(rt.day_bands, table[lookupBand], Number(v.days || 0)) * loading;
    const amount = usd * Number(v.usd_rate || 0);
    const vat = amount * 0.13;
    return {
      rows: [
        { label: loading > 1 ? `Premium (${r(usd)} USD × rate, incl. ${loading}× age loading)` : `Premium (${r(usd)} USD × rate)`, value: r(amount) },
        { label: "VAT (13%)", value: r(vat) },
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(amount + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "eur_base") {
    const eur = dayBandPremium(rt.day_bands, rt.age_bands[v.age_band], Number(v.days || 0));
    const amount = eur * Number(v.fx_rate || 0);
    const vat = amount * 0.13;
    return {
      rows: [
        { label: `Premium (${r(eur)} EUR × rate)`, value: r(amount) },
        { label: "VAT (13%)", value: r(vat) },
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(amount + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "property_tiered") {
    const si = Number(v.sum_insured || 0);
    const tier1 = Math.min(si, rt.tier1_max);
    const tier2 = Math.max(si - rt.tier1_max, 0);
    // The directive sets Rs 0.5 per 1,000 for standard residential risk, and
    // insurers do list their own householder rates around it (Rs 0.5 to Rs
    // 0.75), so an insurer's listed rate replaces the first tier where it has
    // one. The upper tier stays on the directive rate — no insurer lists a
    // separate figure for it.
    const tier1Rate = listedRate ?? rt.tier1_rate_per_mille;
    const base = tier1 * (tier1Rate / 1000) + tier2 * (rt.tier2_rate_per_mille / 1000);
    const dbDiscount = v.direct_business ? base * (rt.direct_business_discount_pct / 100) : 0;
    const normal = base - dbDiscount;
    const vat = rt.apply_vat ? normal * 0.13 : 0;
    return {
      rows: [
        { label: `Premium (Rs ${tier1Rate}/1,000, all-inclusive)`, value: r(base) },
        ...(v.direct_business ? [{ label: "Direct business discount (5% — only discount NIA permits)", value: r(-dbDiscount) }] : []),
        ...(rt.apply_vat ? [{ label: "VAT (13%)", value: r(vat) }] : []),
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(normal + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "marine_cargo") {
    const invoiceValueRaw = Number(v.sum_insured || 0);
    const fxRate = v.invoice_currency === "NPR" ? 1 : Number(v.fx_rate || 1);
    const invoiceValue = invoiceValueRaw * fxRate;
    // Standard marine cargo convention: sum insured is invoice/CIF value plus
    // a margin (commonly 10%) for anticipated profit — matches the directive's
    // own "invoice value + incremental cost" basis for the premium calculation.
    const insuredValue = invoiceValue * 1.1;
    const baseRatePct = rt.category_rates[v.cargo_category]?.[v.risk_tier] ?? 0;
    // A stated MINIMUM rate, shared by every insurer. The listings' own marine
    // figures are a single blended rate on a different basis, so they are not
    // applied on top of this cargo-category table.
    const A = insuredValue * (baseRatePct / 100);
    const transitPct = rt.transit_discount_pct[v.transit_mode] ?? 0;
    const B = A * (transitPct / 100);
    const C = A - B;
    // Additional SRCC/war risk loading and the directive's ambiguous "large sum
    // insured discount" are NOT modeled here — see the caveats in this file's notes.
    const dbDiscount = v.direct_business ? C * (rt.direct_business_discount_pct / 100) : 0;
    const subtotal = C - dbDiscount;
    const vat = rt.apply_vat ? subtotal * 0.13 : 0;
    return {
      rows: [
        ...(v.invoice_currency !== "NPR" ? [{ label: `Invoice value converted to NPR (${v.invoice_currency} @ ${fxRate})`, value: r(invoiceValue) }] : []),
        { label: "Sum insured (110% of invoice value)", value: r(insuredValue) },
        { label: `Base premium (${baseRatePct}% of insured value)`, value: r(A) },
        ...(transitPct > 0 ? [{ label: `Transit discount (${transitPct}%)`, value: r(-B) }] : []),
        ...(v.direct_business ? [{ label: `Direct business discount (${rt.direct_business_discount_pct}%)`, value: r(-dbDiscount) }] : []),
        ...(rt.apply_vat ? [{ label: "VAT (13%)", value: r(vat) }] : []),
        { label: "Stamp duty", value: rt.stamp_duty_flat },
      ],
      net: r(subtotal + vat + rt.stamp_duty_flat),
    };
  }
  if (product.rateStructureType === "per_mille") {
    const perPerson = Number(v.sum_insured_per_person ?? v.sum_insured ?? 0);
    const count = Number(v.number_of_persons ?? 1);
    const totalSI = perPerson * count;
    const dbPct = v.direct_business ? rt.direct_business_discount_pct : 0;
    // Group-size-tiered products (e.g. pa-1) pick their base rate off the
    // group's headcount instead of a single fixed normal_rate_per_mille.
    const tier = rt.group_tiers?.find((t) => count <= t.max_persons);
    const baseRatePerMille = listedRate ?? (tier ? tier.rate_per_mille : rt.normal_rate_per_mille);
    const effRate = baseRatePerMille * (1 - dbPct / 100);
    const normal = (totalSI * effRate) / 1000;
    const rsmdst = (totalSI * rt.rsmdst_rate_per_mille) / 1000;
    const subtotal = normal + rsmdst;
    const vat = rt.apply_vat ? subtotal * 0.13 : 0;
    const preFloorNet = subtotal + vat + rt.stamp_duty_flat;
    const net = rt.min_premium_flat ? Math.max(preFloorNet, rt.min_premium_flat) : preFloorNet;
    return {
      rows: [
        { label: tier && listedRate == null ? `Normal premium (${count} ${count === 1 ? "person" : "persons"} tier: Rs ${tier.rate_per_mille}/1,000)` : `Normal premium (Rs ${baseRatePerMille}/1,000)`, value: r(normal) },
        { label: "RSMDST premium", value: r(rsmdst) },
        ...(rt.apply_vat ? [{ label: "VAT (13%)", value: r(vat) }] : []),
        { label: "Stamp duty", value: rt.stamp_duty_flat },
        ...(net > r(preFloorNet) ? [{ label: `Minimum premium floor (Rs ${rt.min_premium_flat})`, value: r(net - preFloorNet) }] : []),
      ],
      net: r(net),
    };
  }
  return { rows: [], net: 0 };
}

// A product's "live NRB rate" field, if it has one — the field name convention
// (usd_rate / fx_rate) is how the rest of the app finds which form field a
// fetched rate belongs in, so any future currency-taking product picks this
// up automatically as long as it follows the same naming convention.
function nrbRateFieldKey(product) {
  return product.fields.find((f) => f.key === "usd_rate" || f.key === "fx_rate")?.key;
}

// There's no backend on this static site, so "looking up an existing policy
// to renew" can only mean a policy bought previously in this same browser —
// persisted to localStorage at the moment of payment and read back by policy
// number when a renewal is started. Every access is wrapped: localStorage can
// throw (private browsing, blocked site data) and should degrade to "not
// found" rather than crash the app.
const POLICY_STORE_KEY = "suraksha_policies";

function savePolicyRecord(record) {
  try {
    const all = JSON.parse(localStorage.getItem(POLICY_STORE_KEY) || "{}");
    all[record.policyNumber] = record;
    localStorage.setItem(POLICY_STORE_KEY, JSON.stringify(all));
  } catch (e) {
    // Best-effort only — a renewal lookup just won't find this policy later.
  }
}

function loadPolicyRecord(policyNumber) {
  try {
    const all = JSON.parse(localStorage.getItem(POLICY_STORE_KEY) || "{}");
    return all[policyNumber.trim()] || null;
  } catch (e) {
    return null;
  }
}

// Nepali personal accident proposal forms (LIC Nepal's proposal form, and the
// Beema Samiti Accident Insurance Directive 2078) require a named nominee and
// their relationship to the insured — someone the claim can be paid to when
// the insured can't collect it. "Other" carries the free-text relationship
// those paper forms allow (in-law, guardian, and so on).
const NOMINEE_RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "other", label: "Other" },
];

const EMPTY_NOMINEE = { name: "", relationship: "", relationshipOther: "", contact: "" };

function nomineeRelationshipLabel(nominee) {
  if (!nominee) return "";
  if (nominee.relationship === "other") return (nominee.relationshipOther || "").trim();
  return NOMINEE_RELATIONSHIPS.find((r) => r.value === nominee.relationship)?.label ?? "";
}

// Name, relationship and a contact number are all required before a proposal
// can be submitted — a nominee nobody can reach is no better than no nominee.
function isNomineeComplete(nominee) {
  if (!nominee) return false;
  const digits = (nominee.contact || "").replace(/\D/g, "");
  return Boolean((nominee.name || "").trim()) && Boolean(nomineeRelationshipLabel(nominee)) && digits.length >= 7;
}

// Shared by the proposal (Documents screen) and by the renewal details check,
// which has to collect a nominee for policies stored before this field existed.
function NomineeFields({ nominee, onChange }) {
  const set = (patch) => onChange({ ...nominee, ...patch });
  const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 };
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nominee's full name</label>
        <input type="text" value={nominee.name} onChange={(e) => set({ name: e.target.value })} style={inputStyle} placeholder="e.g. Sunita Sharma" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Relationship to the insured</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {NOMINEE_RELATIONSHIPS.map((rel) => (
            <button
              key={rel.value}
              onClick={() => set({ relationship: rel.value, relationshipOther: rel.value === "other" ? nominee.relationshipOther : "" })}
              style={{ border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: nominee.relationship === rel.value ? colors.moss : colors.card, color: nominee.relationship === rel.value ? colors.paper : colors.mossDeep }}
            >
              {rel.label}
            </button>
          ))}
        </div>
      </div>
      {nominee.relationship === "other" && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Relationship (please specify)</label>
          <input type="text" value={nominee.relationshipOther} onChange={(e) => set({ relationshipOther: e.target.value })} style={inputStyle} placeholder="e.g. Nephew" />
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nominee's contact number</label>
        <input type="tel" inputMode="tel" value={nominee.contact} onChange={(e) => set({ contact: e.target.value })} style={inputStyle} placeholder="e.g. 9801234567" />
      </div>
    </>
  );
}

// One format for "when was this policy taken", used on the details check, the
// payment receipt and the PDF, so the same policy reads the same everywhere.
// A record written before timestamps were stored has no date at all, hence the
// guard rather than an "Invalid Date" on screen.
function formatPolicyTaken(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MobilePreview() {
  const [screen, setScreen] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInsurer, setSelectedInsurer] = useState(null);
  const [form, setForm] = useState({});
  const [quote, setQuote] = useState(null);
  const [docs, setDocs] = useState({});
  const [insuredName, setInsuredName] = useState("");
  const [nominee, setNominee] = useState(EMPTY_NOMINEE);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "processing" | "success"
  const [policyNumber, setPolicyNumber] = useState(null);
  // The exact moment this policy was paid for. Held in state rather than read
  // off the clock when the PDF is generated, so a cover note downloaded later
  // still carries the time the cover actually started.
  const [policyIssuedAt, setPolicyIssuedAt] = useState(null);
  const [usdRateInfo, setUsdRateInfo] = useState({ status: "idle", rate: null, date: null, currency: null });
  const [coverageOpen, setCoverageOpen] = useState(null); // null, or one of: "disability", "riders", "exclusions"

  // Renewal flow: renewalLookup is the policy-number search box; renewalContext
  // is set once a policy is found and stays set through the rest of the flow
  // (quote, payment, PDF) so those screens know this is a renewal, not a new
  // purchase, and can show/generate the right thing.
  const [renewalLookup, setRenewalLookup] = useState("");
  const [renewalLookupInsurerId, setRenewalLookupInsurerId] = useState("");
  const [renewalLookupError, setRenewalLookupError] = useState(null);
  const [renewalContext, setRenewalContext] = useState(null); // null | { originalPolicyNumber, purchaseDate, priorNet }

  const visibleProducts = activeCategory ? PRODUCTS.filter((p) => p.category === activeCategory) : PRODUCTS;

  // NRB Forex API — https://www.nrb.org.np/api/forex/v1/rates
  //   GET params: page, per_page, from (Y-m-d), to (Y-m-d)
  //   200 response shape: { status: { code }, data: { payload: [
  //     { date, published_on, modified_on, rates: [
  //       { currency: { unit, name, ISO3 }, buy, sell }
  //     ] }
  //   ] }, pagination: {...} }
  //   400 response shape: { status: { code: 400 }, errors: { validation: {...} }, data: { payload: null } }
  //
  // Generalized to any currency NRB publishes — pass an ISO3 code. `fieldKey`
  // is which form field the fetched rate gets written into: travel's plan
  // uses "usd_rate", marine's invoice conversion uses "fx_rate" — writing to
  // the wrong one silently leaves the other field's value (often the 1x
  // NPR-invoice default) in place, so quotes stop converting currency at all
  // even though the UI shows the correct fetched rate.
  // Uses NRB's SELL rate specifically, not a buy/sell midpoint.
  async function fetchNrbRate(currencyIso3 = "USD", fieldKey = "usd_rate") {
    setUsdRateInfo({ status: "loading", rate: null, date: null, currency: currencyIso3 });
    try {
      // Query the last 10 days, not just today — NRB doesn't publish a rate
      // every calendar day (weekends/holidays), so a same-day-only query
      // regularly comes back empty. We then take the most recently
      // *published* day in that window rather than assuming payload[0] is it.
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 10);
      const fmt = (d) => d.toISOString().slice(0, 10); // Y-m-d
      const url = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=${fmt(from)}&to=${fmt(to)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.status?.code !== 200) {
        const validationErrors = data?.errors?.validation;
        throw new Error(validationErrors ? JSON.stringify(validationErrors) : `NRB API returned status ${data?.status?.code}`);
      }

      const payload = data?.data?.payload ?? [];
      if (payload.length === 0) throw new Error("No rates published in the queried date range");
      const latestDay = payload.reduce((latest, day) => (day.date > latest.date ? day : latest), payload[0]);

      const currencyRate = latestDay.rates?.find(
        (r) => (r.currency?.ISO3 ?? r.currency?.iso3)?.toUpperCase() === currencyIso3.toUpperCase()
      );
      if (!currencyRate) throw new Error(`${currencyIso3} not found in NRB response`);

      const sellRate = parseFloat(currencyRate.sell);
      setUsdRateInfo({ status: "success", rate: sellRate, date: latestDay.date, currency: currencyIso3 });
      setForm((f) => ({ ...f, [fieldKey]: sellRate }));
    } catch (e) {
      // Likely a CORS restriction from NRB's server on browser-based requests,
      // or the API being unreachable — either way, fall back to manual entry
      // rather than blocking the quote.
      setUsdRateInfo({ status: "error", rate: null, date: null, currency: currencyIso3 });
    }
  }

  function openProduct(p) {
    setSelectedProduct(p);
    setRenewalContext(null);
    setScreen("insurers");
  }

  function chooseInsurer(insurer) {
    setSelectedInsurer(insurer);
    setForm(selectedProduct.defaults);
    setQuote(null);
    setDocs({});
    setInsuredName("");
    setNominee(EMPTY_NOMINEE);
    setPaymentStatus(null);
    setPolicyNumber(null);
    setPolicyIssuedAt(null);
    setCoverageOpen(null);
    setRenewalContext(null);
    setScreen("product");
    if (selectedProduct.rateStructureType === "usd_base") {
      fetchNrbRate("USD", nrbRateFieldKey(selectedProduct) || "usd_rate");
    } else if (selectedProduct.rateStructureType === "eur_base") {
      fetchNrbRate("EUR", nrbRateFieldKey(selectedProduct) || "fx_rate");
    }
  }

  // --- Renewal flow (policy number -> details check -> renew or re-quote -> payment) ---

  function startRenewal() {
    setRenewalLookup("");
    setRenewalLookupInsurerId("");
    setRenewalLookupError(null);
    setRenewalContext(null);
    setScreen("renew-lookup");
  }

  function findPolicyForRenewal() {
    if (!renewalLookup.trim() || !renewalLookupInsurerId) return;
    const record = loadPolicyRecord(renewalLookup);
    if (!record) {
      setRenewalLookupError(
        "No policy found with that number on this device. Renewal lookup only works for policies bought earlier in this same browser — there's no shared account system behind this yet."
      );
      return;
    }
    if (record.insurerId !== renewalLookupInsurerId) {
      setRenewalLookupError("That policy number isn't on file with the insurer you selected. Double-check both and try again.");
      return;
    }
    const product = PRODUCTS.find((p) => p.id === record.productId);
    const insurer = INSURERS.find((i) => i.id === record.insurerId);
    if (!product || !insurer) {
      setRenewalLookupError("That policy's product or insurer is no longer available.");
      return;
    }
    setRenewalLookupError(null);
    setSelectedProduct(product);
    setSelectedInsurer(insurer);
    setForm(record.form);
    setInsuredName(record.insuredName);
    setNominee({ ...EMPTY_NOMINEE, ...(record.nominee || {}) });
    setDocs(record.docs);
    setQuote(null);
    setPaymentStatus(null);
    setPolicyNumber(null);
    setPolicyIssuedAt(null);
    setRenewalContext({ originalPolicyNumber: record.policyNumber, purchaseDate: record.purchaseDate, priorNet: record.quoteNet });
    setScreen("renew-check");
    if (product.rateStructureType === "usd_base") {
      fetchNrbRate("USD", nrbRateFieldKey(product) || "usd_rate");
    } else if (product.rateStructureType === "eur_base") {
      fetchNrbRate("EUR", nrbRateFieldKey(product) || "fx_rate");
    }
  }

  // "Nothing's changed" — skip straight to a fresh quote (current rates,
  // same insurer, same cover) and payment. No document re-upload: those were
  // already verified when the policy was first issued.
  function renewUnchanged() {
    setQuote(calc(selectedProduct, offerFor(selectedProduct, selectedInsurer), form));
    setScreen("payment");
  }

  // "Something's changed" — drop into the normal product-quote screen,
  // pre-filled with the prior cover, so they can edit and re-quote through
  // the same insurer-rating engine as any other purchase.
  function renewWithChanges() {
    setScreen("product");
  }

  function pay(gateway) {
    setPaymentStatus("processing");
    setTimeout(() => {
      const productCode = selectedProduct.id.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
      const issuedAt = new Date();
      const serial = String(Math.floor(Math.random() * 90000) + 10000);
      // Prefix is the issuing insurer's own code, so the number on the policy
      // matches the company that actually wrote it.
      const newPolicyNumber = `${selectedInsurer.code}-${productCode}-${issuedAt.getFullYear()}-${serial}`;
      setPolicyNumber(newPolicyNumber);
      setPolicyIssuedAt(issuedAt.toISOString());
      savePolicyRecord({
        policyNumber: newPolicyNumber,
        productId: selectedProduct.id,
        insurerId: selectedInsurer.id,
        form,
        insuredName,
        nominee,
        docs,
        quoteRows: quote.rows,
        quoteNet: quote.net,
        purchaseDate: issuedAt.toISOString(),
        renewedFrom: renewalContext?.originalPolicyNumber ?? null,
      });
      setPaymentStatus("success");
    }, 1000);
  }

  // Renders a field's stored value the same way it's shown on the quote form —
  // resolving an enum's stored `value` back to its display `label` — so the
  // PDF's "Cover details" section reads the same as what the customer picked,
  // not the raw internal key (e.g. "worldwide_ex_us").
  function formatFieldValue(field, value) {
    if (field.type === "enum") return field.options.find((o) => o.value === value)?.label ?? value;
    if (field.type === "boolean") return value ? "Yes" : "No";
    if (field.type === "number") return Number(value).toLocaleString();
    return value;
  }

  // Builds a cover-note PDF entirely client-side (jsPDF) — there's no backend
  // to generate or store this on, so this is generated fresh in the browser
  // from the same product/form/quote state already on screen, and handed to
  // the customer as an immediate download.
  function downloadPolicyPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 18;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...hexRgb(colors.mossDeep));
    doc.text("Suraksha", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexRgb(colors.slate));
    doc.text("Insurance marketplace, Nepal", marginX, (y += 6));

    doc.setDrawColor(...hexRgb(colors.line));
    doc.line(marginX, (y += 4), pageWidth - marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...hexRgb(colors.ink));
    doc.text(renewalContext ? "Renewal Cover Note / Policy Schedule" : "Cover Note / Policy Schedule", marginX, (y += 10));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...hexRgb(colors.ink));
    const headerRows = [
      ["Policy number", policyNumber || "—"],
      ["Issued on", formatPolicyTaken(policyIssuedAt)],
      ["Insurer", selectedInsurer?.name || "—"],
      ["Product", selectedProduct?.name || "—"],
      ["Policyholder", insuredName || "—"],
      ...(renewalContext
        ? [
            ["Renewed from", renewalContext.originalPolicyNumber],
            ["Reinsurance", "Placed with the insurer's treaty reinsurer"],
          ]
        : []),
    ];
    y += 8;
    headerRows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, marginX, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), marginX + 38, y);
      y += 6;
    });

    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    doc.text("Cover details", marginX, (y += 6));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexRgb(colors.ink));
    selectedProduct.fields.forEach((field) => {
      if (form[field.key] === undefined) return;
      if ((field.key === "fx_rate" && form.invoice_currency === "NPR") || (field.key === "cover_type" && form.plan === "saarc")) return;
      doc.text(`${field.label}: ${formatFieldValue(field, form[field.key])}`, marginX, (y += 6));
    });

    if (y > 240) { doc.addPage(); y = 20; }
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    doc.text("Nominee", marginX, (y += 6));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexRgb(colors.ink));
    doc.text(`Name: ${nominee.name.trim() || "\u2014"}`, marginX, (y += 6));
    doc.text(`Relationship to the insured: ${nomineeRelationshipLabel(nominee) || "\u2014"}`, marginX, (y += 6));
    doc.text(`Contact: ${nominee.contact.trim() || "\u2014"}`, marginX, (y += 6));

    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    doc.text("Premium breakdown", marginX, (y += 6));
    doc.setFontSize(10);
    (quote?.rows || []).forEach((row) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...hexRgb(colors.ink));
      doc.text(row.label, marginX, (y += 6));
      doc.text(`Rs. ${Number(row.value).toLocaleString()}`, pageWidth - marginX, y, { align: "right" });
    });
    doc.setDrawColor(...hexRgb(colors.line));
    doc.line(marginX, (y += 2), pageWidth - marginX, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Net premium", marginX, (y += 7));
    doc.text(`Rs. ${quote?.net.toLocaleString() ?? "—"}`, pageWidth - marginX, y, { align: "right" });

    const cov = COVERAGE_SCHEDULES[selectedProduct.coverageKey || selectedProduct.category];
    if (cov) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...hexRgb(colors.moss));
      const wrappedHeading = doc.splitTextToSize(`What's covered — ${cov.sourceLabel}`, pageWidth - marginX * 2);
      doc.text(wrappedHeading, marginX, (y += 6));
      y += (wrappedHeading.length - 1) * 5;
      doc.setFontSize(9.5);
      cov.benefits.forEach((b) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...hexRgb(colors.ink));
        const wrappedLabel = doc.splitTextToSize(b.label, pageWidth - marginX * 2);
        doc.text(wrappedLabel, marginX, (y += 5));
        y += (wrappedLabel.length - 1) * 4.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...hexRgb(colors.slate));
        const wrappedDetail = doc.splitTextToSize(b.detail, pageWidth - marginX * 2);
        doc.text(wrappedDetail, marginX, (y += 4.5));
        y += (wrappedDetail.length - 1) * 4.5;
      });
    }

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...hexRgb(colors.slate));
    const indicativePricing = isIndicative(selectedProduct, offerFor(selectedProduct, selectedInsurer));
    const disclaimer =
      "This cover note is generated by the Suraksha app at the moment of payment and confirms the cover selected and premium paid. Final policy issuance, endorsement, and claims remain subject to the insurer's own acceptance, underwriting, and terms." +
      (indicativePricing
        ? " The premium shown is indicative: this insurer prices this cover on request and no public rate table exists for it, so the figure is an estimate rather than a filed rate."
        : "");
    doc.text(doc.splitTextToSize(disclaimer, pageWidth - marginX * 2), marginX, 280);

    doc.save(`${policyNumber || "suraksha-policy"}.pdf`);
  }

  return (
    <div className="suraksha-outer">
      <div className="suraksha-shell">
        <div className="suraksha-notch" style={{ height: 24, background: "#2b2b2b", borderRadius: "20px 20px 0 0", justifyContent: "center", alignItems: "flex-end", paddingBottom: 4 }}>
          <div style={{ width: 60, height: 6, background: "#000", borderRadius: 4 }} />
        </div>

        <div style={{ background: colors.paper, borderBottom: `1px solid ${colors.line}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          {screen !== "home" && (
            <button
              onClick={() =>
                setScreen(
                  screen === "renew-lookup" ? "home"
                  : screen === "renew-check" ? "renew-lookup"
                  : screen === "product" ? (renewalContext ? "renew-check" : "insurers")
                  : screen === "kyc" ? "product"
                  : screen === "payment" ? (renewalContext ? "renew-check" : "kyc")
                  : "home"
                )
              }
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label="Back"
            >
              <ArrowLeft size={20} color={colors.mossDeep} />
            </button>
          )}
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, color: colors.mossDeep, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {screen === "home" ? "Suraksha"
              : screen === "renew-lookup" ? "Renew a policy"
              : screen === "renew-check" ? "Details check"
              : screen === "insurers" ? selectedProduct?.name
              : screen === "kyc" ? "Documents"
              : screen === "payment" ? "Payment"
              : `${selectedProduct?.name} — ${selectedInsurer?.name}`}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, fontFamily: "-apple-system, sans-serif" }}>
          {screen === "home" && (
            <>
              <button
                onClick={startRenewal}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: colors.card, border: `1px solid ${colors.moss}`, borderRadius: 10, padding: 12, marginBottom: 16, cursor: "pointer" }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.mossDeep }}>Have a policy already? Renew it</span>
                <ChevronRight size={16} color={colors.moss} />
              </button>

              <p style={{ fontSize: 15, fontWeight: 700, color: colors.ink, margin: "0 0 12px" }}>What are you insuring today?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setActiveCategory(activeCategory === c.slug ? null : c.slug)}
                    style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 12px", background: activeCategory === c.slug ? colors.moss : colors.card, cursor: "pointer" }}
                  >
                    <c.Icon size={15} color={activeCategory === c.slug ? colors.paper : colors.moss} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: activeCategory === c.slug ? colors.paper : colors.mossDeep }}>{c.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleProducts.map((p) => (
                  <div key={p.id} onClick={() => openProduct(p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{p.name}</div>
                    </div>
                    <ChevronRight size={18} color={colors.slate} />
                  </div>
                ))}
                {visibleProducts.length === 0 && <p style={{ fontSize: 13, color: colors.slate }}>No products in this category yet.</p>}
              </div>
            </>
          )}

          {screen === "renew-lookup" && (
            <>
              <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>
                Enter the policy number and insurer from your policy PDF to renew it.
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Insurance company</label>
                <select
                  value={renewalLookupInsurerId}
                  onChange={(e) => setRenewalLookupInsurerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select insurer</option>
                  {INSURERS.map((ins) => (
                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Policy number</label>
                <input
                  type="text"
                  value={renewalLookup}
                  onChange={(e) => setRenewalLookup(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. NICL-PAINDI-2026-71660"
                />
              </div>
              {renewalLookupError && (
                <p style={{ fontSize: 12, color: "#a33", marginBottom: 12 }}>{renewalLookupError}</p>
              )}
              <button
                style={{ ...buttonStyle, opacity: renewalLookup.trim() && renewalLookupInsurerId ? 1 : 0.5 }}
                disabled={!renewalLookup.trim() || !renewalLookupInsurerId}
                onClick={findPolicyForRenewal}
              >
                Find policy
              </button>
              <p style={{ fontSize: 11, color: colors.slate, marginTop: 14 }}>
                Renewal lookup only works for policies bought earlier in this same browser — this app has no shared account system behind it yet.
              </p>
            </>
          )}

          {screen === "renew-check" && selectedProduct && selectedInsurer && renewalContext && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "0 0 4px" }}>Details check</p>
              <p style={{ fontSize: 12, color: colors.slate, margin: "0 0 14px" }}>
                Here's what's on file for this policy. Let us know if anything's changed before we renew it.
              </p>
              <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Policy number</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>{renewalContext.originalPolicyNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Taken from</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>{selectedInsurer.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Product</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>{selectedProduct.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Policyholder</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>{insuredName}</span>
                </div>
                {isNomineeComplete(nominee) && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                      <span style={{ color: colors.slate }}>Nominee</span>
                      <span style={{ fontWeight: 700, color: colors.ink }}>{nominee.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                      <span style={{ color: colors.slate }}>Relationship</span>
                      <span style={{ fontWeight: 700, color: colors.ink }}>{nomineeRelationshipLabel(nominee)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                      <span style={{ color: colors.slate }}>Nominee's contact</span>
                      <span style={{ fontWeight: 700, color: colors.ink }}>{nominee.contact}</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Taken on</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>{formatPolicyTaken(renewalContext.purchaseDate)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span style={{ color: colors.slate }}>Last premium paid</span>
                  <span style={{ fontWeight: 700, color: colors.ink }}>Rs. {renewalContext.priorNet.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: `1px solid ${colors.line}`, margin: "8px 0" }} />
                {selectedProduct.fields.map((field) => {
                  if (field.key === "usd_rate" || field.key === "fx_rate") return null; // live rate, not a "detail" to confirm
                  if ((field.key === "fx_rate" && form.invoice_currency === "NPR") || (field.key === "cover_type" && form.plan === "saarc")) return null;
                  if (form[field.key] === undefined) return null;
                  return (
                    <div key={field.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
                      <span style={{ color: colors.slate }}>{field.label}</span>
                      <span style={{ color: colors.ink }}>{formatFieldValue(field, form[field.key])}</span>
                    </div>
                  );
                })}
              </div>
              {!isNomineeComplete(nominee) && (
                <div style={{ marginBottom: 16, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.ink, margin: "0 0 2px" }}>Add a nominee before renewing</p>
                  <p style={{ fontSize: 11.5, color: colors.slate, margin: "0 0 10px" }}>There's no nominee on file for this policy.</p>
                  <NomineeFields nominee={nominee} onChange={setNominee} />
                </div>
              )}
              <button
                style={{ ...buttonStyle, opacity: isNomineeComplete(nominee) ? 1 : 0.5 }}
                disabled={!isNomineeComplete(nominee)}
                onClick={renewUnchanged}
              >
                Nothing's changed — renew
              </button>
              <button
                style={{ ...buttonStyle, marginTop: 8, background: colors.card, color: colors.mossDeep, border: `1px solid ${colors.moss}`, opacity: isNomineeComplete(nominee) ? 1 : 0.5 }}
                disabled={!isNomineeComplete(nominee)}
                onClick={renewWithChanges}
              >
                Something's changed — update details
              </button>
            </>
          )}

          {screen === "insurers" && selectedProduct && (() => {
            const offers = insurersFor(selectedProduct);
            const tableSource = RATE_TABLE_SOURCE[selectedProduct.id];
            // Rank on price, then on claim settlement where the price ties —
            // which, on a tariff line, is every row.
            const ranked = offers
              .map((ins) => ({ ...ins, preview: calc(selectedProduct, ins.offer, selectedProduct.defaults) }))
              .sort((a, b) => a.preview.net - b.preview.net || (b.claimRatio ?? -1) - (a.claimRatio ?? -1));
            const spread = ranked.length ? ranked[ranked.length - 1].preview.net - ranked[0].preview.net : 0;
            const anyIndicative = ranked.some((x) => isIndicative(selectedProduct, x.offer));
            return (
              <>
                <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 4px" }}>
                  {offers.length === INSURERS.length
                    ? `All ${INSURERS.length} licensed non-life insurers sell this cover.`
                    : offers.length === 1
                      ? `Only one of the ${INSURERS.length} licensed non-life insurers sells this cover.`
                      : `${offers.length} of the ${INSURERS.length} licensed non-life insurers sell this cover.`}
                </p>
                {offers.length > 1 && (
                  <p style={{ fontSize: 12, color: colors.slate, margin: "0 0 12px" }}>
                    {spread > 0
                      ? `Rs. ${spread.toLocaleString()} between the cheapest and the dearest on the same cover.`
                      : tableSource
                        ? `They all quote the same premium: this line is priced off a set tariff (${tableSource}), so there is nothing to compare on price — compare claim settlement instead.`
                        : "They all quote the same premium, because none of them publishes a rate for it — compare claim settlement instead."}
                  </p>
                )}
                {anyIndicative && (
                  <div style={{ marginBottom: 12, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "9px 11px" }}>
                    <p style={{ fontSize: 11.5, color: colors.slate, margin: 0 }}>
                      Prices marked <strong>indicative</strong> are this app's own placeholder figures, not a quote —
                      that insurer prices this cover on request.
                    </p>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ranked.map((ins) => {
                    const indicative = isIndicative(selectedProduct, ins.offer);
                    return (
                      <div
                        key={ins.id}
                        onClick={() => chooseInsurer(ins)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{ins.name}</div>
                          <div style={{ fontSize: 11, color: colors.slate, marginTop: 2 }}>
                            {indicative ? "Indicative " : "From "}Rs. {ins.preview.net.toLocaleString()}
                            {ins.claimRatio != null && <> · {ins.claimRatio}% of claims settled</>}
                          </div>
                          <div style={{ fontSize: 10.5, color: indicative ? "#9a6b1f" : colors.moss, marginTop: 3 }}>
                            {BASIS_LABEL[ins.offer.basis]}
                            {ins.offer.basis === "published" && typeof ins.offer.ratePerMille === "number" && ` — Rs ${ins.offer.ratePerMille}/1,000`}
                          </div>
                          {ins.offer.note && (
                            <div style={{ fontSize: 10.5, color: colors.slate, marginTop: 3, fontStyle: "italic" }}>{ins.offer.note}</div>
                          )}
                        </div>
                        <ChevronRight size={18} color={colors.slate} style={{ flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 10.5, color: colors.slate, margin: "12px 0 0", lineHeight: 1.5 }}>
                  Which insurers sell what, their listed rates and their claim ratios come from one comparison-site
                  listing (BFIS Compare, read 18 Sep 2026), which states its own premium figures are illustrative.
                  None of it has been confirmed against the insurers' own filings.
                </p>
              </>
            );
          })()}

          {screen === "product" && selectedProduct && (
            <>
              {renewalContext && (
                <div style={{ marginBottom: 14, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.ink, margin: 0 }}>Renewing policy {renewalContext.originalPolicyNumber}</p>
                  <p style={{ fontSize: 11.5, color: colors.slate, margin: "2px 0 0" }}>Update whatever's changed, then get a fresh quote.</p>
                </div>
              )}
              {COVERAGE_SCHEDULES[selectedProduct.coverageKey || selectedProduct.category] && (() => {
                const cov = COVERAGE_SCHEDULES[selectedProduct.coverageKey || selectedProduct.category];
                const sectionToggle = (key, title, source) => (
                  <button
                    onClick={() => setCoverageOpen(coverageOpen === key ? null : key)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>{title} <span style={{ fontWeight: 400, color: colors.slate }}>({source})</span></span>
                    <ChevronRight size={14} color={colors.slate} style={{ transform: coverageOpen === key ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                );
                return (
                  <div style={{ marginBottom: 16, background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: colors.moss, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 8px" }}>
                      What's covered — {cov.sourceLabel}
                    </p>
                    {cov.benefits.map((b, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: colors.ink, fontWeight: 600 }}>
                          <span>{b.label}</span>
                          <span style={{ color: colors.slate, fontWeight: 400 }}>{b.source}</span>
                        </div>
                        <div style={{ fontSize: 12, color: colors.slate }}>{b.detail}</div>
                      </div>
                    ))}
                    {cov.minClaim != null && (
                      <p style={{ fontSize: 11.5, color: colors.slate, margin: "6px 0 4px" }}>
                        Minimum claim: Rs {cov.minClaim.toLocaleString()} — smaller claims aren't payable under this policy (Sec. 22).
                      </p>
                    )}
                    {cov.eligibilityNote && (
                      <p style={{ fontSize: 11.5, color: colors.slate, margin: "6px 0 4px" }}>{cov.eligibilityNote}</p>
                    )}

                    <div style={{ borderTop: `1px solid ${colors.line}`, marginTop: 6 }}>
                      {sectionToggle("disability", "Disability payout schedule", `${cov.permanentTotal.source} / ${cov.permanentPartial.source}`)}
                      {coverageOpen === "disability" && (
                        <div style={{ paddingBottom: 8 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: colors.ink, margin: "4px 0" }}>{cov.permanentTotal.title}</p>
                          {cov.permanentTotal.rows.map((row, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.slate, padding: "2px 0" }}>
                              <span style={{ flex: 1, paddingRight: 8 }}>{row.label}</span>
                              <span style={{ fontWeight: 700, color: colors.ink }}>{row.pct}%</span>
                            </div>
                          ))}
                          <p style={{ fontSize: 11, fontWeight: 700, color: colors.ink, margin: "8px 0 4px" }}>{cov.permanentPartial.title}</p>
                          {cov.permanentPartial.rows.map((row, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.slate, padding: "2px 0" }}>
                              <span style={{ flex: 1, paddingRight: 8 }}>{row.label}</span>
                              <span style={{ fontWeight: 700, color: colors.ink }}>{typeof row.pct === "number" ? `${row.pct}%` : row.pct}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: `1px solid ${colors.line}` }}>
                      {sectionToggle("riders", cov.riders.title, cov.riders.source)}
                      {coverageOpen === "riders" && (
                        <div style={{ paddingBottom: 8 }}>
                          {cov.riders.rows.map((row, i) => (
                            <div key={i} style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 12, color: colors.ink, fontWeight: 600 }}>{row.label}</div>
                              <div style={{ fontSize: 11.5, color: colors.slate }}>{row.detail}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: `1px solid ${colors.line}` }}>
                      {sectionToggle("exclusions", cov.exclusions.title, cov.exclusions.source)}
                      {coverageOpen === "exclusions" && (
                        <ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>
                          {cov.exclusions.rows.map((line, i) => (
                            <li key={i} style={{ fontSize: 12, color: colors.slate, marginBottom: 3 }}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })()}

              {selectedProduct.fields.map((field) => {
                if (field.key === "fx_rate" && form.invoice_currency === "NPR") return null; // no FX conversion needed for a NPR invoice
                if (field.key === "cover_type" && form.plan === "saarc") return null; // SAARC has one combined table, no medical/package split
                return (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>
                    {field.key === "sum_insured" && form.invoice_currency ? `${field.label} (${form.invoice_currency})` : field.label}
                  </label>
                  {field.type === "number" && (field.key === "usd_rate" || field.key === "fx_rate") ? (
                    <div>
                      {usdRateInfo.status === "loading" && <p style={{ fontSize: 13, color: colors.slate }}>Fetching today's rate from NRB…</p>}
                      {usdRateInfo.status === "success" && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#e9efe9", borderRadius: 8, padding: "10px 12px" }}>
                          <span style={{ fontSize: 13, color: colors.mossDeep, fontWeight: 700 }}>Rs. {usdRateInfo.rate.toFixed(2)} <span style={{ fontWeight: 400, color: colors.slate }}>({usdRateInfo.currency} sell rate, NRB {usdRateInfo.date})</span></span>
                          <button onClick={() => fetchNrbRate(usdRateInfo.currency, field.key)} style={{ background: "none", border: "none", color: colors.moss, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
                        </div>
                      )}
                      {usdRateInfo.status === "error" && (
                        <>
                          <p style={{ fontSize: 12, color: colors.slate, marginBottom: 6 }}>Couldn't fetch NRB's live rate — enter it manually.</p>
                          <input type="number" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })} style={inputStyle} />
                        </>
                      )}
                    </div>
                  ) : field.type === "number" && (
                    <input type="number" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })} style={inputStyle} />
                  )}
                  {field.type === "enum" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setForm({ ...form, [field.key]: opt.value });
                            if (field.key === "invoice_currency") {
                              const defaultInvoiceByCurrency = { NPR: 1000000, USD: 10000, EUR: 10000, INR: 800000, GBP: 8000, CNY: 70000 };
                              if (opt.value === "NPR") {
                                setForm((f) => ({ ...f, invoice_currency: "NPR", fx_rate: 1, sum_insured: defaultInvoiceByCurrency.NPR }));
                              } else {
                                setForm((f) => ({ ...f, sum_insured: defaultInvoiceByCurrency[opt.value] }));
                                fetchNrbRate(opt.value, "fx_rate");
                              }
                            }
                          }}
                          style={{ border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: form[field.key] === opt.value ? colors.moss : colors.card, color: form[field.key] === opt.value ? colors.paper : colors.mossDeep }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {field.type === "text" && (
                    <input type="text" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} style={inputStyle} />
                  )}
                  {field.type === "boolean" && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={!!form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} />
                      Yes
                    </label>
                  )}
                </div>
                );
              })}

              <button style={buttonStyle} onClick={() => setQuote(calc(selectedProduct, offerFor(selectedProduct, selectedInsurer), form))}>Get quote</button>

              {quote && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Estimated premium</p>
                  {isIndicative(selectedProduct, offerFor(selectedProduct, selectedInsurer)) ? (
                    <div style={{ marginBottom: 10, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "9px 11px" }}>
                      <p style={{ fontSize: 11.5, color: colors.slate, margin: 0 }}>
                        <strong>Indicative only.</strong> {selectedInsurer.name} prices this cover on request, and no public
                        rate table exists for it, so the figures below are this app's own placeholders — not a quote.
                      </p>
                    </div>
                  ) : (
                    RATE_TABLE_SOURCE[selectedProduct.id] && (
                      <p style={{ fontSize: 11, color: colors.slate, margin: "0 0 10px" }}>
                        Rated on {RATE_TABLE_SOURCE[selectedProduct.id]}.
                      </p>
                    )
                  )}
                  {quote.rows.map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
                      <span>{row.label}</span>
                      <span>Rs. {Number(row.value).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, fontWeight: 700, borderTop: `1px solid ${colors.line}`, marginTop: 6, paddingTop: 6 }}>
                    <span>Net premium</span>
                    <span>Rs. {quote.net.toLocaleString()}</span>
                  </div>
                  <button style={{ ...buttonStyle, marginTop: 14 }} onClick={() => setScreen(renewalContext ? "payment" : "kyc")}>
                    {renewalContext ? "Continue to payment" : "Continue to buy"}
                  </button>
                </div>
              )}
            </>
          )}

          {screen === "kyc" && selectedProduct && (
            <>
              <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>A few proposal details, then the documents to upload.</p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Full name (as it appears on your documents)</label>
                <input type="text" value={insuredName} onChange={(e) => setInsuredName(e.target.value)} style={inputStyle} placeholder="e.g. Aarav Sharma" />
              </div>

              <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "0 0 2px" }}>Nominee</p>
                <p style={{ fontSize: 11.5, color: colors.slate, margin: "0 0 10px" }}>Who the insurer pays a claim to if it can't be paid to you.</p>
                <NomineeFields nominee={nominee} onChange={setNominee} />
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "2px 0 0", borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>Documents</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {selectedProduct.docsRequired.map((doc) => (
                  <div key={doc.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${colors.line}` }}>
                    <span style={{ fontSize: 13, color: colors.ink }}>{doc.label}</span>
                    {docs[doc.key] ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: colors.mossDeep, fontWeight: 700, fontSize: 12 }}>
                        <Check size={14} />Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => setDocs((d) => ({ ...d, [doc.key]: true }))}
                        style={{ background: colors.moss, color: colors.paper, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                style={{ ...buttonStyle, marginTop: 16, opacity: selectedProduct.docsRequired.every((d) => docs[d.key]) && insuredName.trim() && isNomineeComplete(nominee) ? 1 : 0.5 }}
                disabled={!selectedProduct.docsRequired.every((d) => docs[d.key]) || !insuredName.trim() || !isNomineeComplete(nominee)}
                onClick={() => setScreen("payment")}
              >
                Submit for review
              </button>
            </>
          )}

          {screen === "payment" && (
            <>
              {paymentStatus === "success" ? (
                <div style={{ textAlign: "center", paddingTop: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e4efe9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Check size={26} color={colors.mossDeep} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{renewalContext ? "Policy renewed" : "Payment received"}</p>
                  <p style={{ fontSize: 13, color: colors.slate, marginBottom: 4 }}>Rs. {quote?.net.toLocaleString()} paid for {selectedProduct?.name}</p>
                  <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Policy number: {policyNumber}</p>
                  <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Taken from: {selectedInsurer?.name}</p>
                  <p style={{ fontSize: 12, color: colors.slate, marginBottom: renewalContext ? 2 : 20 }}>Taken on: {formatPolicyTaken(policyIssuedAt)}</p>
                  {renewalContext && (
                    <>
                      <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Renewed from: {renewalContext.originalPolicyNumber}</p>
                      <p style={{ fontSize: 12, color: colors.slate, marginBottom: 20 }}>Reinsurance: placed with the insurer's treaty reinsurer</p>
                    </>
                  )}
                  <button style={buttonStyle} onClick={downloadPolicyPdf}>Download policy PDF</button>
                </div>
              ) : paymentStatus === "processing" ? (
                <p style={{ fontSize: 13, color: colors.slate, textAlign: "center", paddingTop: 24 }}>Processing payment…</p>
              ) : (
                <>
                  <div style={{ borderBottom: `1px solid ${colors.line}`, paddingBottom: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: colors.slate }}>Amount to pay</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: colors.mossDeep, marginTop: 2 }}>Rs. {quote?.net.toLocaleString()}</div>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, marginBottom: 8 }}>Choose a payment method</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["eSewa", "Khalti", "ConnectIPS"].map((gw) => (
                      <button
                        key={gw}
                        onClick={() => pay(gw)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 700, color: colors.ink }}
                      >
                        {gw}
                        <ChevronRight size={18} color={colors.slate} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${colors.line}`, borderRadius: 8, fontSize: 14, background: colors.card, boxSizing: "border-box" };
const buttonStyle = { width: "100%", background: colors.moss, color: colors.paper, border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" };
