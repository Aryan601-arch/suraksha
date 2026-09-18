import { jsPDF } from "jspdf";
import { colors, hexRgb } from "../theme.js";
import { formatFieldValue, formatPolicyTaken, isHiddenField } from "./format.js";
import { COVERAGE_SCHEDULES } from "../data/coverageSchedules.js";
import { formatDate, termLabel, TERM_SINGLE_TRANSIT } from "./policyTerm.js";
import { nomineeRelationshipLabel } from "./nominee.js";
import { effectiveCurrentAddress, formatAddress, genderLabel, incomeBandLabel, occupationLabel } from "./kyc.js";
import { PROVINCES } from "../data/nepal.js";
import { isIndicative, offerFor } from "./offers.js";

// Builds a cover-note PDF entirely client-side — there's no backend to generate
// or store this on, so it is generated fresh in the browser from the same
// product/form/quote state already on screen, and handed to the customer as an
// immediate download.
export function downloadPolicyPdf({ policyNumber, issuedAt, insurer, product, form, quote, insuredName, kyc, nominee, term, renewalContext, docs }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...hexRgb(colors.mossDeep));
  doc.text("Suraksha", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexRgb(colors.slate));
  doc.text("Insurance marketplace, Nepal", marginX, (y += 6));

  doc.setDrawColor(...hexRgb(colors.line));
  doc.line(marginX, (y += 4), pageWidth - marginX, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...hexRgb(colors.ink));
  doc.text(renewalContext ? "Renewal Cover Note / Policy Schedule" : "Cover Note / Policy Schedule", marginX, (y += 10));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...hexRgb(colors.ink));
  const headerRows = [
    ["Policy number", policyNumber || "—"],
    // The moment the policy was actually paid for, not the moment the PDF was
    // generated — a cover note downloaded later still has to say when cover
    // started.
    ["Issued on", formatPolicyTaken(issuedAt)],
    ["Insurer", insurer?.name || "—"],
    ["Product", product?.name || "—"],
    ["Policyholder", insuredName || "—"],
    // The period of insurance is the single most load-bearing line on a real
    // cover note — a schedule without it doesn't say what was bought.
    ["Period of insurance", termLabel(term)],
    ...(term && term.kind !== TERM_SINGLE_TRANSIT
      ? [["Cover starts", formatDate(term.startDate)], ["Cover ends", formatDate(term.expiryDate)]]
      : []),
    ...(renewalContext
      ? [
          ["Renewed from", renewalContext.originalPolicyNumber],
          ["Reinsurance", "Placed with the insurer's treaty reinsurer"],
        ]
      : []),
  ];
  y += 8;
  headerRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(value), pageWidth - marginX - 38 - marginX);
    doc.text(wrapped, marginX + 38, y);
    y += 6 + (wrapped.length - 1) * 5;
  });

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...hexRgb(colors.moss));
  doc.text("Cover details", marginX, (y += 6));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexRgb(colors.ink));
  product.fields.forEach((field) => {
    if (form[field.key] === undefined) return;
    if (isHiddenField(field, form)) return;
    doc.text(`${field.label}: ${formatFieldValue(field, form[field.key])}`, marginX, (y += 6));
  });

  // The proposer's own details. A cover note that names a policyholder but
  // cannot say which Aarav Sharma it means is not an identifying document, and
  // these are exactly the particulars a Nepali insurer records on the proposal.
  if (kyc) {
    if (y > 210) { doc.addPage(); y = 20; }
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    doc.text("Proposer", marginX, (y += 6));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexRgb(colors.ink));
    const provinceName = (id) => PROVINCES.find((p) => p.id === id)?.name || "";
    const dash = "\u2014";
    const permanent = formatAddress(kyc.permanent, provinceName(kyc.permanent?.province));
    const current = formatAddress(effectiveCurrentAddress(kyc), provinceName(effectiveCurrentAddress(kyc).province));
    [
      ["Date of birth", kyc.dob || dash],
      ["Gender", genderLabel(kyc) || dash],
      ["Father's name", (kyc.fatherName || "").trim() || dash],
      ["Grandfather's name", (kyc.grandfatherName || "").trim() || dash],
      ["Citizenship no.", [(kyc.citizenshipNumber || "").trim(), kyc.citizenshipDistrict && `issued in ${kyc.citizenshipDistrict}`, kyc.citizenshipIssuedBs && `on ${kyc.citizenshipIssuedBs} BS`].filter(Boolean).join(", ") || dash],
      ...(String(kyc.nid || "").trim() ? [["National ID", kyc.nid.trim()]] : []),
      ...(String(kyc.pan || "").trim() ? [["PAN", kyc.pan.trim()]] : []),
      ["Permanent address", permanent || dash],
      // Only worth a line of its own when it differs from the permanent one.
      ...(!kyc.currentSameAsPermanent && current && current !== permanent ? [["Current address", current]] : []),
      ["Mobile", (kyc.mobile || "").trim() || dash],
      ...(String(kyc.email || "").trim() ? [["Email", kyc.email.trim()]] : []),
      ["Occupation", occupationLabel(kyc) || dash],
      ["Annual income", incomeBandLabel(kyc) || dash],
      ["Politically exposed person", kyc.pep === "yes" ? "Yes" : kyc.pep === "no" ? "No" : dash],
    ].forEach(([label, value]) => {
      if (y > 272) { doc.addPage(); y = 20; }
      const wrapped = doc.splitTextToSize(`${label}: ${value}`, pageWidth - marginX * 2);
      doc.text(wrapped, marginX, (y += 6));
      y += (wrapped.length - 1) * 5;
    });
  }

  if (y > 240) { doc.addPage(); y = 20; }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...hexRgb(colors.moss));
  doc.text("Nominee", marginX, (y += 6));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexRgb(colors.ink));
  doc.text(`Name: ${(nominee?.name || "").trim() || "\u2014"}`, marginX, (y += 6));
  doc.text(`Relationship to the insured: ${nomineeRelationshipLabel(nominee) || "\u2014"}`, marginX, (y += 6));
  doc.text(`Contact: ${(nominee?.contact || "").trim() || "\u2014"}`, marginX, (y += 6));

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...hexRgb(colors.moss));
  doc.text("Premium breakdown", marginX, (y += 6));
  doc.setFontSize(10);
  (quote?.rows || []).forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hexRgb(colors.ink));
    doc.text(row.label, marginX, (y += 6));
    doc.text(`Rs. ${Number(row.value).toLocaleString()}`, pageWidth - marginX, y, { align: "right" });
  });
  doc.setDrawColor(...hexRgb(colors.line));
  doc.line(marginX, (y += 2), pageWidth - marginX, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Net premium", marginX, (y += 7));
  doc.text(`Rs. ${quote?.net.toLocaleString() ?? "—"}`, pageWidth - marginX, y, { align: "right" });

  // Which documents were submitted with the proposal, by name — so the
  // customer's copy records what they actually handed over.
  const attached = Object.entries(docs || {}).filter(([, att]) => att && att.name);
  if (attached.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    doc.text("Documents submitted", marginX, (y += 6));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...hexRgb(colors.ink));
    const labelFor = (key) => product.docsRequired.find((d) => d.key === key)?.label || key;
    attached.forEach(([key, att]) => {
      doc.text(`${labelFor(key)}: ${att.name}`, marginX, (y += 5));
    });
  }

  const cov = COVERAGE_SCHEDULES[product.coverageKey || product.category];
  if (cov) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...hexRgb(colors.moss));
    const wrappedHeading = doc.splitTextToSize(`What's covered — ${cov.sourceLabel}`, pageWidth - marginX * 2);
    doc.text(wrappedHeading, marginX, (y += 6));
    y += (wrappedHeading.length - 1) * 5;
    doc.setFontSize(9.5);
    cov.benefits.forEach((b) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...hexRgb(colors.ink));
      const wrappedLabel = doc.splitTextToSize(b.label, pageWidth - marginX * 2);
      doc.text(wrappedLabel, marginX, (y += 5));
      y += (wrappedLabel.length - 1) * 4.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...hexRgb(colors.slate));
      const wrappedDetail = doc.splitTextToSize(b.detail, pageWidth - marginX * 2);
      doc.text(wrappedDetail, marginX, (y += 4.5));
      y += (wrappedDetail.length - 1) * 4.5;
    });
  }

  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...hexRgb(colors.slate));
  const indicativePricing = isIndicative(product, offerFor(product, insurer));
  const disclaimer =
    "This cover note is generated by the Suraksha app at the moment of payment and confirms the cover selected and premium paid. Final policy issuance, endorsement, and claims remain subject to the insurer's own acceptance, underwriting, and terms." +
    (indicativePricing
      ? " The premium shown is indicative: this insurer prices this cover on request and no public rate table exists for it, so the figure is an estimate rather than a filed rate."
      : "");
  doc.text(doc.splitTextToSize(disclaimer, pageWidth - marginX * 2), marginX, 280);

  doc.save(`${policyNumber || "suraksha-policy"}.pdf`);
}
