import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MAX_DOC_BYTES, docsForStorage, formatBytes, isAttached, validateDocFile } from "./documents.js";
import { listPolicyRecords, loadPolicyRecord, savePolicyRecord, POLICY_STORE_KEY } from "./policyStore.js";

const file = (over = {}) => ({ name: "citizenship.jpg", size: 120000, type: "image/jpeg", ...over });

describe("document validation", () => {
  it("accepts a photo", () => {
    const result = validateDocFile(file());
    expect(result.ok).toBe(true);
    expect(result.attachment.name).toBe("citizenship.jpg");
    expect(result.attachment.size).toBe(120000);
  });

  it("accepts a PDF", () => {
    expect(validateDocFile(file({ name: "bluebook.pdf", type: "application/pdf" })).ok).toBe(true);
  });

  it("rejects a file over the size limit", () => {
    const result = validateDocFile(file({ size: MAX_DOC_BYTES + 1 }));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("limit");
  });

  it("rejects an empty file", () => {
    expect(validateDocFile(file({ size: 0 })).ok).toBe(false);
  });

  it("rejects a document that isn't a photo or a PDF", () => {
    expect(validateDocFile(file({ name: "notes.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).ok).toBe(false);
  });

  it("accepts a phone photo whose type the browser didn't report", () => {
    // Safari hands over HEIC files with an empty type; rejecting those would
    // block the most common way a Nepali customer photographs a document.
    expect(validateDocFile(file({ name: "IMG_0421.HEIC", type: "" })).ok).toBe(true);
  });

  it("rejects an unknown extension with no type either", () => {
    expect(validateDocFile(file({ name: "scan.xyz", type: "" })).ok).toBe(false);
  });

  it("formats sizes the way a person reads them", () => {
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("what gets stored", () => {
  it("keeps the file's identity and drops its bytes", () => {
    const stored = docsForStorage({
      citizenship: { name: "c.jpg", size: 100, type: "image/jpeg", attachedAt: "2026-09-18T00:00:00.000Z", dataUrl: "data:image/jpeg;base64,AAAA" },
    });
    expect(stored.citizenship).toEqual({ name: "c.jpg", size: 100, type: "image/jpeg", attachedAt: "2026-09-18T00:00:00.000Z" });
    expect(stored.citizenship.dataUrl).toBeUndefined();
  });

  it("drops removed attachments", () => {
    expect(docsForStorage({ citizenship: null, passport: undefined })).toEqual({});
  });

  it("does not treat the old boolean flag as an attachment", () => {
    // Records written before uploads were real stored `{ citizenship: true }`.
    expect(isAttached(true)).toBe(false);
    expect(isAttached({ name: "c.jpg" })).toBe(true);
  });
});

describe("policy store", () => {
  const original = globalThis.localStorage;

  beforeEach(() => {
    let data = {};
    globalThis.localStorage = {
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => { data[k] = String(v); },
      removeItem: (k) => { delete data[k]; },
      clear: () => { data = {}; },
    };
  });

  afterEach(() => { globalThis.localStorage = original; });

  const record = (over = {}) => ({
    policyNumber: "OICN-MOTOR1-2026-11111",
    productId: "motor-1",
    insurerId: "oriental",
    form: {},
    insuredName: "Aarav Sharma",
    docs: {},
    quoteNet: 6117.25,
    purchaseDate: "2026-09-18T00:00:00.000Z",
    renewedFrom: null,
    ...over,
  });

  it("saves and reads a policy back by number", () => {
    expect(savePolicyRecord(record())).toBe(true);
    expect(loadPolicyRecord("OICN-MOTOR1-2026-11111").insuredName).toBe("Aarav Sharma");
  });

  it("ignores stray whitespace in a typed policy number", () => {
    savePolicyRecord(record());
    expect(loadPolicyRecord("  OICN-MOTOR1-2026-11111  ")).toBeTruthy();
  });

  it("returns nothing rather than throwing when storage is unavailable", () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(loadPolicyRecord("anything")).toBeNull();
    expect(listPolicyRecords()).toEqual([]);
    expect(savePolicyRecord(record())).toBe(false);
  });

  it("survives a corrupted store instead of taking the app down", () => {
    globalThis.localStorage.setItem(POLICY_STORE_KEY, "not json");
    expect(listPolicyRecords()).toEqual([]);
  });

  it("lists policies newest first", () => {
    savePolicyRecord(record({ policyNumber: "A", purchaseDate: "2026-01-01T00:00:00.000Z" }));
    savePolicyRecord(record({ policyNumber: "B", purchaseDate: "2026-06-01T00:00:00.000Z" }));
    expect(listPolicyRecords().map((p) => p.policyNumber)).toEqual(["B", "A"]);
  });

  it("marks a policy that has since been renewed, without hiding it", () => {
    // The old number is the one printed on the customer's old PDF, so it has to
    // stay findable — but offering "renew" on it again would issue a duplicate.
    savePolicyRecord(record({ policyNumber: "OLD", purchaseDate: "2026-01-01T00:00:00.000Z" }));
    savePolicyRecord(record({ policyNumber: "NEW", purchaseDate: "2027-01-01T00:00:00.000Z", renewedFrom: "OLD" }));
    const list = listPolicyRecords();
    expect(list.find((p) => p.policyNumber === "OLD").supersededBy).toBe("NEW");
    expect(list.find((p) => p.policyNumber === "NEW").supersededBy).toBeNull();
  });
});
