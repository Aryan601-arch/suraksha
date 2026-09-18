// ---- Placeholder rate tables, one shape per rate_structure_type ----
export const RATE_TABLES = {
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
