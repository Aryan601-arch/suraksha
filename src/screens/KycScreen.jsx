import { useRef } from "react";
import { Check, Paperclip, X } from "lucide-react";
import { colors, inputStyle, buttonStyle } from "../theme.js";
import { DOC_ACCEPT_ATTR, formatBytes, isAttached, validateDocFile } from "../lib/documents.js";

export default function KycScreen({ product, docs, docErrors, insuredName, onNameChange, onAttach, onRemove, onError, onSubmit }) {
  const inputs = useRef({});
  const allAttached = product.docsRequired.every((d) => isAttached(docs[d.key]));
  const canSubmit = allAttached && insuredName.trim();

  function handleFile(key, fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    const result = validateDocFile(file);
    if (!result.ok) {
      onError(key, result.error);
      return;
    }
    onAttach(key, result.attachment);
  }

  return (
    <>
      <p style={{ fontSize: 13, color: colors.slate, margin: "0 0 14px" }}>Attach these documents before you can pay.</p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 }}>Full name (as it appears on your documents)</label>
        <input type="text" value={insuredName} onChange={(e) => onNameChange(e.target.value)} style={inputStyle} placeholder="e.g. Aarav Sharma" />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {product.docsRequired.map((doc) => {
          const attachment = docs[doc.key];
          const error = docErrors[doc.key];
          return (
            <div key={doc.key} style={{ padding: "10px 0", borderBottom: `1px solid ${colors.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: colors.ink }}>{doc.label}</span>
                <input
                  ref={(el) => { inputs.current[doc.key] = el; }}
                  type="file"
                  accept={DOC_ACCEPT_ATTR}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handleFile(doc.key, e.target.files);
                    // Clear the input so picking the same file again still fires
                    // a change event (a re-pick after a validation error).
                    e.target.value = "";
                  }}
                />
                {isAttached(attachment) ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: colors.mossDeep, fontWeight: 700, fontSize: 12 }}>
                    <Check size={14} />Attached
                  </span>
                ) : (
                  <button
                    onClick={() => inputs.current[doc.key]?.click()}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: colors.moss, color: colors.paper, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    <Paperclip size={13} />Choose file
                  </button>
                )}
              </div>

              {isAttached(attachment) && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11.5, color: colors.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {attachment.name} · {formatBytes(attachment.size)}
                  </span>
                  <span style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <button onClick={() => inputs.current[doc.key]?.click()} style={{ background: "none", border: "none", padding: 0, color: colors.moss, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Replace</button>
                    <button onClick={() => onRemove(doc.key)} aria-label={`Remove ${doc.label}`} style={{ background: "none", border: "none", padding: 0, color: colors.slate, cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <X size={14} />
                    </button>
                  </span>
                </div>
              )}

              {error && <p style={{ fontSize: 11.5, color: "#a33", margin: "4px 0 0" }}>{error}</p>}
            </div>
          );
        })}
      </div>

      <button
        style={{ ...buttonStyle, marginTop: 16, opacity: canSubmit ? 1 : 0.5 }}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        Submit for review
      </button>
      <p style={{ fontSize: 11, color: colors.slate, marginTop: 12 }}>
        Files stay in this browser — there's no backend to send them to, so nothing here is verified against a real KYC check.
        The policy record keeps the file name and size only.
      </p>
    </>
  );
}
