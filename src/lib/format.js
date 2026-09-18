// Renders a field's stored value the same way it's shown on the quote form —
// resolving an enum's stored `value` back to its display `label` — so the
// details check and the PDF read the same as what the customer picked, not the
// raw internal key (e.g. "worldwide_ex_us").
export function formatFieldValue(field, value) {
  if (field.type === "enum") return field.options.find((o) => o.value === value)?.label ?? value;
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "number") return Number(value).toLocaleString();
  return value;
}

// Fields the quote form itself hides, and which therefore shouldn't appear on a
// summary or in the PDF either: an FX rate on a NPR invoice converts nothing,
// and the SAARC travel plan has one combined table with no cover-type split.
export function isHiddenField(field, form) {
  if (field.key === "fx_rate" && form.invoice_currency === "NPR") return true;
  if (field.key === "cover_type" && form.plan === "saarc") return true;
  return false;
}

export function npr(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
}

// One format for "when was this policy taken", used on the details check, the
// payment receipt and the PDF, so the same policy reads the same everywhere.
// A record written before timestamps were stored has no date at all, hence the
// guard rather than an "Invalid Date" on screen.
export function formatPolicyTaken(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
