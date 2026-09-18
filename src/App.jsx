import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { colors } from "./theme.js";
import { PRODUCTS } from "./data/products.js";
import { INSURERS } from "./data/insurers.js";
import { COVERAGE_SCHEDULES } from "./data/coverageSchedules.js";
import { calc, nrbRateFieldKey } from "./lib/calc.js";
import { fetchNrbRate } from "./lib/nrb.js";
import { docsForStorage } from "./lib/documents.js";
import { EMPTY_NOMINEE } from "./lib/nominee.js";
import { listPolicyRecords, loadPolicyRecord, savePolicyRecord } from "./lib/policyStore.js";
import { policyStatus, policyTerm, renewalStart } from "./lib/policyTerm.js";
import { downloadPolicyPdf } from "./lib/pdf.js";
import HomeScreen from "./screens/HomeScreen.jsx";
import PoliciesScreen from "./screens/PoliciesScreen.jsx";
import RenewLookupScreen from "./screens/RenewLookupScreen.jsx";
import RenewCheckScreen from "./screens/RenewCheckScreen.jsx";
import InsurersScreen from "./screens/InsurersScreen.jsx";
import ProductScreen from "./screens/ProductScreen.jsx";
import KycScreen from "./screens/KycScreen.jsx";
import PaymentScreen from "./screens/PaymentScreen.jsx";

// Where "Back" goes from each screen. Product and payment depend on whether
// this is a renewal, which re-enters the flow partway through.
function backTarget(screen, renewalContext, renewalOrigin) {
  switch (screen) {
    case "policies": return "home";
    case "renew-lookup": return renewalOrigin === "policies" ? "policies" : "home";
    case "renew-check": return renewalOrigin === "policies" ? "policies" : "renew-lookup";
    case "product": return renewalContext ? "renew-check" : "insurers";
    case "kyc": return "product";
    case "payment": return renewalContext ? "renew-check" : "kyc";
    default: return "home";
  }
}

export default function MobilePreview() {
  const [screen, setScreen] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInsurer, setSelectedInsurer] = useState(null);
  const [form, setForm] = useState({});
  const [quote, setQuote] = useState(null);
  const [docs, setDocs] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [insuredName, setInsuredName] = useState("");
  const [nominee, setNominee] = useState(EMPTY_NOMINEE);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "processing" | "success"
  const [policyNumber, setPolicyNumber] = useState(null);
  const [storeWarning, setStoreWarning] = useState(null);
  const [rateInfo, setRateInfo] = useState({ status: "idle", rate: null, date: null, currency: null });
  const [coverageOpen, setCoverageOpen] = useState(null); // null, or one of: "disability", "riders", "exclusions"
  const [policies, setPolicies] = useState([]);

  // Renewal flow: renewalLookup is the policy-number search box; renewalContext
  // is set once a policy is found and stays set through the rest of the flow
  // (quote, payment, PDF) so those screens know this is a renewal, not a new
  // purchase, and can show/generate the right thing.
  const [renewalLookup, setRenewalLookup] = useState("");
  const [renewalLookupInsurerId, setRenewalLookupInsurerId] = useState("");
  const [renewalLookupError, setRenewalLookupError] = useState(null);
  const [renewalContext, setRenewalContext] = useState(null);
  const [renewalOrigin, setRenewalOrigin] = useState("home");

  const refreshPolicies = useCallback(() => setPolicies(listPolicyRecords()), []);
  useEffect(() => { refreshPolicies(); }, [refreshPolicies]);

  const visibleProducts = activeCategory ? PRODUCTS.filter((p) => p.category === activeCategory) : PRODUCTS;
  const expiringCount = policies.filter((p) => {
    if (p.supersededBy) return false;
    const state = policyStatus(p.term).state;
    return state === "expiring" || state === "expired";
  }).length;

  // The period of insurance this quote would buy. Derived rather than stored,
  // so editing the trip length on a travel quote moves the end date with it.
  const termStart = renewalContext ? renewalContext.renewal.startIso : new Date().toISOString();
  const term = selectedProduct ? policyTerm(selectedProduct, form, termStart) : null;
  const coverage = selectedProduct ? COVERAGE_SCHEDULES[selectedProduct.coverageKey || selectedProduct.category] : null;

  async function loadNrbRate(currencyIso3, fieldKey) {
    setRateInfo({ status: "loading", rate: null, date: null, currency: currencyIso3 });
    const result = await fetchNrbRate(currencyIso3);
    setRateInfo(result);
    if (result.status === "success") setForm((f) => ({ ...f, [fieldKey]: result.rate }));
  }

  function maybeLoadRate(product) {
    if (product.rateStructureType === "usd_base") loadNrbRate("USD", nrbRateFieldKey(product) || "usd_rate");
    else if (product.rateStructureType === "eur_base") loadNrbRate("EUR", nrbRateFieldKey(product) || "fx_rate");
  }

  function openProduct(p) {
    setSelectedProduct(p);
    setRenewalContext(null);
    setScreen("insurers");
  }

  function chooseInsurer(insurer) {
    setSelectedInsurer(insurer);
    setForm(selectedProduct.defaults);
    setQuote(null);
    setDocs({});
    setDocErrors({});
    setInsuredName("");
    setNominee(EMPTY_NOMINEE);
    setPaymentStatus(null);
    setPolicyNumber(null);
    setStoreWarning(null);
    setCoverageOpen(null);
    setRenewalContext(null);
    setScreen("product");
    maybeLoadRate(selectedProduct);
  }

  // --- Renewal flow (policy -> details check -> renew or re-quote -> payment) ---

  function startRenewal(origin = "home") {
    setRenewalLookup("");
    setRenewalLookupInsurerId("");
    setRenewalLookupError(null);
    setRenewalContext(null);
    setRenewalOrigin(origin);
    setScreen("renew-lookup");
  }

  // Shared by the lookup form and the "Renew" button on a stored policy: both
  // end up on the details check with the same context behind them.
  function beginRenewalFor(record, origin) {
    const product = PRODUCTS.find((p) => p.id === record.productId);
    const insurer = INSURERS.find((i) => i.id === record.insurerId);
    if (!product || !insurer) {
      setRenewalLookupError("That policy's product or insurer is no longer available.");
      return false;
    }
    setRenewalLookupError(null);
    setSelectedProduct(product);
    setSelectedInsurer(insurer);
    setForm(record.form);
    setInsuredName(record.insuredName);
    setNominee({ ...EMPTY_NOMINEE, ...(record.nominee || {}) });
    setDocs(record.docs || {});
    setDocErrors({});
    setQuote(null);
    setPaymentStatus(null);
    setPolicyNumber(null);
    setStoreWarning(null);
    setCoverageOpen(null);
    setRenewalOrigin(origin);
    setRenewalContext({
      originalPolicyNumber: record.policyNumber,
      purchaseDate: record.purchaseDate,
      priorNet: record.quoteNet,
      priorTerm: record.term || null,
      renewal: renewalStart(record.term),
    });
    setScreen("renew-check");
    maybeLoadRate(product);
    return true;
  }

  function findPolicyForRenewal() {
    if (!renewalLookup.trim() || !renewalLookupInsurerId) return;
    const record = loadPolicyRecord(renewalLookup);
    if (!record) {
      setRenewalLookupError(
        "No policy found with that number on this device. Renewal lookup only works for policies bought earlier in this same browser — there's no shared account system behind this yet."
      );
      return;
    }
    if (record.insurerId !== renewalLookupInsurerId) {
      setRenewalLookupError("That policy number isn't on file with the insurer you selected. Double-check both and try again.");
      return;
    }
    beginRenewalFor(record, renewalOrigin);
  }

  // "Nothing's changed" — skip straight to a fresh quote (current rates, same
  // insurer, same cover) and payment. No document re-upload: those were already
  // submitted when the policy was first issued.
  function renewUnchanged() {
    setQuote(calc(selectedProduct, selectedInsurer.factor, form));
    setScreen("payment");
  }

  // "Something's changed" — drop into the normal product-quote screen,
  // pre-filled with the prior cover, so they can edit and re-quote through the
  // same insurer-rating engine as any other purchase.
  function renewWithChanges() {
    setScreen("product");
  }

  function pay(gateway) {
    setPaymentStatus("processing");
    setTimeout(() => {
      const productCode = selectedProduct.id.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
      const year = new Date().getFullYear();
      const serial = String(Math.floor(Math.random() * 90000) + 10000);
      const newPolicyNumber = `SICL-${productCode}-${year}-${serial}`;
      setPolicyNumber(newPolicyNumber);
      const saved = savePolicyRecord({
        policyNumber: newPolicyNumber,
        productId: selectedProduct.id,
        insurerId: selectedInsurer.id,
        form,
        insuredName,
        nominee,
        docs: docsForStorage(docs),
        quoteRows: quote.rows,
        quoteNet: quote.net,
        purchaseDate: new Date().toISOString(),
        term,
        renewedFrom: renewalContext?.originalPolicyNumber ?? null,
      });
      setStoreWarning(saved ? null : "This browser wouldn't let the policy be saved, so it won't show up under My policies. Download the PDF now — it's the only copy.");
      setPaymentStatus("success");
      refreshPolicies();
    }, 1000);
  }

  function finishPurchase() {
    refreshPolicies();
    setRenewalContext(null);
    setScreen("policies");
  }

  const headerTitle =
    screen === "home" ? "Suraksha"
    : screen === "policies" ? "My policies"
    : screen === "renew-lookup" ? "Renew a policy"
    : screen === "renew-check" ? "Details check"
    : screen === "insurers" ? selectedProduct?.name
    : screen === "kyc" ? "Documents"
    : screen === "payment" ? "Payment"
    : `${selectedProduct?.name} — ${selectedInsurer?.name}`;

  return (
    <div className="suraksha-outer">
      <div className="suraksha-shell">
        <div className="suraksha-notch" style={{ height: 24, background: "#2b2b2b", borderRadius: "20px 20px 0 0", justifyContent: "center", alignItems: "flex-end", paddingBottom: 4 }}>
          <div style={{ width: 60, height: 6, background: "#000", borderRadius: 4 }} />
        </div>

        <div style={{ background: colors.paper, borderBottom: `1px solid ${colors.line}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          {screen !== "home" && (
            <button
              onClick={() => setScreen(backTarget(screen, renewalContext, renewalOrigin))}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label="Back"
            >
              <ArrowLeft size={20} color={colors.mossDeep} />
            </button>
          )}
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, color: colors.mossDeep, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {headerTitle}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, fontFamily: "-apple-system, sans-serif" }}>
          {screen === "home" && (
            <HomeScreen
              products={visibleProducts}
              activeCategory={activeCategory}
              onToggleCategory={(slug) => setActiveCategory(activeCategory === slug ? null : slug)}
              onOpenProduct={openProduct}
              onStartRenewal={() => startRenewal("home")}
              onOpenPolicies={() => { refreshPolicies(); setScreen("policies"); }}
              policyCount={policies.length}
              expiringCount={expiringCount}
            />
          )}

          {screen === "policies" && (
            <PoliciesScreen
              policies={policies}
              onRenew={(record) => beginRenewalFor(record, "policies")}
              onLookup={() => startRenewal("policies")}
            />
          )}

          {screen === "renew-lookup" && (
            <RenewLookupScreen
              policyNumber={renewalLookup}
              insurerId={renewalLookupInsurerId}
              error={renewalLookupError}
              onPolicyNumberChange={setRenewalLookup}
              onInsurerChange={setRenewalLookupInsurerId}
              onFind={findPolicyForRenewal}
            />
          )}

          {screen === "renew-check" && selectedProduct && selectedInsurer && renewalContext && (
            <RenewCheckScreen
              product={selectedProduct}
              insurer={selectedInsurer}
              form={form}
              insuredName={insuredName}
              nominee={nominee}
              onNomineeChange={setNominee}
              renewalContext={{ ...renewalContext, newTerm: term }}
              onRenewUnchanged={renewUnchanged}
              onRenewWithChanges={renewWithChanges}
            />
          )}

          {screen === "insurers" && selectedProduct && (
            <InsurersScreen product={selectedProduct} onChoose={chooseInsurer} />
          )}

          {screen === "product" && selectedProduct && (
            <ProductScreen
              product={selectedProduct}
              form={form}
              setForm={setForm}
              quote={quote}
              onQuote={() => setQuote(calc(selectedProduct, selectedInsurer.factor, form))}
              rateInfo={rateInfo}
              onFetchRate={loadNrbRate}
              coverage={coverage}
              coverageOpen={coverageOpen}
              setCoverageOpen={setCoverageOpen}
              renewalContext={renewalContext}
              term={term}
              onContinue={() => setScreen(renewalContext ? "payment" : "kyc")}
            />
          )}

          {screen === "kyc" && selectedProduct && (
            <KycScreen
              product={selectedProduct}
              docs={docs}
              docErrors={docErrors}
              insuredName={insuredName}
              nominee={nominee}
              onNameChange={setInsuredName}
              onNomineeChange={setNominee}
              onAttach={(key, attachment) => {
                setDocs((d) => ({ ...d, [key]: attachment }));
                setDocErrors((e) => ({ ...e, [key]: null }));
              }}
              onRemove={(key) => setDocs((d) => ({ ...d, [key]: null }))}
              onError={(key, message) => setDocErrors((e) => ({ ...e, [key]: message }))}
              onSubmit={() => setScreen("payment")}
            />
          )}

          {screen === "payment" && (
            <PaymentScreen
              product={selectedProduct}
              quote={quote}
              term={term}
              policyNumber={policyNumber}
              paymentStatus={paymentStatus}
              renewalContext={renewalContext}
              storeWarning={storeWarning}
              onPay={pay}
              onDone={finishPurchase}
              onDownloadPdf={() =>
                downloadPolicyPdf({
                  policyNumber,
                  insurer: selectedInsurer,
                  product: selectedProduct,
                  form,
                  quote,
                  insuredName,
                  nominee,
                  term,
                  renewalContext,
                  docs,
                })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
