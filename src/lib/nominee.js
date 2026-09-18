// Nepali personal accident proposal forms (LIC Nepal's proposal form, and the
// Beema Samiti Accident Insurance Directive 2078) require a named nominee and
// their relationship to the insured — someone the claim can be paid to when
// the insured can't collect it. "Other" carries the free-text relationship
// those paper forms allow (in-law, guardian, and so on).
export const NOMINEE_RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "other", label: "Other" },
];

export const EMPTY_NOMINEE = { name: "", relationship: "", relationshipOther: "", contact: "" };

export function nomineeRelationshipLabel(nominee) {
  if (!nominee) return "";
  if (nominee.relationship === "other") return (nominee.relationshipOther || "").trim();
  return NOMINEE_RELATIONSHIPS.find((r) => r.value === nominee.relationship)?.label ?? "";
}

// Name, relationship and a contact number are all required before a proposal
// can be submitted — a nominee nobody can reach is no better than no nominee.
export function isNomineeComplete(nominee) {
  if (!nominee) return false;
  const digits = (nominee.contact || "").replace(/\D/g, "");
  return Boolean((nominee.name || "").trim()) && Boolean(nomineeRelationshipLabel(nominee)) && digits.length >= 7;
}
