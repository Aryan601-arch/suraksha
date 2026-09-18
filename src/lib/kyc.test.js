import { describe, it, expect } from "vitest";
import {
  EMPTY_KYC, MAX_WARD, MIN_PROPOSER_AGE,
  ageOn, addressErrors, citizenshipIssuedError, citizenshipNumberError, dobError,
  effectiveCurrentAddress, formatAddress, genderLabel, incomeBandLabel,
  isAddressComplete, isKycComplete, kycErrors, kycForStorage, mobileError,
  nidError, occupationLabel, panError,
} from "./kyc.js";
import { ALL_DISTRICTS, PROVINCES, districtsOf, provinceOfDistrict } from "../data/nepal.js";

const address = (over = {}) => ({
  province: "bagmati", district: "Kathmandu", municipality: "Kathmandu Metropolitan City",
  ward: "10", tole: "Thamel", ...over,
});

// A proposer born well before today, so the age rules don't drift with the clock.
const kyc = (over = {}) => ({
  ...EMPTY_KYC,
  dob: "1990-04-12",
  gender: "female",
  fatherName: "Ram Sharma",
  grandfatherName: "Hari Sharma",
  citizenshipNumber: "27-01-70-01234",
  citizenshipDistrict: "Kathmandu",
  citizenshipIssuedBs: "2068-05-14",
  mobile: "9801234567",
  occupation: "business",
  incomeBand: "500000_1000000",
  pep: "no",
  permanent: address(),
  ...over,
});

describe("Nepal's provinces and districts", () => {
  it("has all 77 districts across 7 provinces", () => {
    expect(PROVINCES).toHaveLength(7);
    expect(ALL_DISTRICTS).toHaveLength(77);
  });

  it("lists no district twice", () => {
    expect(new Set(ALL_DISTRICTS).size).toBe(77);
  });

  it("finds the districts of a province, and the province of a district", () => {
    expect(districtsOf("bagmati")).toContain("Kathmandu");
    expect(provinceOfDistrict("Kathmandu")).toBe("bagmati");
    expect(provinceOfDistrict("Nowhere")).toBe("");
  });

  it("keeps the districts split out of Nawalparasi and Rukum apart", () => {
    expect(provinceOfDistrict("Nawalpur")).toBe("gandaki");
    expect(provinceOfDistrict("Parasi")).toBe("lumbini");
    expect(provinceOfDistrict("Rukum East")).toBe("lumbini");
    expect(provinceOfDistrict("Rukum West")).toBe("karnali");
  });
});

describe("mobile number", () => {
  it("accepts a ten-digit Nepali mobile", () => {
    expect(mobileError("9801234567")).toBe("");
    expect(mobileError("9741234567")).toBe("");
    expect(mobileError("9601234567")).toBe("");
  });

  it("ignores spaces and dashes the way people type them", () => {
    expect(mobileError("980-123 4567")).toBe("");
  });

  it("rejects a landline, a short number and an empty one", () => {
    expect(mobileError("014123456")).not.toBe("");
    expect(mobileError("98012345")).not.toBe("");
    expect(mobileError("")).not.toBe("");
  });
});

describe("PAN and National ID", () => {
  it("lets PAN be blank unless the product demands it", () => {
    expect(panError("")).toBe("");
    expect(panError("", { required: true })).not.toBe("");
  });

  it("wants exactly nine digits when a PAN is given", () => {
    expect(panError("123456789")).toBe("");
    expect(panError("12345678")).not.toBe("");
  });

  // Optional on purpose: the Authority's National ID requirement could not be
  // read first-hand, so a missing NID never blocks a purchase.
  it("never blocks on a missing National ID, but rejects a malformed one", () => {
    expect(nidError("")).toBe("");
    expect(nidError("12345678901")).toBe("");
    expect(nidError("12345")).not.toBe("");
  });
});

describe("citizenship certificate", () => {
  it("accepts both the old serial and the newer dashed format", () => {
    expect(citizenshipNumberError("123456")).toBe("");
    expect(citizenshipNumberError("27-01-70-01234")).toBe("");
    expect(citizenshipNumberError("27/01/70/01234")).toBe("");
  });

  it("rejects an empty or implausibly short number", () => {
    expect(citizenshipNumberError("")).not.toBe("");
    expect(citizenshipNumberError("12")).not.toBe("");
  });

  it("reads the issue date as Bikram Sambat, not AD", () => {
    expect(citizenshipIssuedError("2068-05-14")).toBe("");
    expect(citizenshipIssuedError("2068/5/4")).toBe("");
    // 1985 BS predates the certificate itself; 2011 is a plausible AD year and
    // exactly the mistake this catches.
    expect(citizenshipIssuedError("1985-01-01")).not.toBe("");
    expect(citizenshipIssuedError("14-05-2068")).not.toBe("");
    expect(citizenshipIssuedError("")).not.toBe("");
  });
});

describe("age of the proposer", () => {
  it("counts a birthday that hasn't come round yet as the younger age", () => {
    expect(ageOn("1990-12-31", "2026-09-18")).toBe(35);
    expect(ageOn("1990-01-01", "2026-09-18")).toBe(36);
    expect(ageOn("1990-09-18", "2026-09-18")).toBe(36);
  });

  it("requires the buyer to be an adult", () => {
    expect(dobError("2020-01-01", "2026-09-18")).toContain(String(MIN_PROPOSER_AGE));
    expect(dobError("1990-04-12", "2026-09-18")).toBe("");
  });

  it("rejects a future date of birth and an impossible age", () => {
    expect(dobError("2030-01-01", "2026-09-18")).not.toBe("");
    expect(dobError("1880-01-01", "2026-09-18")).not.toBe("");
  });
});

describe("address", () => {
  it("accepts a complete address", () => {
    expect(isAddressComplete(address())).toBe(true);
  });

  it("needs province, district, municipality and ward — tole is optional", () => {
    expect(isAddressComplete(address({ tole: "" }))).toBe(true);
    expect(isAddressComplete(address({ province: "" }))).toBe(false);
    expect(isAddressComplete(address({ district: "" }))).toBe(false);
    expect(isAddressComplete(address({ municipality: "  " }))).toBe(false);
    expect(isAddressComplete(address({ ward: "" }))).toBe(false);
  });

  it("rejects a ward number no municipality has", () => {
    expect(addressErrors(address({ ward: "0" })).ward).not.toBeUndefined();
    expect(addressErrors(address({ ward: String(MAX_WARD + 1) })).ward).not.toBeUndefined();
    expect(addressErrors(address({ ward: String(MAX_WARD) })).ward).toBeUndefined();
  });

  it("writes an address the way a Nepali form does", () => {
    expect(formatAddress(address(), "Bagmati")).toBe(
      "Thamel, Kathmandu Metropolitan City-10, Kathmandu, Bagmati Province"
    );
  });

  it("leaves out the parts that weren't given", () => {
    expect(formatAddress({ district: "Kaski", municipality: "Pokhara", ward: "" }, "")).toBe("Pokhara, Kaski");
  });
});

describe("the current address toggle", () => {
  it("uses the permanent address when the two are the same", () => {
    const k = kyc({ currentSameAsPermanent: true, current: address({ district: "Kaski" }) });
    expect(effectiveCurrentAddress(k).district).toBe("Kathmandu");
  });

  it("uses the separate one when they differ", () => {
    const k = kyc({ currentSameAsPermanent: false, current: address({ district: "Kaski", province: "gandaki" }) });
    expect(effectiveCurrentAddress(k).district).toBe("Kaski");
  });

  it("only validates the current address when it is actually being used", () => {
    expect(isKycComplete(kyc({ currentSameAsPermanent: true, current: {} }))).toBe(true);
    expect(isKycComplete(kyc({ currentSameAsPermanent: false, current: {} }))).toBe(false);
  });
});

describe("labels", () => {
  it("resolves the chosen occupation, or the free-text one", () => {
    expect(occupationLabel(kyc())).toBe("Business or self-employed");
    expect(occupationLabel(kyc({ occupation: "other", occupationOther: "Potter" }))).toBe("Potter");
    expect(occupationLabel(kyc({ occupation: "other", occupationOther: "  " }))).toBe("");
  });

  it("resolves gender and income band", () => {
    expect(genderLabel(kyc())).toBe("Female");
    expect(incomeBandLabel(kyc())).toBe("Rs. 5–10 lakh");
  });
});

describe("the form as a whole", () => {
  it("accepts a fully filled proposal", () => {
    expect(isKycComplete(kyc())).toBe(true);
  });

  it("rejects an empty one", () => {
    expect(isKycComplete(EMPTY_KYC)).toBe(false);
    expect(isKycComplete(null)).toBe(false);
  });

  it("needs an answer to the politically-exposed-person question either way", () => {
    expect(isKycComplete(kyc({ pep: "" }))).toBe(false);
    expect(isKycComplete(kyc({ pep: "yes" }))).toBe(true);
    expect(isKycComplete(kyc({ pep: "no" }))).toBe(true);
  });

  it("wants the father's and grandfather's names, as a Nepali form does", () => {
    expect(kycErrors(kyc({ fatherName: "" })).fatherName).not.toBeUndefined();
    expect(kycErrors(kyc({ grandfatherName: " " })).grandfatherName).not.toBeUndefined();
  });

  it("demands a PAN number only on the products that demand the certificate", () => {
    expect(isKycComplete(kyc())).toBe(true);
    expect(isKycComplete(kyc(), { panRequired: true })).toBe(false);
    expect(isKycComplete(kyc({ pan: "123456789" }), { panRequired: true })).toBe(true);
  });

  it("treats email as optional but checks it when given", () => {
    expect(isKycComplete(kyc({ email: "" }))).toBe(true);
    expect(isKycComplete(kyc({ email: "aarav@example.com" }))).toBe(true);
    expect(isKycComplete(kyc({ email: "not-an-email" }))).toBe(false);
  });

  it("reports the permanent address fields under their own keys", () => {
    const errors = kycErrors(kyc({ permanent: address({ ward: "" }) }));
    expect(errors["permanent.ward"]).not.toBeUndefined();
    expect(errors["permanent.district"]).toBeUndefined();
  });
});

describe("what is kept with the policy", () => {
  it("fills in every field, so an old record read back has no holes", () => {
    const stored = kycForStorage({ mobile: "9801234567" });
    expect(stored.permanent).toEqual(EMPTY_KYC.permanent);
    expect(stored.gender).toBe("");
    expect(stored.mobile).toBe("9801234567");
  });

  it("survives a null", () => {
    expect(kycForStorage(null).dob).toBe("");
  });
});
