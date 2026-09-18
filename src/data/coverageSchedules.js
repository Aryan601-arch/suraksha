// Claim-side benefit schedule, keyed by product category (or a product's own
// coverageKey, when more than one product in a category needs its own
// schedule) — separate from RATE_TABLES, which only prices the premium.
export const COVERAGE_SCHEDULES = {
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
