import { ChevronRight, FileText } from "lucide-react";
import { colors } from "../theme.js";
import { CATEGORIES } from "../data/categories.js";

export default function HomeScreen({ products, activeCategory, onToggleCategory, onOpenProduct, onStartRenewal, onOpenPolicies, policyCount, expiringCount }) {
  return (
    <>
      <button
        onClick={onStartRenewal}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: colors.card, border: `1px solid ${colors.moss}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.mossDeep }}>Have a policy already? Renew it</span>
        <ChevronRight size={16} color={colors.moss} />
      </button>

      {policyCount > 0 && (
        <button
          onClick={onOpenPolicies}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 12, marginBottom: 16, cursor: "pointer" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} color={colors.moss} />
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.mossDeep }}>
              My policies ({policyCount})
            </span>
          </span>
          {expiringCount > 0 ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#8a5a12", background: "#fff3d6", border: "1px solid #e8d5a3", borderRadius: 999, padding: "2px 8px" }}>
              {expiringCount} need{expiringCount === 1 ? "s" : ""} renewing
            </span>
          ) : (
            <ChevronRight size={16} color={colors.slate} />
          )}
        </button>
      )}

      <p style={{ fontSize: 15, fontWeight: 700, color: colors.ink, margin: "0 0 12px" }}>What are you insuring today?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => onToggleCategory(c.slug)}
            style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 12px", background: activeCategory === c.slug ? colors.moss : colors.card, cursor: "pointer" }}
          >
            <c.Icon size={15} color={activeCategory === c.slug ? colors.paper : colors.moss} />
            <span style={{ fontSize: 12, fontWeight: 600, color: activeCategory === c.slug ? colors.paper : colors.mossDeep }}>{c.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {products.map((p) => (
          <div key={p.id} onClick={() => onOpenProduct(p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{p.name}</div>
            </div>
            <ChevronRight size={18} color={colors.slate} />
          </div>
        ))}
        {products.length === 0 && <p style={{ fontSize: 13, color: colors.slate }}>No products in this category yet.</p>}
      </div>
    </>
  );
}
