import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import companyJson from "../../company.json";
import plansRefJson from "../../plans-reference.json";
import { InvoicePreview, type PreviewRow } from "../components/InvoicePreview";
import { taxColumnsForInvoice } from "../lib/gst";
import {
  applyDiscountPipeline,
  catalogueGrossSubtotal,
  getMaintenance,
} from "../lib/pricing";
import { inrAmountInWords } from "../lib/inrWords";
import { getShortShareUrl, saveShareAndGetUrlSynced } from "../lib/shortInvoiceLinks";
import {
  SHARE_VERSION,
  tryDecodeShare,
  type BillingBrandId,
  type SharePayload,
} from "../lib/shareInvoice";
import { INDIAN_STATES } from "../lib/states";
import { addBooking, logNotification } from "../lib/internalStore";
import type { CompanyConfig } from "../types/company";
import type { PlansReference } from "../types/plans";
import { useSession } from "../context/AuthProvider";
import { PayNowModal } from "../components/PayNowModal";
import { customerWhatsAppUrl } from "../lib/whatsapp";

const company = companyJson as CompanyConfig;
const plansRef = plansRefJson as PlansReference;

const LS_KEY = "onelink-internal-billing-v1";

type CustomLine = { id: string; description: string; hsn: string; amountInclusive: number };

type Persisted = {
  customMode: boolean;
  customLines: CustomLine[];
  planId: string;
  maintenanceId: string;
  quantity: number;
  /** Staff UI: none | discount (% only). */
  discountMode: "none" | "percent";
  discountPercent: number;
  docType: "tax_invoice";
  invoiceNo: string;
  issueDate: string;
  buyerName: string;
  buyerBusiness: string;
  buyerGstin: string;
  buyerAddress: string;
  buyerCity: string;
  buyerStateCode: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentMode: string;
  paymentRef: string;
  billingBrand: BillingBrandId;
  productLabel: string;
  paymentStatus: "paid" | "unpaid";
};

function nextKryInvoiceNo(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const key = `kry-inv-seq-${yy}${mm}`;
  const n = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(n));
  return `KRY-${yy}${mm}-${String(n).padStart(3, "0")}`;
}

function defaultCustomLines(): CustomLine[] {
  return [
    { id: crypto.randomUUID(), description: "", hsn: "9983", amountInclusive: 0 },
  ];
}

function loadPersisted(): Partial<Persisted> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Persisted>;
  } catch {
    return null;
  }
}

type SeedResult = { partial: Partial<Persisted>; shared: boolean };

type WorkspaceProps = { forcedSharePayload?: SharePayload | null };

export function TeamInvoiceWorkspace({ forcedSharePayload = null }: WorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const firstPlan = plansRef.plans[0];
  const tmpl = company.invoiceTemplate;
  const defaultPay = tmpl?.defaultPaymentMode ?? "";
  const initial = useMemo((): SeedResult => {
    if (forcedSharePayload) {
      const { v: _v, ...rest } = forcedSharePayload;
      return { partial: { ...rest } as Partial<Persisted>, shared: true };
    }
    const params = new URLSearchParams(location.search);
    const urlPayload = tryDecodeShare(params);
    if (urlPayload) {
      const { v: _v, ...rest } = urlPayload;
      return { partial: { ...rest } as Partial<Persisted>, shared: true };
    }
    const st = location.state as { fresh?: boolean } | null;
    if (st?.fresh) {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      return { partial: {}, shared: false };
    }
    return { partial: loadPersisted() ?? {}, shared: false };
  }, [forcedSharePayload, location.search, location.state]);
  const seed = initial.partial;
  const isSharedView = initial.shared;

  useEffect(() => {
    const st = location.state as { fresh?: boolean } | null;
    if (st?.fresh) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const { session, user } = useSession();
  const [payOpen, setPayOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(() => (isSharedView ? 3 : 1));

  const seedDisc = (seed as { discountMode?: string }).discountMode;

  const [customMode, setCustomMode] = useState(
    isSharedView ? Boolean(seed.customMode) : false,
  );
  const [customLines] = useState<CustomLine[]>(
    seed.customLines?.length ? seed.customLines : defaultCustomLines(),
  );
  const [planId, setPlanId] = useState(seed.planId || firstPlan.id);
  const [maintenanceId, setMaintenanceId] = useState(
    seed.maintenanceId ?? firstPlan.maintenanceOptions[0]?.id ?? "yearly",
  );
  const [quantity, setQuantity] = useState(seed.quantity ?? 1);
  const [discountMode, setDiscountMode] = useState<"none" | "percent">(
    seedDisc === "percent" ? "percent" : "none",
  );
  const [discountPercent, setDiscountPercent] = useState(
    typeof seed.discountPercent === "number" ? seed.discountPercent : 0,
  );
  const docType = "tax_invoice" as const;
  const [invoiceNo, setInvoiceNo] = useState(seed.invoiceNo ?? nextKryInvoiceNo());
  const [issueDate, setIssueDate] = useState(
    seed.issueDate ?? new Date().toISOString().slice(0, 10),
  );
  const [buyerName, setBuyerName] = useState(seed.buyerName ?? "");
  const [buyerBusiness, setBuyerBusiness] = useState(seed.buyerBusiness ?? "");
  const [buyerGstin, setBuyerGstin] = useState(seed.buyerGstin ?? "");
  const [buyerAddress, setBuyerAddress] = useState(seed.buyerAddress ?? "");
  const [buyerCity, setBuyerCity] = useState(seed.buyerCity ?? "");
  const [buyerStateCode, setBuyerStateCode] = useState(
    () => (isSharedView ? String(seed.buyerStateCode ?? "01") : "01"),
  );
  const [buyerEmail, setBuyerEmail] = useState(seed.buyerEmail ?? "");
  const [buyerPhone, setBuyerPhone] = useState(seed.buyerPhone ?? "");
  const [paymentMode, setPaymentMode] = useState(() => {
    const m = seed.paymentMode ?? defaultPay;
    if (m === "UPI" || m === "Bank transfer") return m;
    return "UPI";
  });
  const [paymentRef, setPaymentRef] = useState(seed.paymentRef ?? "");
  const [billingBrand, setBillingBrand] = useState<BillingBrandId>(
    seed.billingBrand === "repixelx" ? "repixelx" : "onelink",
  );
  const [productLabel, setProductLabel] = useState(
    seed.productLabel?.trim() ? seed.productLabel : "OneLink",
  );
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    seed.paymentStatus === "paid" ? "paid" : "unpaid",
  );

  useEffect(() => {
    if (!isSharedView) setBuyerStateCode("01");
  }, [isSharedView]);

  useEffect(() => {
    if (!isSharedView) setCustomMode(false);
  }, [isSharedView]);

  const selectedPlan = useMemo(
    () => plansRef.plans.find((x) => x.id === planId) ?? firstPlan,
    [planId, firstPlan],
  );

  useEffect(() => {
    const m = selectedPlan.maintenanceOptions.some((o) => o.id === maintenanceId);
    if (!m && selectedPlan.maintenanceOptions[0]) {
      setMaintenanceId(selectedPlan.maintenanceOptions[0].id);
    }
  }, [selectedPlan, maintenanceId]);

  const maintenance = useMemo(
    () => getMaintenance(selectedPlan, maintenanceId),
    [selectedPlan, maintenanceId],
  );

  const buyerStateName = useMemo(
    () => INDIAN_STATES.find((s) => s.code === buyerStateCode)?.name ?? "",
    [buyerStateCode],
  );

  const grossInclusive = useMemo(() => {
    if (customMode) {
      return customLines.reduce((s, l) => s + Math.max(0, Number(l.amountInclusive) || 0), 0);
    }
    return catalogueGrossSubtotal(selectedPlan, maintenanceId, quantity);
  }, [customMode, customLines, selectedPlan, maintenanceId, quantity]);

  const pipeline = useMemo(() => {
    return applyDiscountPipeline({
      grossInclusive,
      quantity: customMode ? 1 : quantity,
      tiers: [],
      extraDiscountPercent: discountMode === "percent" ? discountPercent : 0,
      extraDiscountFixed: 0,
      overrideTotal: null,
    });
  }, [grossInclusive, quantity, customMode, discountMode, discountPercent]);

  const tax = useMemo(
    () =>
      taxColumnsForInvoice(
        pipeline.finalInclusive,
        buyerStateCode,
        company.stateCode,
      ),
    [pipeline.finalInclusive, buyerStateCode],
  );

  const previewRows = useMemo((): PreviewRow[] => {
    const rows: PreviewRow[] = [];
    if (customMode) {
      customLines.forEach((l) => {
        const amt = Math.max(0, Number(l.amountInclusive) || 0);
        if (!l.description.trim() && amt === 0) return;
        rows.push({
          description: l.description.trim() || "Custom line",
          hsn: l.hsn.trim() || "9983",
          amountInclusive: amt,
        });
      });
      if (rows.length === 0) {
        rows.push({ description: "Custom line items (add rows)", hsn: "9983", amountInclusive: 0 });
      }
    } else {
      rows.push({
        description: `${productLabel} — ${selectedPlan.name} + ${maintenance.label} × ${quantity}`,
        hsn: "9983",
        amountInclusive: pipeline.gross,
      });
    }
    if (pipeline.bulkAmount > 0) {
      rows.push({
        description: `Team / bulk discount (${pipeline.bulkPercent}%)`,
        hsn: "—",
        amountInclusive: -pipeline.bulkAmount,
      });
    }
    if (pipeline.extraPercentAmount > 0 && discountMode === "percent") {
      rows.push({
        description: `Discount (${discountPercent}%)`,
        hsn: "—",
        amountInclusive: -pipeline.extraPercentAmount,
      });
    }
    return rows;
  }, [
    customMode,
    customLines,
    selectedPlan,
    maintenance,
    quantity,
    pipeline,
    discountMode,
    discountPercent,
    productLabel,
  ]);

  const billingBrandDisplay = billingBrand === "repixelx" ? "Repixelx Studio" : "OneLink";

  const persist = useCallback(() => {
    const data: Persisted = {
      customMode,
      customLines,
      planId,
      maintenanceId,
      quantity,
      discountMode,
      discountPercent,
      docType,
      invoiceNo,
      issueDate,
      buyerName,
      buyerBusiness,
      buyerGstin,
      buyerAddress,
      buyerCity,
      buyerStateCode,
      buyerEmail,
      buyerPhone,
      paymentMode,
      paymentRef,
      billingBrand,
      productLabel,
      paymentStatus,
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [
    customMode,
    customLines,
    planId,
    maintenanceId,
    quantity,
    discountMode,
    discountPercent,
    invoiceNo,
    issueDate,
    buyerName,
    buyerBusiness,
    buyerGstin,
    buyerAddress,
    buyerCity,
    buyerStateCode,
    buyerEmail,
    buyerPhone,
    paymentMode,
    paymentRef,
    billingBrand,
    productLabel,
    paymentStatus,
  ]);

  useEffect(() => {
    if (isSharedView) return;
    const t = window.setTimeout(persist, 400);
    return () => window.clearTimeout(t);
  }, [persist, isSharedView]);

  useEffect(() => {
    const t = `${invoiceNo} · ${buyerName.trim() || "Customer"} · KRIYON billing`;
    document.title = t;
  }, [invoiceNo, buyerName]);

  const buildSharePayload = useCallback((): SharePayload => {
    return {
      v: SHARE_VERSION,
      customMode,
      customLines,
      planId,
      maintenanceId,
      quantity,
      discountMode: discountMode === "percent" ? "percent" : "none",
      discountPercent,
      discountFixed: 0,
      overrideTotal: "",
      overrideNote: "",
      docType: "tax_invoice",
      invoiceNo,
      issueDate,
      validUntil: "",
      buyerName,
      buyerBusiness,
      buyerGstin,
      buyerAddress,
      buyerCity,
      buyerStateCode,
      buyerEmail,
      buyerPhone,
      paymentMode,
      paymentRef,
      billingBrand,
      productLabel,
      dueDate: "",
      paymentStatus,
    };
  }, [
    customMode,
    customLines,
    planId,
    maintenanceId,
    quantity,
    discountMode,
    discountPercent,
    invoiceNo,
    issueDate,
    buyerName,
    buyerBusiness,
    buyerGstin,
    buyerAddress,
    buyerCity,
    buyerStateCode,
    buyerEmail,
    buyerPhone,
    paymentMode,
    paymentRef,
    billingBrand,
    productLabel,
    paymentStatus,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const copyShareLink = async () => {
    if (!buyerName.trim() || !invoiceNo.trim()) {
      window.alert("Add customer name and invoice number first.");
      return;
    }
    const built = buildSharePayload();
    const url = await saveShareAndGetUrlSynced(built);
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback("Link copied. Customer opens read-only invoice (Print → Save as PDF in browser).");
    } catch {
      setShareFeedback(url);
    }
    window.setTimeout(() => setShareFeedback(null), 6000);
  };

  const pushDashboard = async (paid: boolean) => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      window.alert("Add customer name and mobile first.");
      return;
    }
    if (wizardStep < 3 && !isSharedView) {
      window.alert("Complete steps 1–2 first.");
      return;
    }
    const url = await saveShareAndGetUrlSynced(buildSharePayload());
    const memberLabel =
      session.role === "team"
        ? session.memberName
        : session.role === "super"
          ? "Super admin"
          : null;
    const teamMemberId =
      session.role === "team"
        ? user?.id ?? session.memberId
        : null;
    try {
      await addBooking({
        source: "team",
        teamMemberId,
        teamMemberName: memberLabel,
        customerName: buyerName,
        customerEmail: buyerEmail,
        customerPhone: buyerPhone,
        invoiceNo,
        amountInr: pipeline.finalInclusive,
        paymentStatus: paid ? "paid" : "unpaid",
        shareUrl: url,
        notes: productLabel,
      });
      await logNotification({
        kind: "email",
        to: buyerEmail || buyerPhone,
        subject: `${paid ? "Paid" : "Unpaid / follow-up"} · ${invoiceNo}`,
        preview: `${buyerName} · ₹${pipeline.finalInclusive.toFixed(2)}`,
        channel: "team",
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save booking.");
      return;
    }
    const savedText = paid
      ? "Saved as PAID on dashboard."
      : "Saved as UNPAID — follow up from team home.";
    setShareFeedback(savedText);
    const shouldBack = window.confirm(`${savedText}\n\nGo back to panel now?`);
    if (shouldBack) {
      navigate(session.role === "super" ? "/admin" : "/team");
      return;
    }
    window.setTimeout(() => setShareFeedback(null), 6000);
  };

  const waCustomerHref = useMemo(() => {
    if (paymentStatus !== "paid" || !buyerPhone.trim()) return null;
    const url = getShortShareUrl(buildSharePayload());
    return customerWhatsAppUrl(
      buyerPhone,
      `Hi ${buyerName || "there"},\n\nYour invoice *${invoiceNo}* from *KRIYON GROUP PRIVATE LIMITED* is marked *paid*.\nAmount: ₹${pipeline.finalInclusive.toLocaleString("en-IN", { maximumFractionDigits: 2 })}\nView invoice: ${url}\n\nThank you.`,
    );
  }, [paymentStatus, buyerPhone, buyerName, invoiceNo, pipeline.finalInclusive, buildSharePayload]);

  const previewProps = {
    company,
    docType,
    invoiceNo,
    issueDate,
    paymentStatus,
    billingBrandDisplay,
    buyerName,
    buyerBusiness,
    buyerGstin,
    buyerAddress,
    buyerCity,
    buyerState: buyerStateName,
    buyerStateCode,
    buyerEmail,
    buyerPhone,
    paymentMode,
    paymentRef,
    rows: previewRows,
    taxable: tax.taxable,
    cgst: tax.cgst,
    sgst: tax.sgst,
    igst: tax.igst,
    isIntra: tax.isIntra,
    grandTotal: pipeline.finalInclusive,
    overrideNote: "",
    logoSrc: tmpl?.logoPath,
    termsParagraph: tmpl?.termsParagraph,
    thankYouLine: tmpl?.thankYouLine,
    upiHint: tmpl?.defaultUpiText,
    footerContractLine: tmpl?.footerContractLine,
    amountInWords: inrAmountInWords(pipeline.finalInclusive),
    customerView: isSharedView,
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {!isSharedView && (session.role === "team" || session.role === "super") ? (
        <div className="print:hidden border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 text-[13px]">
            {session.role === "team" ? (
              <Link to="/team" className="font-bold text-[#00A9FF] hover:underline">
                ← Team home
              </Link>
            ) : (
              <Link to="/admin" className="font-bold text-[#00A9FF] hover:underline">
                ← Admin panel
              </Link>
            )}
            <span className="text-xs text-slate-500">Invoice · print · share link</span>
          </div>
        </div>
      ) : null}
      {isSharedView ? (
        <>
          <div className="print:hidden sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-3 text-center shadow-sm backdrop-blur sm:px-4">
            <p className="text-[13px] font-semibold text-slate-800">Invoice · view only</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Issued by KRIYON GROUP PRIVATE LIMITED</p>
            <p className="mx-auto mt-1 max-w-md text-[10px] text-slate-500">
              On phone: use Print / Save as PDF, then choose “Save as PDF” in the system print sheet.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-xl bg-[#00A9FF] px-5 py-2.5 text-[13px] font-bold text-white"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[calc(210mm+2rem)] px-2 py-4 print:block print:max-w-none print:p-0 sm:px-4 sm:py-6">
            <InvoicePreview {...previewProps} />
          </div>
        </>
      ) : (
        <>
          <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center lg:hidden">
            <p className="max-w-sm text-base font-semibold text-slate-800">Internal billing is desktop-only</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Open <strong>KRIYON · OneLink</strong> invoicing on a computer for the full workflow (plan → customer →
              tax invoice).
            </p>
          </div>
          <div className="mx-auto hidden min-h-screen max-w-[1320px] px-6 py-6 lg:flex lg:gap-8">
        <aside className="print:hidden lg:w-[460px] lg:shrink-0">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto rounded-[28px] border border-[#dce4ed] bg-white p-5 shadow-[0_28px_64px_-40px_rgba(15,23,42,0.18)]">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">KRIYON · OneLink</p>
              <h1 className="text-lg font-black text-slate-900">New tax invoice</h1>
              <p className="text-[11px] text-slate-500">Prices match website · GST inclusive</p>
            </div>

            <div className="flex gap-1">
              {([1, 2, 3] as const).map((s) => (
                <div
                  key={s}
                  className={`flex-1 rounded-lg py-2 text-center text-[10px] font-black uppercase ${
                    wizardStep >= s ? "bg-[#00A9FF] text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s === 1 ? "Plan" : s === 2 ? "Customer" : "Invoice"}
                </div>
              ))}
            </div>

            {wizardStep === 1 ? (
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase text-slate-400">Step 1 · Choose plan</p>
                <div className="space-y-3">
                  {plansRef.plans.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setPlanId(pl.id)}
                      className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                        planId === pl.id
                          ? "border-[#00A9FF] bg-[#f0f9ff]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-slate-900">{pl.name}</span>
                        <span className="text-lg font-black text-[#00A9FF]">
                          ₹{pl.orderAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-slate-500">GST inclusive · onelink.cards</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400">Care / renewal</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                    value={maintenanceId}
                    onChange={(e) => setMaintenanceId(e.target.value)}
                  >
                    {selectedPlan.maintenanceOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} +₹{m.price.toLocaleString("en-IN")} (incl. GST)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#111827] py-3 text-[14px] font-bold text-white"
                  onClick={() => setWizardStep(2)}
                >
                  Continue → Customer
                </button>
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-bold uppercase text-slate-400">Step 2 · Customer</p>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="Customer name *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="Mobile / WhatsApp *"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="Business name"
                  value={buyerBusiness}
                  onChange={(e) => setBuyerBusiness(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="GSTIN (if any)"
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value)}
                />
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px]"
                  rows={2}
                  placeholder="Billing address"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="City"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                />
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <span className="font-bold">Place of supply:</span> Jammu &amp; Kashmir (01) — fixed for this
                  flow.
                </p>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                  placeholder="Email (optional)"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-[13px] font-bold text-slate-700"
                    onClick={() => setWizardStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[#00A9FF] py-2.5 text-[13px] font-bold text-white"
                    onClick={() => {
                      if (!buyerName.trim() || !buyerPhone.trim()) {
                        window.alert("Name and mobile are required.");
                        return;
                      }
                      setWizardStep(3);
                    }}
                  >
                    Build invoice →
                  </button>
                </div>
              </div>
            ) : null}

            {wizardStep === 3 ? (
              <>
                <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Brand on PDF</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="billbrand"
                        checked={billingBrand === "onelink"}
                        onChange={() => setBillingBrand("onelink")}
                      />
                      OneLink
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="billbrand"
                        checked={billingBrand === "repixelx"}
                        onChange={() => setBillingBrand("repixelx")}
                      />
                      Repixelx Studio
                    </label>
                  </div>
                  <label className="mt-2 block text-[11px] font-bold uppercase text-slate-400">Product line</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]"
                    value={productLabel}
                    onChange={(e) => setProductLabel(e.target.value)}
                  />
                </div>

                <p className="text-[12px] text-slate-700">
                  <span className="font-bold">Selected:</span> {selectedPlan.name} + {maintenance.label} ×{" "}
                  {quantity} · <span className="text-[#00A9FF]">GST inclusive</span>
                </p>

                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Discount</p>
                  <div className="mt-2 flex gap-4 text-[12px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="disc"
                        checked={discountMode === "none"}
                        onChange={() => setDiscountMode("none")}
                      />
                      None
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="disc"
                        checked={discountMode === "percent"}
                        onChange={() => setDiscountMode("percent")}
                      />
                      Discount %
                    </label>
                  </div>
                  {discountMode === "percent" ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number.parseFloat(e.target.value) || 0)}
                    />
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Tax invoice</p>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="Invoice no."
                  />
                  <input
                    type="date"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                  <p className="mt-3 text-[11px] font-bold uppercase text-slate-400">On PDF · payment status</p>
                  <div className="mt-1 flex gap-4 text-[12px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paystat"
                        checked={paymentStatus === "unpaid"}
                        onChange={() => setPaymentStatus("unpaid")}
                      />
                      Unpaid
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paystat"
                        checked={paymentStatus === "paid"}
                        onChange={() => setPaymentStatus("paid")}
                      />
                      Paid
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Payment</p>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank transfer">Bank transfer</option>
                  </select>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                    placeholder="UTR / reference"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Subtotal (incl. GST):</span> ₹
                    {grossInclusive.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Grand total:</span>{" "}
                    <span className="text-[#00A9FF]">
                      ₹{pipeline.finalInclusive.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full rounded-xl bg-[#00A9FF] py-3 text-[14px] font-bold text-white shadow-sm"
                >
                  Print / Save as PDF
                </button>

                <button
                  type="button"
                  onClick={copyShareLink}
                  className="w-full rounded-xl border-2 border-[#00A9FF] bg-white py-3 text-[14px] font-bold text-[#0077b6]"
                >
                  Copy share link
                </button>
                {shareFeedback ? (
                  <p className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">{shareFeedback}</p>
                ) : null}

                {!isSharedView && (session.role === "team" || session.role === "super") ? (
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-emerald-900">Payment &amp; dashboard</p>
                    <button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white"
                    >
                      Pay now · UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus("paid");
                        void pushDashboard(true);
                      }}
                      className="w-full rounded-xl border border-emerald-700 bg-emerald-700 py-2.5 text-[13px] font-bold text-white"
                    >
                      Save · Paid
                    </button>
                    {waCustomerHref && waCustomerHref !== "#" ? (
                      <a
                        href={waCustomerHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center rounded-xl bg-[#25D366] py-2.5 text-[13px] font-bold text-white"
                      >
                        WhatsApp customer (paid)
                      </a>
                    ) : (
                      <p className="text-[10px] leading-snug text-emerald-900/80">
                        Mark <span className="font-bold">Paid</span> + mobile for WhatsApp.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void pushDashboard(false)}
                      className="w-full rounded-xl border border-amber-600 bg-white py-2.5 text-[13px] font-bold text-amber-900"
                    >
                      Save · Unpaid (follow-up)
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit customer
                </button>
              </>
            ) : null}
          </div>
        </aside>

        <main className="mt-0 min-w-0 flex-1 print:mt-0">
          {wizardStep >= 3 ? (
            <InvoicePreview {...previewProps} customerView={false} />
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-[#dce4ed] bg-white p-8 text-center text-slate-500 shadow-sm">
              <div>
                <p className="text-lg font-bold text-slate-700">Invoice preview</p>
                <p className="mt-2 max-w-sm text-sm">
                  Complete <strong>Plan</strong> and <strong>Customer</strong> steps. The tax invoice appears here
                  automatically.
                </p>
              </div>
            </div>
          )}
        </main>
          </div>
        </>
      )}
      {!isSharedView ? (
        <PayNowModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          amountInr={pipeline.finalInclusive}
          upiId={tmpl?.upiId ?? ""}
          payeeName={tmpl?.upiPayeeName ?? company.legalName}
          invoiceNo={invoiceNo}
          onMarkPaid={() => {
            setPaymentStatus("paid");
            void pushDashboard(true);
            setPayOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Staff route: remount on “New invoice” so customer fields are not rehydrated from the last draft. */
export function TeamInvoicePage() {
  const loc = useLocation();
  const isFresh =
    loc.state != null &&
    typeof loc.state === "object" &&
    (loc.state as { fresh?: boolean }).fresh === true;
  return <TeamInvoiceWorkspace key={isFresh ? `fresh-${loc.key}` : "persist"} />;
}
