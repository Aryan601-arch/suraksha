import { colors, inputStyle } from "../theme.js";
import { PROVINCES, districtsOf } from "../data/nepal.js";

const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 };
const errorStyle = { fontSize: 11.5, color: "#a33", margin: "4px 0 0" };

// Province, district, municipality, ward and tole — the order a Nepali address
// is written in, and the order every KYC form asks for it. Province is chosen
// first because it narrows the district list from 77 to at most 14.
export default function AddressFields({ address, onChange, errors = {}, prefix }) {
  const a = address || {};
  const err = (field) => errors[`${prefix}.${field}`];
  const set = (patch) => onChange({ ...a, ...patch });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Province</label>
          <select
            value={a.province || ""}
            // Changing province invalidates whatever district was picked, so it
            // is cleared rather than left pointing at another province's district.
            onChange={(e) => set({ province: e.target.value, district: "" })}
            style={inputStyle}
          >
            <option value="">Select</option>
            {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err("province") && <p style={errorStyle}>{err("province")}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>District</label>
          <select
            value={a.district || ""}
            onChange={(e) => set({ district: e.target.value })}
            disabled={!a.province}
            style={{ ...inputStyle, opacity: a.province ? 1 : 0.5 }}
          >
            <option value="">{a.province ? "Select" : "Pick a province first"}</option>
            {districtsOf(a.province).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {err("district") && <p style={errorStyle}>{err("district")}</p>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Municipality / Rural municipality</label>
        <input
          type="text"
          value={a.municipality || ""}
          onChange={(e) => set({ municipality: e.target.value })}
          style={inputStyle}
          placeholder="e.g. Kathmandu Metropolitan City"
        />
        {err("municipality") && <p style={errorStyle}>{err("municipality")}</p>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 96 }}>
          <label style={labelStyle}>Ward no.</label>
          <input
            type="text"
            inputMode="numeric"
            value={a.ward || ""}
            onChange={(e) => set({ ward: e.target.value.replace(/\D/g, "").slice(0, 2) })}
            style={inputStyle}
            placeholder="10"
          />
          {err("ward") && <p style={errorStyle}>{err("ward")}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tole / street <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            value={a.tole || ""}
            onChange={(e) => set({ tole: e.target.value })}
            style={inputStyle}
            placeholder="e.g. Thamel"
          />
        </div>
      </div>
    </>
  );
}
