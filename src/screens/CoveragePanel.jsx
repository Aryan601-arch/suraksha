import { ChevronRight } from "lucide-react";
import { colors } from "../theme.js";

// The claim-side "what's covered" panel.
//
// It used to require the full shape — benefits, a permanent-total table, a
// permanent-partial table, riders and exclusions — so a product could only
// have a panel if all five existed. Every section is now optional and rendered
// only when the schedule actually carries it, which is what lets a schedule be
// added from whatever part of a policy wording is genuinely to hand instead of
// waiting until all of it is.
//
// A product with no schedule at all now says so, rather than showing nothing.
// A buyer reading a premium with no statement of what it pays for should be
// told that the cover terms aren't loaded, not left to assume the silence
// means something.
export default function CoveragePanel({ coverage, openSection, onToggleSection }) {
  if (!coverage) {
    return (
      <div style={{ marginBottom: 16, background: colors.card, border: `1px dashed ${colors.line}`, borderRadius: 10, padding: "12px 14px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 4px" }}>
          What's covered
        </p>
        <p style={{ fontSize: 12, color: colors.slate, margin: 0 }}>
          The benefit schedule for this product isn't loaded yet, so this quote prices the cover without stating what it pays out.
          Ask the insurer for the policy wording before you buy.
        </p>
      </div>
    );
  }

  const sectionToggle = (key, title, source) => (
    <button
      onClick={() => onToggleSection(openSection === key ? null : key)}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left" }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>
        {title} {source && <span style={{ fontWeight: 400, color: colors.slate }}>({source})</span>}
      </span>
      <ChevronRight size={14} color={colors.slate} style={{ transform: openSection === key ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
    </button>
  );

  const payoutRows = (table) =>
    table.rows.map((row, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.slate, padding: "2px 0" }}>
        <span style={{ flex: 1, paddingRight: 8 }}>{row.label}</span>
        <span style={{ fontWeight: 700, color: colors.ink }}>{typeof row.pct === "number" ? `${row.pct}%` : row.pct}</span>
      </div>
    ));

  const disabilityTables = [coverage.permanentTotal, coverage.permanentPartial].filter(Boolean);

  return (
    <div style={{ marginBottom: 16, background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: colors.moss, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 8px" }}>
        What's covered — {coverage.sourceLabel}
      </p>

      {coverage.indicative && (
        <p style={{ fontSize: 11.5, color: "#8a5a12", background: "#fff3d6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "6px 8px", margin: "0 0 8px" }}>
          Indicative only — this schedule has not been checked against a filed policy wording.
        </p>
      )}

      {(coverage.benefits || []).map((b, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: colors.ink, fontWeight: 600 }}>
            <span>{b.label}</span>
            {b.source && <span style={{ color: colors.slate, fontWeight: 400 }}>{b.source}</span>}
          </div>
          <div style={{ fontSize: 12, color: colors.slate }}>{b.detail}</div>
        </div>
      ))}

      {coverage.minClaim != null && (
        <p style={{ fontSize: 11.5, color: colors.slate, margin: "6px 0 4px" }}>
          Minimum claim: Rs {coverage.minClaim.toLocaleString()} — smaller claims aren't payable under this policy (Sec. 22).
        </p>
      )}
      {coverage.eligibilityNote && (
        <p style={{ fontSize: 11.5, color: colors.slate, margin: "6px 0 4px" }}>{coverage.eligibilityNote}</p>
      )}

      {disabilityTables.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.line}`, marginTop: 6 }}>
          {sectionToggle("disability", "Disability payout schedule", disabilityTables.map((t) => t.source).filter(Boolean).join(" / "))}
          {openSection === "disability" && (
            <div style={{ paddingBottom: 8 }}>
              {disabilityTables.map((table, i) => (
                <div key={i}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: colors.ink, margin: i === 0 ? "4px 0" : "8px 0 4px" }}>{table.title}</p>
                  {payoutRows(table)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {coverage.riders && (
        <div style={{ borderTop: `1px solid ${colors.line}` }}>
          {sectionToggle("riders", coverage.riders.title, coverage.riders.source)}
          {openSection === "riders" && (
            <div style={{ paddingBottom: 8 }}>
              {coverage.riders.rows.map((row, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: colors.ink, fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: 11.5, color: colors.slate }}>{row.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {coverage.exclusions && (
        <div style={{ borderTop: `1px solid ${colors.line}` }}>
          {sectionToggle("exclusions", coverage.exclusions.title, coverage.exclusions.source)}
          {openSection === "exclusions" && (
            <ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>
              {coverage.exclusions.rows.map((line, i) => (
                <li key={i} style={{ fontSize: 12, color: colors.slate, marginBottom: 3 }}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
