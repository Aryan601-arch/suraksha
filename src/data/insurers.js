// All 14 non-life insurers currently licensed by the Nepal Insurance
// Authority (as of May 2026) — this list itself is real. The pricing
// "factor" on each is still an invented placeholder for demo purposes only.
// `code` is the short prefix that goes at the front of a policy number issued
// by that insurer. Policy numbers used to be hardcoded "SICL-" for all 14,
// so a policy bought from Oriental came back numbered as if Shikhar had
// issued it. These are plain abbreviations of each company's name for the
// prototype, not official Nepal Insurance Authority registry codes.
export const INSURERS = [
  { id: "nepal-insurance", code: "NICL", name: "Nepal Insurance Company", factor: 1.02 },
  { id: "oriental", code: "OICN", name: "The Oriental Insurance Company", factor: 0.97 },
  { id: "national", code: "NATL", name: "National Insurance Company", factor: 1.05 },
  { id: "himalayan-everest", code: "HEIL", name: "Himalayan Everest Insurance", factor: 0.95 },
  { id: "united-ajod", code: "UAIL", name: "United Ajod Insurance", factor: 0.99 },
  { id: "neco", code: "NECO", name: "Neco Insurance", factor: 1.03 },
  { id: "sagarmatha", code: "SLIC", name: "Sagarmatha Lumbini Insurance", factor: 1.07 },
  { id: "prabhu", code: "PRIN", name: "Prabhu Insurance", factor: 0.96 },
  { id: "igi-prudential", code: "IGIP", name: "IGI Prudential Insurance", factor: 1.01 },
  { id: "shikhar", code: "SICL", name: "Shikhar Insurance", factor: 1.0 },
  { id: "nlg", code: "NLGI", name: "NLG Insurance", factor: 0.93 },
  { id: "siddhartha-premier", code: "SPIL", name: "Siddhartha Premier Insurance", factor: 0.98 },
  { id: "rastriya-beema", code: "RBCL", name: "Rastriya Beema Company", factor: 1.04 },
  { id: "sanima-gic", code: "SGIC", name: "Sanima GIC Insurance", factor: 0.94 },
];
