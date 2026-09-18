import { colors, inputStyle, buttonStyle } from "../theme.js";
import { npr, isHiddenField } from "../lib/format.js";
import { termLabel } from "../lib/policyTerm.js";
import CoveragePanel from "./CoveragePanel.jsx";

// Sensible starting invoice values per currency, so switching currency doesn't
// leave a NPR-sized number sitting in a USD field.
const DEFAULT_INVOICE_BY_CURRENCY = { NPR: 1000000, USD: 10000, EUR: 10000, INR: 800000, GBP: 8000, CNY: 70000 };

export default function ProductScreen({
  product, form, setForm, quote, onQuote, rateInfo, onFetchRate,
  coverage, coverageOpen, setCoverageOpen, renewalContext, onContinue, term,
}) {
  return (
    <>
      {renewalContext && (
        <div style={{ marginBottom: 14, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "10px 12px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: colors.ink, margin: 0 }}>Renewing policy {renewalContext.originalPolicyNumber}</p>
          <p style={{ fontSize: 11.5, color: colors.slate, margin: "2px 0 0" }}>Update whatever's changed, then get a fresh quote.</p>
        </div>
      )}

      <CoveragePanel coverage={coverage} openSection={coverageOpen} onToggleSection={setCoverageOpen} />

      {product.fields.map((field) => {
        if (isHiddenField(field, form)) return null;
        return (
          <div key={field.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>
              {field.key === "sum_insured" && form.invoice_currency ? `${field.label} (${form.invoice_currency})` : field.label}
            </label>
            {field.type === "number" && (field.key === "usd_rate" || field.key === "fx_rate") ? (
              <div>
                {rateInfo.status === "loading" && <p style={{ fontSize: 13, color: colors.slate }}>Fetching today's rate from NRB…</p>}
                {rateInfo.status === "success" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#e9efe9", borderRadius: 8, padding: "10px 12px" }}>
                    <span style={{ fontSize: 13, color: colors.mossDeep, fontWeight: 700 }}>
                      Rs. {rateInfo.rate.toFixed(2)} <span style={{ fontWeight: 400, color: colors.slate }}>({rateInfo.currency} sell rate, NRB {rateInfo.date})</span>
                    </span>
                    <button onClick={() => onFetchRate(rateInfo.currency, field.key)} style={{ background: "none", border: "none", color: colors.moss, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
                  </div>
                )}
                {rateInfo.status === "error" && (
                  <>
                    <p style={{ fontSize: 12, color: colors.slate, marginBottom: 6 }}>Couldn't fetch NRB's live rate — enter it manually.</p>
                    <input type="number" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })} style={inputStyle} />
                  </>
                )}
              </div>
            ) : field.type === "number" && (
              <input type="number" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })} style={inputStyle} />
            )}
            {field.type === "enum" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {field.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setForm({ ...form, [field.key]: opt.value });
                      if (field.key === "invoice_currency") {
                        if (opt.value === "NPR") {
                          setForm((f) => ({ ...f, invoice_currency: "NPR", fx_rate: 1, sum_insured: DEFAULT_INVOICE_BY_CURRENCY.NPR }));
                        } else {
                          setForm((f) => ({ ...f, sum_insured: DEFAULT_INVOICE_BY_CURRENCY[opt.value] }));
                          onFetchRate(opt.value, "fx_rate");
                        }
                      }
                    }}
                    style={{ border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: form[field.key] === opt.value ? colors.moss : colors.card, color: form[field.key] === opt.value ? colors.paper : colors.mossDeep }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {field.type === "text" && (
              <input type="text" value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} style={inputStyle} />
            )}
            {field.type === "boolean" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={!!form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} />
                Yes
              </label>
            )}
          </div>
        );
      })}

      <button style={buttonStyle} onClick={onQuote}>Get quote</button>

      {quote && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Estimated premium</p>
          {quote.rows.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
              <span>{row.label}</span>
              <span>{npr(row.value)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, fontWeight: 700, borderTop: `1px solid ${colors.line}`, marginTop: 6, paddingTop: 6 }}>
            <span>Net premium</span>
            <span>{npr(quote.net)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 12, color: colors.slate }}>
            <span>Period of insurance</span>
            <span style={{ textAlign: "right", maxWidth: "62%" }}>{termLabel(term)}</span>
          </div>
          <button style={{ ...buttonStyle, marginTop: 14 }} onClick={onContinue}>
            {renewalContext ? "Continue to payment" : "Continue to buy"}
          </button>
        </div>
      )}
    </>
  );
}
