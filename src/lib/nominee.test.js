import { describe, it, expect } from "vitest";
import { EMPTY_NOMINEE, isNomineeComplete, nomineeRelationshipLabel } from "./nominee.js";

const nominee = (over = {}) => ({ ...EMPTY_NOMINEE, name: "Sunita Sharma", relationship: "spouse", contact: "9801234567", ...over });

describe("nominee relationship", () => {
  it("resolves a listed relationship to its label", () => {
    expect(nomineeRelationshipLabel(nominee({ relationship: "daughter" }))).toBe("Daughter");
  });

  it("uses the free-text relationship when 'other' is chosen", () => {
    expect(nomineeRelationshipLabel(nominee({ relationship: "other", relationshipOther: "Nephew" }))).toBe("Nephew");
  });

  it("treats a blank 'other' as no relationship at all", () => {
    expect(nomineeRelationshipLabel(nominee({ relationship: "other", relationshipOther: "   " }))).toBe("");
  });
});

describe("nominee completeness", () => {
  it("accepts a nominee with a name, a relationship and a reachable number", () => {
    expect(isNomineeComplete(nominee())).toBe(true);
  });

  it("rejects an empty nominee", () => {
    expect(isNomineeComplete(EMPTY_NOMINEE)).toBe(false);
    expect(isNomineeComplete(null)).toBe(false);
  });

  it("rejects a name that is only whitespace", () => {
    expect(isNomineeComplete(nominee({ name: "   " }))).toBe(false);
  });

  it("rejects a relationship of 'other' with nothing specified", () => {
    expect(isNomineeComplete(nominee({ relationship: "other", relationshipOther: "" }))).toBe(false);
    expect(isNomineeComplete(nominee({ relationship: "other", relationshipOther: "Guardian" }))).toBe(true);
  });

  it("rejects a contact number too short to call", () => {
    // A nominee nobody can reach is no better than no nominee.
    expect(isNomineeComplete(nominee({ contact: "98012" }))).toBe(false);
  });

  it("counts digits, not formatting, in the contact number", () => {
    expect(isNomineeComplete(nominee({ contact: "+977 980-123-4567" }))).toBe(true);
    expect(isNomineeComplete(nominee({ contact: "---------------" }))).toBe(false);
  });
});
