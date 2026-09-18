// There's no backend on this static site, so "looking up an existing policy"
// can only mean a policy bought previously in this same browser — persisted to
// localStorage at the moment of payment and read back either by policy number
// or as a list. Every access is wrapped: localStorage can throw (private
// browsing, blocked site data) and should degrade to "nothing on file" rather
// than crash the app.
export const POLICY_STORE_KEY = "suraksha_policies";

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(POLICY_STORE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

export function savePolicyRecord(record) {
  try {
    const all = readAll();
    all[record.policyNumber] = record;
    localStorage.setItem(POLICY_STORE_KEY, JSON.stringify(all));
  } catch (e) {
    // Best-effort only — a renewal lookup just won't find this policy later.
    // Worth not being silent about, since the quota is the likely cause and
    // the user has just paid for something they expect to be able to find.
    return false;
  }
  return true;
}

export function loadPolicyRecord(policyNumber) {
  return readAll()[String(policyNumber || "").trim()] || null;
}

// Newest purchase first. A policy that has been renewed is superseded by the
// renewal, so it is marked rather than dropped: the old number still appears
// on the customer's old PDF and they may well search for it.
export function listPolicyRecords() {
  const all = readAll();
  const renewedFrom = new Set(Object.values(all).map((p) => p.renewedFrom).filter(Boolean));
  return Object.values(all)
    .map((p) => ({ ...p, supersededBy: renewedFrom.has(p.policyNumber) ? findRenewalOf(all, p.policyNumber) : null }))
    .sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
}

function findRenewalOf(all, policyNumber) {
  return Object.values(all).find((p) => p.renewedFrom === policyNumber)?.policyNumber || null;
}
