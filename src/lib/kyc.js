// The proposer's own identity details — everything a Nepali non-life insurer
// records about the person buying, beyond the name this screen used to ask for
// on its own and the nominee in nominee.js.
//
// SOURCING. Read this before adding a "the directive requires" comment.
//
// The Nepal Insurance Authority's own directives could NOT be opened while
// this was written: nia.gov.np is unreachable from the sandbox, and the
// insurers' published KYC forms (Shikhar's, for one) are scanned images with
// no text layer. So nothing here is quoted from a directive, and nothing here
// should claim to be. What it is actually built from:
//
//   1. The field set on a real Nepali individual KYC form — Standard
//      Chartered Nepal's, https://www.sc.com/global/av/np-nepalese-individual-kyc-form.pdf
//      (read 18 Sep 2026). That is a bank's form, not an insurer's, but the
//      fields come from the same asset-laundering rules that bind both, and
//      it is the one complete Nepali KYC field list that could be read
//      first-hand. It asks for: permanent AND current address to ward and
//      tole, citizenship number with issuing district and date, passport,
//      PAN, family names (father, mother, grandfather, spouse), occupation
//      with employer and estimated annual income.
//   2. The Authority's National ID requirement — directed Ashadh 14 2081,
//      effective Magh 1 2081 — as reported by ICT Frame,
//      https://ictframe.com/life-insurance-nid-requirement-nia/ (read 18 Sep
//      2026). Secondary reporting, in a LIFE insurance context. Whether it
//      binds non-life is UNCONFIRMED, which is why `nid` is optional below
//      and the screen asks for it without blocking on it.
//
// Every judgement that a primary source would settle is marked UNCONFIRMED.
// If someone later opens the actual directive, this file is where the
// guesswork is, and it should shrink.

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

// Occupation drives the money-laundering risk view of a customer, so it is a
// chosen category rather than free text. "Foreign employment" is its own entry
// because remittance income is the common case in Nepal, not an edge case.
export const OCCUPATIONS = [
  { value: "salaried_private", label: "Salaried — private sector" },
  { value: "salaried_public", label: "Salaried — government or public body" },
  { value: "business", label: "Business or self-employed" },
  { value: "agriculture", label: "Agriculture" },
  { value: "foreign_employment", label: "Foreign employment" },
  { value: "student", label: "Student" },
  { value: "homemaker", label: "Homemaker" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

// Annual income in rupees, in the lakh/crore steps Nepali forms are written in
// rather than the millions a Western form would use.
export const INCOME_BANDS = [
  { value: "under_300000", label: "Up to Rs. 3 lakh" },
  { value: "300000_500000", label: "Rs. 3–5 lakh" },
  { value: "500000_1000000", label: "Rs. 5–10 lakh" },
  { value: "1000000_2500000", label: "Rs. 10–25 lakh" },
  { value: "2500000_10000000", label: "Rs. 25 lakh – 1 crore" },
  { value: "above_10000000", label: "Above Rs. 1 crore" },
];

export const EMPTY_ADDRESS = { province: "", district: "", municipality: "", ward: "", tole: "" };

export const EMPTY_KYC = {
  dob: "",
  gender: "",
  fatherName: "",
  grandfatherName: "",
  citizenshipNumber: "",
  citizenshipDistrict: "",
  citizenshipIssuedBs: "",
  nid: "",
  pan: "",
  mobile: "",
  email: "",
  occupation: "",
  occupationOther: "",
  incomeBand: "",
  pep: "",
  permanent: { ...EMPTY_ADDRESS },
  currentSameAsPermanent: true,
  current: { ...EMPTY_ADDRESS },
};

const digitsOf = (v) => String(v || "").replace(/\D/g, "");

// --- Individual field rules -------------------------------------------------
// Each returns an error string, or "" when the value is acceptable. They are
// deliberately lenient where the real-world format varies, and strict only
// where a wrong value would be a wrong record.

// Nepali mobile numbers are ten digits beginning 97 or 98 (NTC, Ncell and the
// rest all sit in that range); 96 is issued to some Smart Cell ranges, so it
// is accepted too. A landline is not enough — the insurer texts the policy.
export function mobileError(value) {
  const d = digitsOf(value);
  if (!d) return "Enter a mobile number.";
  if (d.length !== 10) return "A Nepali mobile number is 10 digits.";
  if (!/^9[678]/.test(d)) return "That doesn't look like a mobile number — it should start 96, 97 or 98.";
  return "";
}

// Nepal's PAN is nine digits. Optional on most lines here, so an empty value
// is fine; a wrong-length one is not.
export function panError(value, { required = false } = {}) {
  const d = digitsOf(value);
  if (!d) return required ? "Enter your PAN number." : "";
  if (d.length !== 9) return "A Nepal PAN number is 9 digits.";
  return "";
}

// The National ID number is 11 digits. UNCONFIRMED against the Authority's own
// directive (see the sourcing note above), so this never blocks a purchase —
// it only rejects a value that cannot be an NID at all.
export function nidError(value) {
  const d = digitsOf(value);
  if (!d) return "";
  if (d.length !== 11) return "A National ID number is 11 digits.";
  return "";
}

// Citizenship certificate numbers are NOT one format: older certificates carry
// a plain serial, newer ones a district-ward-year-serial string with dashes or
// slashes. Anything that validated one shape would reject real documents, so
// this only asks for something plausibly long enough.
export function citizenshipNumberError(value) {
  const v = String(value || "").trim();
  if (!v) return "Enter your citizenship number.";
  if (digitsOf(v).length < 4) return "That's too short to be a citizenship number.";
  return "";
}

// The issue date is printed on the certificate in Bikram Sambat, so it is
// captured as it is written there rather than silently converted. Accepts
// YYYY-MM-DD or YYYY/MM/DD. BS years here run 1990–2099, which covers every
// certificate a living proposer could hold.
export function citizenshipIssuedError(value) {
  const v = String(value || "").trim();
  if (!v) return "Enter the issue date shown on your citizenship.";
  const m = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return "Write the date as YYYY-MM-DD in Bikram Sambat, e.g. 2068-05-14.";
  const [, y, mo, d] = m.map(Number);
  if (y < 1990 || y > 2099) return "That Bikram Sambat year looks wrong.";
  if (mo < 1 || mo > 12) return "There's no such month.";
  if (d < 1 || d > 32) return "There's no such day.";
  return "";
}

export const MIN_PROPOSER_AGE = 18;

// Age is computed in AD because the rest of the app runs on AD dates, and the
// proposer must be an adult to enter the contract — a minor can be the life
// insured but cannot be the one buying.
export function ageOn(dobIso, onIso) {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  const on = onIso ? new Date(onIso) : new Date();
  if (Number.isNaN(dob.getTime()) || Number.isNaN(on.getTime())) return null;
  let age = on.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    on.getMonth() < dob.getMonth() ||
    (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function dobError(value, onIso) {
  if (!String(value || "").trim()) return "Enter your date of birth.";
  const age = ageOn(value, onIso);
  if (age === null) return "That isn't a date.";
  if (age < 0) return "That date is in the future.";
  if (age < MIN_PROPOSER_AGE) return `The person buying the policy has to be ${MIN_PROPOSER_AGE} or over.`;
  if (age > 120) return "That date of birth would make you over 120.";
  return "";
}

// Ward numbers start at 1. The largest metropolitan cities run to 35 wards, so
// anything above that is a typo rather than an address.
export const MAX_WARD = 35;

export function addressErrors(address, { label = "address" } = {}) {
  const a = address || {};
  const errors = {};
  if (!a.province) errors.province = "Choose a province.";
  if (!a.district) errors.district = "Choose a district.";
  if (!String(a.municipality || "").trim()) errors.municipality = "Enter the municipality or rural municipality.";
  const ward = digitsOf(a.ward);
  if (!ward) errors.ward = "Enter the ward number.";
  else if (Number(ward) < 1 || Number(ward) > MAX_WARD) errors.ward = `Ward numbers run from 1 to ${MAX_WARD}.`;
  errors._label = label;
  return errors;
}

export function isAddressComplete(address) {
  const e = addressErrors(address);
  return !["province", "district", "municipality", "ward"].some((k) => e[k]);
}

// --- Whole-form rules -------------------------------------------------------

export function occupationLabel(kyc) {
  if (!kyc) return "";
  if (kyc.occupation === "other") return String(kyc.occupationOther || "").trim();
  return OCCUPATIONS.find((o) => o.value === kyc.occupation)?.label ?? "";
}

export function incomeBandLabel(kyc) {
  return INCOME_BANDS.find((b) => b.value === kyc?.incomeBand)?.label ?? "";
}

export function genderLabel(kyc) {
  return GENDERS.find((g) => g.value === kyc?.gender)?.label ?? "";
}

// The address actually used for correspondence: the permanent one when the
// proposer said the two are the same, so callers never have to remember the
// toggle exists.
export function effectiveCurrentAddress(kyc) {
  if (!kyc) return { ...EMPTY_ADDRESS };
  return kyc.currentSameAsPermanent ? { ...kyc.permanent } : { ...kyc.current };
}

export function formatAddress(address, provinceName) {
  const a = address || {};
  const parts = [
    String(a.tole || "").trim(),
    String(a.municipality || "").trim() && `${String(a.municipality).trim()}${a.ward ? `-${digitsOf(a.ward)}` : ""}`,
    String(a.district || "").trim(),
    provinceName ? `${provinceName} Province` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

// `panRequired` is set by the product: the lines that already demand a PAN
// certificate as a document should not then leave the number itself blank.
export function kycErrors(kyc, { panRequired = false, onIso = null } = {}) {
  const k = kyc || EMPTY_KYC;
  const errors = {};
  const dob = dobError(k.dob, onIso);
  if (dob) errors.dob = dob;
  if (!k.gender) errors.gender = "Choose one.";
  if (!String(k.fatherName || "").trim()) errors.fatherName = "Enter your father's name.";
  if (!String(k.grandfatherName || "").trim()) errors.grandfatherName = "Enter your grandfather's name.";
  const cn = citizenshipNumberError(k.citizenshipNumber);
  if (cn) errors.citizenshipNumber = cn;
  if (!k.citizenshipDistrict) errors.citizenshipDistrict = "Choose the district that issued it.";
  const ci = citizenshipIssuedError(k.citizenshipIssuedBs);
  if (ci) errors.citizenshipIssuedBs = ci;
  const nid = nidError(k.nid);
  if (nid) errors.nid = nid;
  const pan = panError(k.pan, { required: panRequired });
  if (pan) errors.pan = pan;
  const mob = mobileError(k.mobile);
  if (mob) errors.mobile = mob;
  const email = String(k.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That doesn't look like an email address.";
  if (!occupationLabel(k)) errors.occupation = "Choose your occupation.";
  if (!k.incomeBand) errors.incomeBand = "Choose a band.";
  if (k.pep !== "yes" && k.pep !== "no") errors.pep = "Answer yes or no.";

  const perm = addressErrors(k.permanent);
  ["province", "district", "municipality", "ward"].forEach((f) => {
    if (perm[f]) errors[`permanent.${f}`] = perm[f];
  });
  if (!k.currentSameAsPermanent) {
    const cur = addressErrors(k.current);
    ["province", "district", "municipality", "ward"].forEach((f) => {
      if (cur[f]) errors[`current.${f}`] = cur[f];
    });
  }
  return errors;
}

export function isKycComplete(kyc, options) {
  return Object.keys(kycErrors(kyc, options)).length === 0;
}

// What gets persisted with the policy. The whole object, minus nothing — none
// of it is a file and none of it is large, so unlike the document uploads
// there is no quota reason to trim it. Kept as its own function so that the
// day this app grows a backend, the place to stop storing identity documents
// in a browser is one function, not a search.
export function kycForStorage(kyc) {
  const k = { ...EMPTY_KYC, ...(kyc || {}) };
  return {
    ...k,
    permanent: { ...EMPTY_ADDRESS, ...(k.permanent || {}) },
    current: { ...EMPTY_ADDRESS, ...(k.current || {}) },
  };
}
