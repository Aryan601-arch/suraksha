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
// had issued it (see lib/policyNumber.js). Plain abbreviations for the
// prototype, not official Nepal Insurance Authority registry codes.
//
// Claim ratios: BFIS Compare's non-life listings, read 18 Sep 2026
// (https://bfis.nepsetrading.com/en/insurance/non-life). Rastriya Beema and
// National Insurance publish none there, hence null.
export const INSURERS = [
  { id: "nepal-insurance", code: "NICL", name: "Nepal Insurance Company", claimRatio: 74 },
  { id: "oriental", code: "OICN", name: "The Oriental Insurance Company", claimRatio: 80.02 },
  { id: "national", code: "NATL", name: "National Insurance Company", claimRatio: null },
  { id: "himalayan-everest", code: "HEIL", name: "Himalayan Everest Insurance", claimRatio: 98.31 },
  { id: "united-ajod", code: "UAIL", name: "United Ajod Insurance", claimRatio: 65.87 },
  { id: "neco", code: "NECO", name: "Neco Insurance", claimRatio: 70 },
  { id: "sagarmatha", code: "SLIC", name: "Sagarmatha Lumbini Insurance", claimRatio: 78.14 },
  { id: "prabhu", code: "PRIN", name: "Prabhu Insurance", claimRatio: 85.84 },
  { id: "igi-prudential", code: "IGIP", name: "IGI Prudential Insurance", claimRatio: 62 },
  { id: "shikhar", code: "SICL", name: "Shikhar Insurance", claimRatio: 94 },
  { id: "nlg", code: "NLGI", name: "NLG Insurance", claimRatio: 69 },
  { id: "siddhartha-premier", code: "SPIL", name: "Siddhartha Premier Insurance", claimRatio: 89.94 },
  { id: "rastriya-beema", code: "RBCL", name: "Rastriya Beema Company", claimRatio: null },
  { id: "sanima-gic", code: "SGIC", name: "Sanima GIC Insurance", claimRatio: 63.3 },
];

export const ALL_INSURER_IDS = INSURERS.map((i) => i.id);
