import { useRef, useState } from "react";
import { Check, Paperclip, X } from "lucide-react";
import { colors, inputStyle, buttonStyle, secondaryButtonStyle } from "../theme.js";
import { DOC_ACCEPT_ATTR, formatBytes, isAttached, validateDocFile } from "../lib/documents.js";
import { isNomineeComplete } from "../lib/nominee.js";
import { GENDERS, INCOME_BANDS, OCCUPATIONS, kycErrors } from "../lib/kyc.js";
import { ALL_DISTRICTS } from "../data/nepal.js";
import NomineeFields from "./NomineeFields.jsx";
import AddressFields from "./AddressFields.jsx";

const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.slate, display: "block", marginBottom: 4 };
const errorStyle = { fontSize: 11.5, color: "#a33", margin: "4px 0 0" };
const hintStyle = { fontSize: 11.5, color: colors.slate, margin: "0 0 10px" };

// The proposal is long enough that one scroll would bury the documents at the
// bottom, so it is walked a step at a time. Each step names the fields it owns
// and is checked before the next one opens, which is also how the customer
// finds out about a bad citizenship number at the point they typed it rather
// than after filling in everything else.
const STEPS = [
  { id: "identity", title: "About you", fields: ["dob", "gender", "fatherName", "grandfatherName", "citizenshipNumber", "citizenshipDistrict", "citizenshipIssuedBs", "nid", "pan"] },
  { id: "address", title: "Address", fields: ["permanent.province", "permanent.district", "permanent.municipality", "permanent.ward", "current.province", "current.district", "current.municipality", "current.ward"] },
  { id: "contact", title: "Contact & work", fields: ["mobile", "email", "occupation", "incomeBand", "pep"] },
  { id: "nominee", title: "Nominee", fields: [] },
  { id: "documents", title: "Documents", fields: [] },
];

function Field({ label, optional, hint, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>
        {label}
        {optional && <span style={{ fontWeight: 400 }}> (optional)</span>}
      </label>
      {children}
      {hint && !error && <p style={{ ...errorStyle, color: colors.slate }}>{hint}</p>}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            border: `1px solid ${colors.line}`, borderRadius: 999, padding: "6px 10px", fontSize: 11,
            fontWeight: 600, cursor: "pointer",
            background: value === o.value ? colors.moss : colors.card,
            color: value === o.value ? colors.paper : colors.mossDeep,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function KycScreen({
  product, docs, docErrors, insuredName, kyc, nominee,
  onNameChange, onKycChange, onNomineeChange, onAttach, onRemove, onError, onSubmit,
}) {
  const inputs = useRef({});
  const [stepIndex, setStepIndex] = useState(0);
  // Errors stay hidden until the customer tries to leave a step — nobody wants
  // to be told the date of birth is missing before they have typed it.
  const [checkedSteps, setCheckedSteps] = useState({});

  const step = STEPS[stepIndex];
  const panRequired = product.docsRequired.some((d) => d.key === "pan_certificate");
  const allAttached = product.docsRequired.every((d) => isAttached(docs[d.key]));
  const errors = kycErrors(kyc, { panRequired });
  const nameError = insuredName.trim() ? "" : "Enter your full name.";
  const showErrors = !!checkedSteps[step.id];

  function errorsOnStep(s) {
    const found = s.fields.filter((f) => errors[f]);
    if (s.id === "identity" && nameError) found.push("fullName");
    if (s.id === "nominee" && !isNomineeComplete(nominee)) found.push("nominee");
    if (s.id === "documents" && !allAttached) found.push("documents");
    return found;
  }

  const stepErrors = errorsOnStep(step);
  const err = (key) => (showErrors ? errors[key] : "");
  const setKyc = (patch) => onKycChange({ ...kyc, ...patch });

  function goNext() {
    setCheckedSteps((c) => ({ ...c, [step.id]: true }));
    if (stepErrors.length) return;
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
    else onSubmit();
  }

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
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            title={s.title}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= stepIndex ? colors.moss : colors.line,
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: colors.slate, margin: "0 0 2px" }}>
        Step {stepIndex + 1} of {STEPS.length}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: colors.ink, margin: "0 0 12px" }}>{step.title}</p>

      {step.id === "identity" && (
        <>
          <p style={hintStyle}>The insurer has to record who you are before it can put you on cover. Copy these from your citizenship certificate.</p>
          <Field label="Full name (as it appears on your documents)" error={showErrors ? nameError : ""}>
            <input type="text" value={insuredName} onChange={(e) => onNameChange(e.target.value)} style={inputStyle} placeholder="e.g. Aarav Sharma" />
          </Field>
          <Field label="Date of birth" error={err("dob")}>
            <input type="date" value={kyc.dob} onChange={(e) => setKyc({ dob: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Gender" error={err("gender")}>
            <Chips options={GENDERS} value={kyc.gender} onChange={(v) => setKyc({ gender: v })} />
          </Field>
          <Field label="Father's name" error={err("fatherName")}>
            <input type="text" value={kyc.fatherName} onChange={(e) => setKyc({ fatherName: e.target.value })} style={inputStyle} placeholder="e.g. Ram Sharma" />
          </Field>
          <Field label="Grandfather's name" error={err("grandfatherName")}>
            <input type="text" value={kyc.grandfatherName} onChange={(e) => setKyc({ grandfatherName: e.target.value })} style={inputStyle} placeholder="e.g. Hari Sharma" />
          </Field>

          <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "16px 0 8px", borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>Citizenship</p>
          <Field label="Citizenship number" error={err("citizenshipNumber")}>
            <input type="text" value={kyc.citizenshipNumber} onChange={(e) => setKyc({ citizenshipNumber: e.target.value })} style={inputStyle} placeholder="e.g. 27-01-70-01234" />
          </Field>
          <Field label="Issued by (district)" error={err("citizenshipDistrict")}>
            <select value={kyc.citizenshipDistrict} onChange={(e) => setKyc({ citizenshipDistrict: e.target.value })} style={inputStyle}>
              <option value="">Select</option>
              {ALL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Issue date (Bikram Sambat)" hint="As printed on the certificate, e.g. 2068-05-14." error={err("citizenshipIssuedBs")}>
            <input type="text" inputMode="numeric" value={kyc.citizenshipIssuedBs} onChange={(e) => setKyc({ citizenshipIssuedBs: e.target.value })} style={inputStyle} placeholder="2068-05-14" />
          </Field>
          <Field
            label="National ID number"
            optional
            hint="The Authority has told insurers to record this. Leave it blank if you don't have one yet — it won't stop you buying."
            error={err("nid")}
          >
            <input type="text" inputMode="numeric" value={kyc.nid} onChange={(e) => setKyc({ nid: e.target.value })} style={inputStyle} placeholder="11 digits" />
          </Field>
          <Field label="PAN number" optional={!panRequired} error={err("pan")}>
            <input type="text" inputMode="numeric" value={kyc.pan} onChange={(e) => setKyc({ pan: e.target.value })} style={inputStyle} placeholder="9 digits" />
          </Field>
        </>
      )}

      {step.id === "address" && (
        <>
          <p style={hintStyle}>Your permanent address as it appears on your citizenship.</p>
          <AddressFields address={kyc.permanent} onChange={(v) => setKyc({ permanent: v })} errors={showErrors ? errors : {}} prefix="permanent" />

          <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 12, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={kyc.currentSameAsPermanent}
                onChange={(e) => setKyc({ currentSameAsPermanent: e.target.checked })}
              />
              <span style={{ fontSize: 13, color: colors.ink }}>I currently live at this address</span>
            </label>
            {!kyc.currentSameAsPermanent && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: "0 0 2px" }}>Current address</p>
                <p style={hintStyle}>Where the insurer should reach you.</p>
                <AddressFields address={kyc.current} onChange={(v) => setKyc({ current: v })} errors={showErrors ? errors : {}} prefix="current" />
              </>
            )}
          </div>
        </>
      )}

      {step.id === "contact" && (
        <>
          <Field label="Mobile number" error={err("mobile")}>
            <input type="tel" inputMode="tel" value={kyc.mobile} onChange={(e) => setKyc({ mobile: e.target.value })} style={inputStyle} placeholder="e.g. 9801234567" />
          </Field>
          <Field label="Email" optional error={err("email")}>
            <input type="email" value={kyc.email} onChange={(e) => setKyc({ email: e.target.value })} style={inputStyle} placeholder="e.g. aarav@example.com" />
          </Field>
          <Field label="Occupation" error={err("occupation")}>
            <Chips options={OCCUPATIONS} value={kyc.occupation} onChange={(v) => setKyc({ occupation: v, occupationOther: v === "other" ? kyc.occupationOther : "" })} />
          </Field>
          {kyc.occupation === "other" && (
            <Field label="Occupation (please specify)">
              <input type="text" value={kyc.occupationOther} onChange={(e) => setKyc({ occupationOther: e.target.value })} style={inputStyle} placeholder="e.g. Potter" />
            </Field>
          )}
          <Field label="Annual income" error={err("incomeBand")}>
            <Chips options={INCOME_BANDS} value={kyc.incomeBand} onChange={(v) => setKyc({ incomeBand: v })} />
          </Field>
          <Field
            label="Are you, or is a close family member, a politically exposed person?"
            hint="A senior public official, judge, military officer, or a director of a state-owned body — in Nepal or abroad. Answering yes doesn't stop you buying; the insurer just has to record it."
            error={err("pep")}
          >
            <Chips options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} value={kyc.pep} onChange={(v) => setKyc({ pep: v })} />
          </Field>
        </>
      )}

      {step.id === "nominee" && (
        <>
          <p style={hintStyle}>Who the insurer pays a claim to if it can't be paid to you.</p>
          <NomineeFields nominee={nominee} onChange={onNomineeChange} />
          {showErrors && !isNomineeComplete(nominee) && (
            <p style={errorStyle}>Give the nominee's name, their relationship to you, and a number they can be reached on.</p>
          )}
        </>
      )}

      {step.id === "documents" && (
        <>
          <p style={hintStyle}>Photograph or scan each one. A photo or a PDF, up to 5 MB.</p>
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

                  {error && <p style={errorStyle}>{error}</p>}
                </div>
              );
            })}
          </div>
          {showErrors && !allAttached && (
            <p style={errorStyle}>Attach every document before submitting.</p>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {stepIndex > 0 && (
          <button style={{ ...secondaryButtonStyle, flex: 1 }} onClick={() => setStepIndex(stepIndex - 1)}>Back</button>
        )}
        <button style={{ ...buttonStyle, flex: 2 }} onClick={goNext}>
          {stepIndex === STEPS.length - 1 ? "Submit for review" : "Continue"}
        </button>
      </div>

      {stepIndex === STEPS.length - 1 && (
        <p style={{ fontSize: 11, color: colors.slate, marginTop: 12 }}>
          Files stay in this browser — there's no backend to send them to, so nothing here is verified against a real KYC check.
          The policy record keeps the file name and size only.
        </p>
      )}
    </>
  );
}
