// KYC document attachments.
//
// The upload button used to set a boolean and immediately label the document
// "Approved" — no file was ever chosen, read, or checked. That is worse than
// doing nothing, because the screen asserted an approval that had not
// happened. A real file is now picked, validated, and held as an attachment
// with its own name, size and type, and the status it reports is "Attached",
// which is all this app can honestly claim without a backend to verify against.

export const MAX_DOC_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_DOC_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "application/pdf"];

export const DOC_ACCEPT_ATTR = "image/jpeg,image/png,image/heic,image/heif,image/webp,application/pdf";

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns { ok: true, attachment } or { ok: false, error } — the caller shows
// the error next to the row rather than silently dropping the file.
export function validateDocFile(file) {
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: `That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_DOC_BYTES)}.` };
  }
  // Some browsers report an empty type for HEIC photos straight off a phone,
  // so fall back to the extension rather than rejecting a legitimate upload.
  const byExtension = /\.(jpe?g|png|heic|heif|webp|pdf)$/i.test(file.name);
  if (file.type && !ACCEPTED_DOC_TYPES.includes(file.type) && !byExtension) {
    return { ok: false, error: "Upload a photo or a PDF." };
  }
  if (!file.type && !byExtension) {
    return { ok: false, error: "Upload a photo or a PDF." };
  }
  return {
    ok: true,
    attachment: {
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      attachedAt: new Date().toISOString(),
    },
  };
}

// What gets persisted with the policy record: the file's identity, never its
// bytes. A few phone photos as base64 would exhaust the localStorage quota in
// one purchase and take the whole policy record down with them, so the file
// itself lives only in the page for as long as the tab is open.
export function docsForStorage(docs) {
  const out = {};
  Object.entries(docs || {}).forEach(([key, att]) => {
    if (!att) return;
    out[key] = { name: att.name, size: att.size, type: att.type, attachedAt: att.attachedAt };
  });
  return out;
}

export function isAttached(att) {
  return !!(att && att.name);
}
