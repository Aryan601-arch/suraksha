import { Check, ChevronRight } from "lucide-react";
import { colors, buttonStyle, secondaryButtonStyle } from "../theme.js";
import { formatPolicyTaken, npr } from "../lib/format.js";
import { formatDate, termLabel, TERM_SINGLE_TRANSIT } from "../lib/policyTerm.js";

const GATEWAYS = ["eSewa", "Khalti", "ConnectIPS"];

export default function PaymentScreen({ product, insurer, quote, term, policyNumber, issuedAt, paymentStatus, renewalContext, storeWarning, onPay, onDownloadPdf, onDone }) {
  if (paymentStatus === "success") {
    return (
      <div style={{ textAlign: "center", paddingTop: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e4efe9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Check size={26} color={colors.mossDeep} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{renewalContext ? "Policy renewed" : "Payment received"}</p>
        <p style={{ fontSize: 13, color: colors.slate, marginBottom: 4 }}>{npr(quote?.net)} paid for {product?.name}</p>
        <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Policy number: {policyNumber}</p>
        <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Taken from: {insurer?.name}</p>
        <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Taken on: {formatPolicyTaken(issuedAt)}</p>
        {term && term.kind !== TERM_SINGLE_TRANSIT ? (
          <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>
            Cover runs {formatDate(term.startDate)} to {formatDate(term.expiryDate)}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>{termLabel(term)}</p>
        )}
        {renewalContext && (
          <>
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Renewed from: {renewalContext.originalPolicyNumber}</p>
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Reinsurance: placed with the insurer's treaty reinsurer</p>
          </>
        )}
        {storeWarning && (
          <p style={{ fontSize: 11.5, color: "#8a5a12", background: "#fff3d6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "6px 8px", margin: "10px 0 0", textAlign: "left" }}>
            {storeWarning}
          </p>
        )}
        <div style={{ marginTop: 20 }}>
          <button style={buttonStyle} onClick={onDownloadPdf}>Download policy PDF</button>
          <button style={{ ...secondaryButtonStyle, marginTop: 8 }} onClick={onDone}>Back to my policies</button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "processing") {
    return <p style={{ fontSize: 13, color: colors.slate, textAlign: "center", paddingTop: 24 }}>Processing payment…</p>;
  }

  return (
    <>
      <div style={{ borderBottom: `1px solid ${colors.line}`, paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: colors.slate }}>Amount to pay</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.mossDeep, marginTop: 2 }}>{npr(quote?.net)}</div>
        <div style={{ fontSize: 11.5, color: colors.slate, marginTop: 6 }}>{termLabel(term)}</div>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, marginBottom: 8 }}>Choose a payment method</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {GATEWAYS.map((gw) => (
          <button
            key={gw}
            onClick={() => onPay(gw)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 700, color: colors.ink }}
          >
            {gw}
            <ChevronRight size={18} color={colors.slate} />
          </button>
        ))}
      </div>
    </>
  );
}
