import { colors, inputStyle, buttonStyle } from "../theme.js";
import { INSURERS } from "../data/insurers.js";

export default function RenewLookupScreen({ policyNumber, insurerId, error, onPolicyNumberChange, onInsurerChange, onFind }) {
  const canFind = policyNumber.trim() && insurerId;
  return (
    <>
      <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>
        Enter the policy number and insurer from your policy PDF to renew it.
      </p>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Insurance company</label>
        <select value={insurerId} onChange={(e) => onInsurerChange(e.target.value)} style={inputStyle}>
          <option value="">Select insurer</option>
          {INSURERS.map((ins) => (
            <option key={ins.id} value={ins.id}>{ins.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Policy number</label>
        <input
          type="text"
          value={policyNumber}
          onChange={(e) => onPolicyNumberChange(e.target.value)}
          style={inputStyle}
          placeholder="e.g. NICL-PAINDI-2026-71660"
        />
      </div>
      {error && <p style={{ fontSize: 12, color: "#a33", marginBottom: 12 }}>{error}</p>}
      <button style={{ ...buttonStyle, opacity: canFind ? 1 : 0.5 }} disabled={!canFind} onClick={onFind}>
        Find policy
      </button>
      <p style={{ fontSize: 11, color: colors.slate, marginTop: 14 }}>
        Renewal lookup only works for policies bought earlier in this same browser — this app has no shared account system behind it yet.
      </p>
    </>
  );
}
