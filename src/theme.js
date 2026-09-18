// Shared palette and the two inline style objects reused across every screen.

export const colors = {
  ink: "#1c2b28",
  paper: "#f6f3ea",
  slate: "#4b5a56",
  moss: "#2f5d4f",
  mossDeep: "#16302a",
  line: "#ddd6c4",
  card: "#ffffff",
};

// #rrggbb -> [r, g, b] ints, for jsPDF's setTextColor/setDrawColor (which take
// 0-255 components, not hex) — keeps the PDF's palette in sync with `colors`.
export function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${colors.line}`, borderRadius: 8, fontSize: 14, background: colors.card, boxSizing: "border-box" };
export const buttonStyle = { width: "100%", background: colors.moss, color: colors.paper, border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" };
export const secondaryButtonStyle = { ...buttonStyle, background: colors.card, color: colors.mossDeep, border: `1px solid ${colors.moss}` };
