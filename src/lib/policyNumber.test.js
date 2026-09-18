import { describe, it, expect } from "vitest";
import { makePolicyNumber, randomSerial } from "./policyNumber.js";
import { PRODUCTS } from "../data/products.js";
import { INSURERS } from "../data/insurers.js";

const product = (id) => PRODUCTS.find((p) => p.id === id);
const insurer = (id) => INSURERS.find((i) => i.id === id);
const issuedAt = new Date("2026-09-18T07:30:00.000Z");

describe("policy number", () => {
  it("carries the issuing insurer's own code, not a fixed prefix", () => {
    // The bug this replaces numbered every policy "SICL-", so a policy bought
    // from Oriental looked as though Shikhar had written it.
    expect(makePolicyNumber(product("motor-1"), insurer("oriental"), issuedAt, "71660")).toBe("OICN-MOTOR1-2026-71660");
    expect(makePolicyNumber(product("motor-1"), insurer("shikhar"), issuedAt, "71660")).toBe("SICL-MOTOR1-2026-71660");
  });

  it("gives every insurer a distinct prefix", () => {
    const codes = INSURERS.map((i) => i.code);
    expect(new Set(codes).size).toBe(INSURERS.length);
    codes.forEach((code) => expect(code, `${code} is not a 4-letter code`).toMatch(/^[A-Z]{4}$/));
  });

  it("shortens the product id and stamps the year of issue", () => {
    expect(makePolicyNumber(product("pa-individual-1"), insurer("nlg"), issuedAt, "12345")).toBe("NLGI-PAINDI-2026-12345");
    expect(makePolicyNumber(product("motor-1"), insurer("nlg"), new Date("2027-01-01T00:00:00.000Z"), "12345")).toContain("-2027-");
  });

  it("produces a five-digit serial", () => {
    for (let i = 0; i < 50; i++) expect(randomSerial()).toMatch(/^\d{5}$/);
  });

  it("gives every product in the catalogue a usable number", () => {
    PRODUCTS.forEach((p) => {
      const number = makePolicyNumber(p, insurer("neco"), issuedAt, "00001");
      expect(number, p.id).toMatch(/^NECO-[A-Z0-9]{1,6}-2026-00001$/);
    });
  });
});
