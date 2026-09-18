import { ChevronRight } from "lucide-react";
import { colors } from "../theme.js";
import { INSURERS } from "../data/insurers.js";
import { RATE_TABLE_SOURCE } from "../data/insurerProducts.js";
import { BASIS_LABEL, insurersFor, isIndicative } from "../lib/offers.js";
import { calc } from "../lib/calc.js";
import { npr } from "../lib/format.js";

export default function InsurersScreen({ product, onChoose }) {
  const offers = insurersFor(product);
  const tableSource = RATE_TABLE_SOURCE[product.id];
  // Rank on price, then on claim settlement where the price ties — which, on a
  // tariff line, is every row.
  const ranked = offers
    .map((ins) => ({ ...ins, preview: calc(product, ins.offer, product.defaults) }))
    .sort((a, b) => a.preview.net - b.preview.net || (b.claimRatio ?? -1) - (a.claimRatio ?? -1));
  const spread = ranked.length ? ranked[ranked.length - 1].preview.net - ranked[0].preview.net : 0;
  const anyIndicative = ranked.some((x) => isIndicative(product, x.offer));

  return (
    <>
      <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 4px" }}>
        {offers.length === INSURERS.length
          ? `All ${INSURERS.length} licensed non-life insurers sell this cover.`
          : offers.length === 1
            ? `Only one of the ${INSURERS.length} licensed non-life insurers sells this cover.`
            : `${offers.length} of the ${INSURERS.length} licensed non-life insurers sell this cover.`}
      </p>
      {offers.length > 1 && (
        <p style={{ fontSize: 12, color: colors.slate, margin: "0 0 12px" }}>
          {spread > 0
            ? `${npr(spread)} between the cheapest and the dearest on the same cover.`
            : tableSource
              ? `They all quote the same premium: this line is priced off a set tariff (${tableSource}), so there is nothing to compare on price — compare claim settlement instead.`
              : "They all quote the same premium, because none of them publishes a rate for it — compare claim settlement instead."}
        </p>
      )}
      {anyIndicative && (
        <div style={{ marginBottom: 12, background: "#fff7e6", border: "1px solid #e8d5a3", borderRadius: 8, padding: "9px 11px" }}>
          <p style={{ fontSize: 11.5, color: colors.slate, margin: 0 }}>
            Prices marked <strong>indicative</strong> are this app's own placeholder figures, not a quote —
            that insurer prices this cover on request.
          </p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranked.map((ins) => {
          const indicative = isIndicative(product, ins.offer);
          return (
            <div
              key={ins.id}
              onClick={() => onChoose(ins)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{ins.name}</div>
                <div style={{ fontSize: 11, color: colors.slate, marginTop: 2 }}>
                  {indicative ? "Indicative " : "From "}{npr(ins.preview.net)}
                  {ins.claimRatio != null && <> · {ins.claimRatio}% of claims settled</>}
                </div>
                <div style={{ fontSize: 10.5, color: indicative ? "#9a6b1f" : colors.moss, marginTop: 3 }}>
                  {BASIS_LABEL[ins.offer.basis]}
                  {ins.offer.basis === "published" && typeof ins.offer.ratePerMille === "number" && ` — Rs ${ins.offer.ratePerMille}/1,000`}
                </div>
                {ins.offer.note && (
                  <div style={{ fontSize: 10.5, color: colors.slate, marginTop: 3, fontStyle: "italic" }}>{ins.offer.note}</div>
                )}
              </div>
              <ChevronRight size={18} color={colors.slate} style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10.5, color: colors.slate, margin: "12px 0 0", lineHeight: 1.5 }}>
        Which insurers sell what, their listed rates and their claim ratios come from one comparison-site
        listing (BFIS Compare, read 18 Sep 2026), which states its own premium figures are illustrative.
        None of it has been confirmed against the insurers' own filings.
      </p>
    </>
  );
}
