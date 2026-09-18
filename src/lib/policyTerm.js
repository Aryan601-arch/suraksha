// How long a policy actually runs for.
//
// Until now every purchase stored only the moment it was paid for, which made
// "renew" a button you could press at any time with nothing to say about when
// cover started or stopped. Non-life cover in Nepal is not all annual, so the
// term is derived from the product rather than assumed:
//
//   - travel/Schengen: the trip itself. Cover attaches for the number of days
//     quoted, so a 10-day trip is a 10-day policy, not a 12-month one.
//   - marine transit: a single voyage. It attaches when the goods leave and
//     ends when they are delivered, so there is no calendar expiry date to
//     show and "renewal" is not a meaningful action on it.
//   - everything else: twelve months, the standard non-life period.
//
// Dates are handled as plain UTC calendar days. The app only ever shows a
// date, never a time-of-day, so pinning everything to midnight UTC avoids a
// policy appearing to expire a day early for a user east of GMT.

export const TERM_ANNUAL = "annual";
export const TERM_TRIP = "trip";
export const TERM_SINGLE_TRANSIT = "single_transit";

const DAY_MS = 24 * 60 * 60 * 1000;

export function termKindFor(product) {
  if (!product) return TERM_ANNUAL;
  if (product.rateStructureType === "marine_cargo") return TERM_SINGLE_TRANSIT;
  if (product.rateStructureType === "usd_base" || product.rateStructureType === "eur_base") return TERM_TRIP;
  return TERM_ANNUAL;
}

// Midnight UTC of the calendar day an ISO timestamp falls on.
function startOfDay(iso) {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function toIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// The last day of cover, inclusive. An annual policy incepting on 18 Sep 2026
// runs to 17 Sep 2027; a 10-day trip starting on the 18th ends on the 27th.
export function policyTerm(product, form, startIso) {
  const kind = termKindFor(product);
  const startMs = startOfDay(startIso);
  const startDate = toIsoDate(startMs);

  if (kind === TERM_SINGLE_TRANSIT) {
    return { kind, startDate, expiryDate: null, days: null };
  }

  if (kind === TERM_TRIP) {
    const days = Math.max(1, Math.round(Number(form?.days) || 1));
    return { kind, startDate, expiryDate: toIsoDate(startMs + (days - 1) * DAY_MS), days };
  }

  const d = new Date(startMs);
  const anniversary = Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate());
  return { kind, startDate, expiryDate: toIsoDate(anniversary - DAY_MS), days: null };
}

// Whole days from `today` until the last day of cover. 0 means it expires
// today (still covered); negative means it has already lapsed.
export function daysUntilExpiry(expiryDate, today = new Date()) {
  if (!expiryDate) return null;
  return Math.round((startOfDay(expiryDate) - startOfDay(today.toISOString())) / DAY_MS);
}

// "expiring" is the 30-day window in which an insurer would normally send a
// renewal notice — the one moment this app has something useful to say.
export function policyStatus(term, today = new Date()) {
  if (!term || term.kind === TERM_SINGLE_TRANSIT) return { state: "transit", label: "Single transit", days: null };
  const days = daysUntilExpiry(term.expiryDate, today);
  if (days == null) return { state: "unknown", label: "No expiry on file", days: null };
  if (days < 0) return { state: "expired", label: days === -1 ? "Expired yesterday" : `Expired ${-days} days ago`, days };
  if (days === 0) return { state: "expiring", label: "Expires today", days };
  if (days <= 30) return { state: "expiring", label: days === 1 ? "Expires tomorrow" : `Expires in ${days} days`, days };
  return { state: "active", label: `Active until ${formatDate(term.expiryDate)}`, days };
}

// A renewal should continue the old cover rather than restart it. Renewing
// before expiry picks up the day after the old policy ends, so there is no
// double-covered overlap; renewing after it has lapsed can only start today,
// and the gap in between is real and worth showing rather than papering over.
export function renewalStart(priorTerm, today = new Date()) {
  const todayMs = startOfDay(today.toISOString());
  if (!priorTerm?.expiryDate) return { startIso: new Date(todayMs).toISOString(), gapDays: 0 };
  const dayAfterExpiry = startOfDay(priorTerm.expiryDate) + DAY_MS;
  if (dayAfterExpiry >= todayMs) return { startIso: new Date(dayAfterExpiry).toISOString(), gapDays: 0 };
  return { startIso: new Date(todayMs).toISOString(), gapDays: Math.round((todayMs - dayAfterExpiry) / DAY_MS) };
}

export function formatDate(isoDate) {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function termLabel(term) {
  if (!term) return "—";
  if (term.kind === TERM_SINGLE_TRANSIT) return "Single transit — cover runs from despatch to delivery";
  if (term.kind === TERM_TRIP) return `${term.days} day${term.days === 1 ? "" : "s"} · ${formatDate(term.startDate)} to ${formatDate(term.expiryDate)}`;
  return `12 months · ${formatDate(term.startDate)} to ${formatDate(term.expiryDate)}`;
}
