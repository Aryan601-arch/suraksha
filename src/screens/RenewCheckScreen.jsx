import { colors, buttonStyle, secondaryButtonStyle } from "../theme.js";
import { formatFieldValue, isHiddenField, npr } from "../lib/format.js";
import { formatDate, policyStatus, termLabel } from "../lib/policyTerm.js";

function Row({ label, value, strong = true }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: colors.slate, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 400, color: colors.ink, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function RenewCheckScreen({ product, insurer, form, insuredName, renewalContext, onRenewUnchanged, onRenewWithChanges }) {
  const priorStatus = policyStatus(renewalContext.priorTerm);
  const { gapDays } = renewalContext.renewal;

  return (
    <>
      <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "0 0 4px" }}>Details check</p>
      <p style={{ fontSize: 12, color: colors.slate, margin: "0 0 14px" }}>
        Here's what's on file for policy {renewalContext.originalPolicyNumber}. Let us know if anything's changed before we renew it.
      </p>

      <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
        <Row label="Insurer" value={insurer.name} />
        <Row label="Product" value={product.name} />
        <Row label="Policyholder" value={insuredName} />
        <Row
          label="Purchased on"
          value={new Date(renewalContext.purchaseDate).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        />
        {renewalContext.priorTerm?.expiryDate && (
          <Row
            label="Current cover ends"
            // "Active until <date>" already carries the date, so only the
            // expiring/expired wording is worth appending to it.
            value={priorStatus.state === "active" ? formatDate(renewalContext.priorTerm.expiryDate) : `${formatDate(renewalContext.priorTerm.expiryDate)} · ${priorStatus.label}`}
          />
        )}
        <Row label="Last premium paid" value={npr(renewalContext.priorNet)} />

        <div style={{ borderTop: `1px solid ${colors.line}`, margin: "8px 0" }} />
        {product.fields.map((field) => {
          if (field.key === "usd_rate" || field.key === "fx_rate") return null; // live rate, not a "detail" to confirm
          if (isHiddenField(field, form)) return null;
          if (form[field.key] === undefined) return null;
          return (
            <div key={field.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "3px 0" }}>
              <span style={{ color: colors.slate, flexShrink: 0 }}>{field.label}</span>
              <span style={{ color: colors.ink, textAlign: "right" }}>{formatFieldValue(field, form[field.key])}</span>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#e9efe9", border: "1px solid #cfe0d4", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors.mossDeep, margin: "0 0 2px" }}>New period of insurance</p>
        <p style={{ fontSize: 12, color: colors.slate, margin: 0 }}>{termLabel(renewalContext.newTerm)}</p>
        {/* Renewing late leaves a stretch with no cover on it. That is the one
            thing a renewal screen owes the customer, so it is stated rather
            than quietly absorbed into a new start date. */}
        {gapDays > 0 && (
          <p style={{ fontSize: 11.5, color: "#8a5a12", margin: "6px 0 0" }}>
            The old policy lapsed {gapDays} day{gapDays === 1 ? "" : "s"} ago. The new cover starts today — that gap stays uninsured.
          </p>
        )}
      </div>

      <button style={buttonStyle} onClick={onRenewUnchanged}>Nothing's changed — renew</button>
      <button style={{ ...secondaryButtonStyle, marginTop: 8 }} onClick={onRenewWithChanges}>
        Something's changed — update details
      </button>
    </>
  );
}
