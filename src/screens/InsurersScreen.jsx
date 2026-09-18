import { ChevronRight } from "lucide-react";
import { colors } from "../theme.js";
import { INSURERS } from "../data/insurers.js";
import { calc } from "../lib/calc.js";
import { npr } from "../lib/format.js";

export default function InsurersScreen({ product, onChoose }) {
  return (
    <>
      <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>Compare insurers for this cover.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {INSURERS.map((ins) => {
          const preview = calc(product, ins.factor, product.defaults);
          return (
            <div
              key={ins.id}
              onClick={() => onChoose(ins)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{ins.name}</div>
                <div style={{ fontSize: 11, color: colors.slate, marginTop: 2 }}>From {npr(preview.net)}</div>
              </div>
              <ChevronRight size={18} color={colors.slate} />
            </div>
          );
        })}
      </div>
    </>
  );
}
