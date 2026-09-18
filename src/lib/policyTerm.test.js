import { describe, it, expect } from "vitest";
import { PRODUCTS } from "../data/products.js";
import {
  daysUntilExpiry, policyStatus, policyTerm, renewalStart, termKindFor, termLabel,
  TERM_ANNUAL, TERM_TRIP, TERM_SINGLE_TRANSIT,
} from "./policyTerm.js";

const product = (id) => PRODUCTS.find((p) => p.id === id);
const on = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`);

describe("term kind", () => {
  it("treats travel and Schengen as trip-length cover", () => {
    expect(termKindFor(product("travel-1"))).toBe(TERM_TRIP);
    expect(termKindFor(product("schengen-1"))).toBe(TERM_TRIP);
  });

  it("treats marine transit as a single voyage, not a period", () => {
    expect(termKindFor(product("marine-1"))).toBe(TERM_SINGLE_TRANSIT);
  });

  it("treats everything else as annual", () => {
    ["motor-1", "private-car-1", "health-1", "pa-1", "property-1", "aviation-1", "cash-1"]
      .forEach((id) => expect(termKindFor(product(id)), id).toBe(TERM_ANNUAL));
  });
});

describe("policy term", () => {
  it("runs an annual policy to the day before its anniversary", () => {
    const term = policyTerm(product("motor-1"), {}, "2026-09-18T10:30:00.000Z");
    expect(term.startDate).toBe("2026-09-18");
    expect(term.expiryDate).toBe("2027-09-17");
  });

  it("handles a leap-year inception without slipping a day", () => {
    const term = policyTerm(product("motor-1"), {}, "2028-02-29T00:00:00.000Z");
    expect(term.startDate).toBe("2028-02-29");
    expect(term.expiryDate).toBe("2029-02-28");
  });

  it("makes a travel policy last exactly the trip it quoted", () => {
    // A 10-day trip starting on the 18th is covered through the 27th, not the
    // 28th — the first day counts.
    const term = policyTerm(product("travel-1"), { days: 10 }, "2026-09-18T00:00:00.000Z");
    expect(term.kind).toBe(TERM_TRIP);
    expect(term.expiryDate).toBe("2026-09-27");
    expect(term.days).toBe(10);
  });

  it("gives a one-day trip a same-day expiry", () => {
    const term = policyTerm(product("travel-1"), { days: 1 }, "2026-09-18T00:00:00.000Z");
    expect(term.expiryDate).toBe("2026-09-18");
  });

  it("gives marine transit no expiry date at all", () => {
    const term = policyTerm(product("marine-1"), {}, "2026-09-18T00:00:00.000Z");
    expect(term.kind).toBe(TERM_SINGLE_TRANSIT);
    expect(term.expiryDate).toBeNull();
    expect(termLabel(term)).toContain("despatch");
  });

  it("pins the start to the calendar day, whatever time of day it was bought", () => {
    const early = policyTerm(product("motor-1"), {}, "2026-09-18T00:00:01.000Z");
    const late = policyTerm(product("motor-1"), {}, "2026-09-18T23:59:59.000Z");
    expect(early).toEqual(late);
  });
});

describe("expiry and status", () => {
  const term = policyTerm(product("motor-1"), {}, "2026-01-10T00:00:00.000Z"); // expires 2027-01-09

  it("counts the last day of cover as still covered", () => {
    expect(daysUntilExpiry(term.expiryDate, on("2027-01-09"))).toBe(0);
    expect(policyStatus(term, on("2027-01-09")).state).toBe("expiring");
  });

  it("flags the 30-day renewal-notice window", () => {
    expect(policyStatus(term, on("2026-12-11")).state).toBe("expiring");
    expect(policyStatus(term, on("2026-12-09")).state).toBe("active");
  });

  it("reports how long ago a lapsed policy expired", () => {
    const status = policyStatus(term, on("2027-01-19"));
    expect(status.state).toBe("expired");
    expect(status.days).toBe(-10);
    expect(status.label).toBe("Expired 10 days ago");
  });

  it("has no expiry status to report for a single transit", () => {
    const transit = policyTerm(product("marine-1"), {}, "2026-01-10T00:00:00.000Z");
    expect(policyStatus(transit).state).toBe("transit");
  });
});

describe("renewal start date", () => {
  const prior = policyTerm(product("motor-1"), {}, "2026-01-10T00:00:00.000Z"); // expires 2027-01-09

  it("continues cover from the day after the old policy ends", () => {
    // Renewing two weeks early must not start cover today — that would either
    // overlap the old policy or throw away the fortnight already paid for.
    const { startIso, gapDays } = renewalStart(prior, on("2026-12-26"));
    expect(startIso.slice(0, 10)).toBe("2027-01-10");
    expect(gapDays).toBe(0);
  });

  it("renews on the expiry day itself without a gap", () => {
    const { startIso, gapDays } = renewalStart(prior, on("2027-01-09"));
    expect(startIso.slice(0, 10)).toBe("2027-01-10");
    expect(gapDays).toBe(0);
  });

  it("starts today and reports the uninsured gap when the policy has lapsed", () => {
    const { startIso, gapDays } = renewalStart(prior, on("2027-01-20"));
    expect(startIso.slice(0, 10)).toBe("2027-01-20");
    expect(gapDays).toBe(10);
  });

  it("starts today when there is no prior term on file", () => {
    const { startIso, gapDays } = renewalStart(null, on("2027-01-20"));
    expect(startIso.slice(0, 10)).toBe("2027-01-20");
    expect(gapDays).toBe(0);
  });
});
