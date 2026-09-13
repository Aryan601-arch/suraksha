import { useState, useEffect } from "react";
import { Car, HeartPulse, Plane, ShieldCheck, Home, ChevronRight, Check, ArrowLeft, Wheat, Ship, PlaneTakeoff, Briefcase } from "lucide-react";

const colors = {
  ink: "#1c2b28",
  paper: "#f6f3ea",
  slate: "#4b5a56",
  moss: "#2f5d4f",
  mossDeep: "#16302a",
  line: "#ddd6c4",
  card: "#ffffff",
};

const CATEGORIES = [
  { slug: "motor", label: "Motor", Icon: Car },
  { slug: "health", label: "Health", Icon: HeartPulse },
  { slug: "travel", label: "Travel", Icon: Plane },
  { slug: "personal_accident", label: "Accident", Icon: ShieldCheck },
  { slug: "property", label: "Property", Icon: Home },
  { slug: "agri", label: "Agri", Icon: Wheat },
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
        { value: "saarc", label: "SAARC countries" }, { value: "asian", label: "Asian, excl. SAARC" },
        { value: "worldwide_ex_us", label: "Worldwide, excl. US/Canada" }, { value: "worldwide_incl_us", label: "Worldwide, incl. US/Canada" },
      ]},
      { key: "days", label: "Trip length (days)", type: "number" },
      { key: "usd_rate", label: "USD to NPR rate (NRB sell rate, live)", type: "number" },
    ],
    defaults: { plan: "asian", days: 10, usd_rate: 138 },
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
    id: "agri-1",
    category: "agri",
    name: "Agri Insurance",
    rateStructureType: "per_mille",
    fields: [
      { key: "sum_insured", label: "Sum insured (Rs.)", type: "number" },
      { key: "direct_business", label: "Direct business", type: "boolean" },
    ],
    defaults: { sum_insured: 300000, direct_business: false },
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
// Authority (as of May 2026) — this list itself is real. The pricing
// "factor" on each is still an invented placeholder for demo purposes only.
const INSURERS = [
  { id: "nepal-insurance", name: "Nepal Insurance Company", factor: 1.02 },
  { id: "oriental", name: "The Oriental Insurance Company", factor: 0.97 },
  { id: "national", name: "National Insurance Company", factor: 1.05 },
  { id: "himalayan-everest", name: "Himalayan Everest Insurance", factor: 0.95 },
  { id: "united-ajod", name: "United Ajod Insurance", factor: 0.99 },
  { id: "neco", name: "Neco Insurance", factor: 1.03 },
  { id: "sagarmatha", name: "Sagarmatha Lumbini Insurance", factor: 1.07 },
  { id: "prabhu", name: "Prabhu Insurance", factor: 0.96 },
  { id: "igi-prudential", name: "IGI Prudential Insurance", factor: 1.01 },
  { id: "shikhar", name: "Shikhar Insurance", factor: 1.0 },
  { id: "nlg", name: "NLG Insurance", factor: 0.93 },
  { id: "siddhartha-premier", name: "Siddhartha Premier Insurance", factor: 0.98 },
  { id: "rastriya-beema", name: "Rastriya Beema Company", factor: 1.04 },
  { id: "sanima-gic", name: "Sanima GIC Insurance", factor: 0.94 },
];

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
  "travel-1": {
    usd_premium_table: {
      saarc: { medical_only: 12, package: 18 },
      asian: { medical_only: 20, package: 30 },
      worldwide_ex_us: { medical_only: 28, package: 42 },
      worldwide_incl_us: { medical_only: 45, package: 65 },
    },
    stamp_duty_flat: 50,
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
  // insurer factor below can only push the effective rate up, never below
  // this floor. This directive predates the current Insurance Act 2079/2081
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
  "agri-1": { normal_rate_per_mille: 15, rsmdst_rate_per_mille: 0, direct_business_discount_pct: 10, stamp_duty_flat: 50, apply_vat: true },
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

const r = (n) => Math.round(n * 100) / 100;

function calc(product, factor, v) {
  const rt = RATE_TABLES[product.id];
  if (product.rateStructureType === "formula") {
    const si = Number(v.sum_insured || 0);
    const cc = Number(v.cubic_capacity_cc || 0);
    const ageSurchargePct = rt.age_surcharge_pct[v.vehicle_age_band] || 0;
    const effectiveRatePct = rt.base_rate_pct * factor * (1 + ageSurchargePct / 100);
    const basic = Math.max(si * (effectiveRatePct / 100), rt.min_own_damage_premium);
    const ncdPct = rt.ncd_discount_pct[v.no_claim_discount] || 0;
    const ncdAmt = basic * (ncdPct / 100);
    const dbDiscount = v.direct_business ? (basic - ncdAmt) * (rt.direct_business_discount_pct / 100) : 0;
    const normal = Math.max(basic - ncdAmt - dbDiscount, rt.min_own_damage_premium);
    // Third-party liability is a NIA-mandated market-wide rate — same for every insurer, not scaled by factor.
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
    const rawBasic = first20L * ((band.first20L_rate * factor) / 100) + remainder * ((band.remainder_rate * factor) / 100);
    const ageSurcharge = v.vehicle_age_band === "over10" ? rawBasic * (rt.age_surcharge_pct_over10 / 100) : 0;
    const basic = Math.max(rawBasic + ageSurcharge, rt.min_own_damage_premium);
    const ncdPct = rt.ncd_discount_pct[v.no_claim_discount] || 0;
    const ncdAmt = basic * (ncdPct / 100);
    const dbDiscount = v.direct_business ? (basic - ncdAmt) * (rt.direct_business_discount_pct / 100) : 0;
    const normal = Math.max(basic - ncdAmt - dbDiscount, rt.min_own_damage_premium);
    // Third-party fee is tied to the declared-value band, not scaled by insurer factor — market-wide.
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
    const premium = r(base * factor);
    return { rows: [{ label: "Premium", value: premium }, { label: "Stamp duty", value: rt.stamp_duty_flat }], net: r(premium + rt.stamp_duty_flat) };
  }
  if (product.rateStructureType === "usd_base") {
    const usd = (rt.usd_premium_table?.[v.plan]?.package ?? 0) * factor;
    const amount = usd * Number(v.usd_rate || 0);
    const vat = amount * 0.13;
    return {
      rows: [
        { label: `Premium (${r(usd)} USD × rate)`, value: r(amount) },
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
    // Note: this rate is presented in the directive as a fixed, all-insurer
    // tariff for standard residential risk — the insurer "factor" is applied
    // here only so the comparison screen still functions, but per the real
    // regulation there's likely no legitimate price difference between
    // insurers for this specific product.
    const base = tier1 * ((rt.tier1_rate_per_mille * factor) / 1000) + tier2 * ((rt.tier2_rate_per_mille * factor) / 1000);
    const dbDiscount = v.direct_business ? base * (rt.direct_business_discount_pct / 100) : 0;
    const normal = base - dbDiscount;
    const vat = rt.apply_vat ? normal * 0.13 : 0;
    return {
      rows: [
        { label: "Premium (all-inclusive tariff rate)", value: r(base) },
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
    // This is a stated MINIMUM rate — factor can only scale it up, never below the floor.
    const effectiveFactor = Math.max(factor, 1.0);
    const A = insuredValue * ((baseRatePct * effectiveFactor) / 100);
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
    const baseRatePerMille = tier ? tier.rate_per_mille : rt.normal_rate_per_mille;
    const effRate = baseRatePerMille * factor * (1 - dbPct / 100);
    const normal = (totalSI * effRate) / 1000;
    const rsmdst = (totalSI * rt.rsmdst_rate_per_mille) / 1000;
    const subtotal = normal + rsmdst;
    const vat = rt.apply_vat ? subtotal * 0.13 : 0;
    const preFloorNet = subtotal + vat + rt.stamp_duty_flat;
    const net = rt.min_premium_flat ? Math.max(preFloorNet, rt.min_premium_flat) : preFloorNet;
    return {
      rows: [
        { label: tier ? `Normal premium (${count} ${count === 1 ? "person" : "persons"} tier: Rs ${tier.rate_per_mille}/1,000)` : "Normal premium", value: r(normal) },
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

export default function MobilePreview() {
  const [screen, setScreen] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInsurer, setSelectedInsurer] = useState(null);
  const [form, setForm] = useState({});
  const [quote, setQuote] = useState(null);
  const [docs, setDocs] = useState({});
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "processing" | "success"
  const [usdRateInfo, setUsdRateInfo] = useState({ status: "idle", rate: null, date: null, currency: null });

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
    setScreen("insurers");
  }

  function chooseInsurer(insurer) {
    setSelectedInsurer(insurer);
    setForm(selectedProduct.defaults);
    setQuote(null);
    setDocs({});
    setPaymentStatus(null);
    setScreen("product");
    if (selectedProduct.rateStructureType === "usd_base") {
      // Travel plans are all USD-denominated today; pass a different ISO3
      // here if a future product prices in another currency (EUR, GBP, etc.)
      fetchNrbRate("USD", nrbRateFieldKey(selectedProduct) || "usd_rate");
    }
  }

  function pay(gateway) {
    setPaymentStatus("processing");
    setTimeout(() => setPaymentStatus("success"), 1000);
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
              onClick={() => setScreen(screen === "product" ? "insurers" : screen === "kyc" ? "product" : screen === "payment" ? "kyc" : "home")}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label="Back"
            >
              <ArrowLeft size={20} color={colors.mossDeep} />
            </button>
          )}
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, color: colors.mossDeep, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {screen === "home" ? "Suraksha" : screen === "insurers" ? selectedProduct?.name : screen === "kyc" ? "Documents" : screen === "payment" ? "Payment" : `${selectedProduct?.name} — ${selectedInsurer?.name}`}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, fontFamily: "-apple-system, sans-serif" }}>
          {screen === "home" && (
            <>
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

          {screen === "insurers" && selectedProduct && (
            <>
              <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>Compare insurers for this cover.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {INSURERS.map((ins) => {
                  const preview = calc(selectedProduct, ins.factor, selectedProduct.defaults);
                  return (
                    <div
                      key={ins.id}
                      onClick={() => chooseInsurer(ins)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{ins.name}</div>
                        <div style={{ fontSize: 11, color: colors.slate, marginTop: 2 }}>From Rs. {preview.net.toLocaleString()}</div>
                      </div>
                      <ChevronRight size={18} color={colors.slate} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {screen === "product" && selectedProduct && (
            <>
              {selectedProduct.fields.map((field) => {
                if (field.key === "fx_rate" && form.invoice_currency === "NPR") return null; // no FX conversion needed for a NPR invoice
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

              <button style={buttonStyle} onClick={() => setQuote(calc(selectedProduct, selectedInsurer.factor, form))}>Get quote</button>

              {quote && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Estimated premium</p>
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
                  <button style={{ ...buttonStyle, marginTop: 14 }} onClick={() => setScreen("kyc")}>Continue to buy</button>
                </div>
              )}
            </>
          )}

          {screen === "kyc" && selectedProduct && (
            <>
              <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>Upload these documents before you can pay.</p>
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
                style={{ ...buttonStyle, marginTop: 16, opacity: selectedProduct.docsRequired.every((d) => docs[d.key]) ? 1 : 0.5 }}
                disabled={!selectedProduct.docsRequired.every((d) => docs[d.key])}
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
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Payment received</p>
                  <p style={{ fontSize: 13, color: colors.slate, marginBottom: 4 }}>Rs. {quote?.net.toLocaleString()} paid for {selectedProduct?.name}</p>
                  <p style={{ fontSize: 12, color: colors.slate }}>Policy number: SICL-MC-2026-00417</p>
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
