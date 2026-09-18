import { colors, inputStyle } from "../theme.js";
import { NOMINEE_RELATIONSHIPS } from "../lib/nominee.js";

// Shared by the proposal (Documents screen) and by the renewal details check,
// which has to collect a nominee for policies stored before this field existed.
export default function NomineeFields({ nominee, onChange }) {
  const set = (patch) => onChange({ ...nominee, ...patch });
  const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 };
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nominee's full name</label>
        <input type="text" value={nominee.name} onChange={(e) => set({ name: e.target.value })} style={inputStyle} placeholder="e.g. Sunita Sharma" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Relationship to the insured</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {NOMINEE_RELATIONSHIPS.map((rel) => (
            <button
              key={rel.value}
              onClick={() => set({ relationship: rel.value, relationshipOther: rel.value === "other" ? nominee.relationshipOther : "" })}
              style={{ border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: nominee.relationship === rel.value ? colors.moss : colors.card, color: nominee.relationship === rel.value ? colors.paper : colors.mossDeep }}
            >
              {rel.label}
            </button>
          ))}
        </div>
      </div>
      {nominee.relationship === "other" && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Relationship (please specify)</label>
          <input type="text" value={nominee.relationshipOther} onChange={(e) => set({ relationshipOther: e.target.value })} style={inputStyle} placeholder="e.g. Nephew" />
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nominee's contact number</label>
        <input type="tel" inputMode="tel" value={nominee.contact} onChange={(e) => set({ contact: e.target.value })} style={inputStyle} placeholder="e.g. 9801234567" />
      </div>
    </>
  );
}
