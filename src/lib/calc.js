import { RATE_TABLES } from "../data/rateTables.js";

export const r = (n) => Math.round(n * 100) / 100;

// Shared by travel-1 (USD) and schengen-1 (EUR): both price a trip length in
// days off the same day-band table shape. Trips over 180 days (only possible
// for travel-1 — schengen-1's UI caps at 180) use rating note 5: the 180-day
// rate plus the rate for the days beyond 180.
export function dayBandPremium(dayBands, ageRow, days) {
  const lookup = (d) => {
    const band = dayBands.find((b) => d <= b.max_days) || dayBands[dayBands.length - 1];
    return ageRow[band.key];
  };
  if (days <= 180) return lookup(days);
  return ageRow["148-180"] + lookup(Math.min(days - 180, 180));
}

export function calc(product, factor, v) {
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
    const planTable = rt.plans[v.plan];
    const table = planTable.single || planTable[v.cover_type] || planTable.package;
    const lookupBand = v.age_band === "71-79" || v.age_band === "80-84" ? "61-70" : v.age_band;
    const loading = rt.age_loading_multiplier[v.age_band] || 1;
    const usd = dayBandPremium(rt.day_bands, table[lookupBand], Number(v.days || 0)) * loading * factor;
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
    const eur = dayBandPremium(rt.day_bands, rt.age_bands[v.age_band], Number(v.days || 0)) * factor;
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
export function nrbRateFieldKey(product) {
  return product.fields.find((f) => f.key === "usd_rate" || f.key === "fx_rate")?.key;
}
