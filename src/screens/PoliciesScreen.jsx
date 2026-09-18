import { ChevronRight } from "lucide-react";
import { colors, buttonStyle } from "../theme.js";
import { PRODUCTS } from "../data/products.js";
import { INSURERS } from "../data/insurers.js";
import { formatDate, policyStatus, TERM_SINGLE_TRANSIT } from "../lib/policyTerm.js";
import { npr } from "../lib/format.js";

const STATUS_STYLE = {
  expired: { color: "#8a2b2b", background: "#fbe9e9", border: "1px solid #ecc6c6" },
  expiring: { color: "#8a5a12", background: "#fff3d6", border: "1px solid #e8d5a3" },
  active: { color: "#2f5d4f", background: "#e9efe9", border: "1px solid #cfe0d4" },
  transit: { color: "#4b5a56", background: "#f1efe6", border: "1px solid #ddd6c4" },
  unknown: { color: "#4b5a56", background: "#f1efe6", border: "1px solid #ddd6c4" },
};

// Everything the browser has on file, so renewal no longer depends on the
// customer remembering a policy number off a PDF they downloaded months ago.
export default function PoliciesScreen({ policies, onRenew, onLookup }) {
  if (policies.length === 0) {
    return (
      <>
        <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>No policies bought in this browser yet.</p>
        <button style={buttonStyle} onClick={onLookup}>Look one up by number</button>
      </>
    );
  }

  return (
    <>
      <p style={{ fontSize: 12, color: colors.slate, margin: "0 0 12px" }}>
        Policies bought in this browser. There's no shared account behind this app, so a policy bought on another device won't appear here.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {policies.map((p) => {
          const product = PRODUCTS.find((x) => x.id === p.productId);
          const insurer = INSURERS.find((x) => x.id === p.insurerId);
          const status = policyStatus(p.term);
          const chip = STATUS_STYLE[status.state] || STATUS_STYLE.unknown;
          const renewable = !!product && !!insurer && !p.supersededBy && p.term?.kind !== TERM_SINGLE_TRANSIT;
          return (
            <div key={p.policyNumber} style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{product?.name || p.productId}</div>
                  <div style={{ fontSize: 11.5, color: colors.slate, marginTop: 2 }}>{insurer?.name || p.insurerId}</div>
                </div>
                <span style={{ ...chip, fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {status.label}
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: colors.slate, marginTop: 8 }}>
                <div>{p.policyNumber}</div>
                {p.term?.kind !== TERM_SINGLE_TRANSIT && p.term?.expiryDate && (
                  <div>{formatDate(p.term.startDate)} to {formatDate(p.term.expiryDate)}</div>
                )}
                {p.quoteNet != null && <div>Premium paid: {npr(p.quoteNet)}</div>}
                {p.renewedFrom && <div>Renewed from {p.renewedFrom}</div>}
                {p.supersededBy && <div>Renewed as {p.supersededBy}</div>}
              </div>

              {renewable && (
                <button
                  onClick={() => onRenew(p)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 10, background: status.state === "active" ? colors.card : colors.moss, color: status.state === "active" ? colors.mossDeep : colors.paper, border: `1px solid ${colors.moss}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                >
                  {status.state === "expired" ? "Renew now" : status.state === "expiring" ? "Renew early" : "Renew"}
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button style={{ ...buttonStyle, marginTop: 14 }} onClick={onLookup}>Look up another policy by number</button>
    </>
  );
}
