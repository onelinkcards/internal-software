import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export const SHARE_VERSION = 2 as const;

export type BillingBrandId = "onelink" | "repixelx";
export type BillingStage = "full" | "advance" | "final";

export type SharePayload = {
  v: typeof SHARE_VERSION;
  customMode: boolean;
  customLines: Array<{ id: string; description: string; hsn: string; amountInclusive: number }>;
  planId: string;
  maintenanceId: string;
  quantity: number;
  discountMode: "none" | "percent" | "fixed" | "override";
  discountPercent: number;
  discountFixed: number;
  overrideTotal: string;
  overrideNote: string;
  docType: "proforma" | "tax_invoice";
  invoiceNo: string;
  issueDate: string;
  validUntil: string;
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
  billingStage: BillingStage;
  billingPercent: 50 | 100;
  dueDate: string;
  paymentStatus: "paid" | "unpaid";
};

/** @deprecated use SharePayload */
export type SharePayloadV1 = SharePayload;

function isLineItem(x: unknown): x is SharePayload["customLines"][number] {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { description?: unknown }).description === "string" &&
    typeof (x as { hsn?: unknown }).hsn === "string" &&
    typeof (x as { amountInclusive?: unknown }).amountInclusive === "number"
  );
}

export function coerceSharePayload(o: Record<string, unknown>): SharePayload | null {
  if (typeof o.invoiceNo !== "string") return null;
  const ver = o.v;
  if (ver !== 1 && ver !== 2) return null;

  const rawLines = o.customLines;
  const customLines = Array.isArray(rawLines)
    ? (rawLines.filter(isLineItem) as SharePayload["customLines"])
    : [];

  const discountMode = o.discountMode;
  const dm =
    discountMode === "percent" || discountMode === "fixed" || discountMode === "override"
      ? discountMode
      : "none";

  const docType = o.docType === "proforma" ? "proforma" : "tax_invoice";

  return {
    v: SHARE_VERSION,
    customMode: Boolean(o.customMode),
    customLines,
    planId: typeof o.planId === "string" ? o.planId : "",
    maintenanceId: typeof o.maintenanceId === "string" ? o.maintenanceId : "yearly",
    quantity: typeof o.quantity === "number" && o.quantity >= 1 ? o.quantity : 1,
    discountMode: dm,
    discountPercent: typeof o.discountPercent === "number" ? o.discountPercent : 0,
    discountFixed: typeof o.discountFixed === "number" ? o.discountFixed : 0,
    overrideTotal: typeof o.overrideTotal === "string" ? o.overrideTotal : "",
    overrideNote: typeof o.overrideNote === "string" ? o.overrideNote : "",
    docType,
    invoiceNo: o.invoiceNo,
    issueDate: typeof o.issueDate === "string" ? o.issueDate : "",
    validUntil: typeof o.validUntil === "string" ? o.validUntil : "",
    buyerName: typeof o.buyerName === "string" ? o.buyerName : "",
    buyerBusiness: typeof o.buyerBusiness === "string" ? o.buyerBusiness : "",
    buyerGstin: typeof o.buyerGstin === "string" ? o.buyerGstin : "",
    buyerAddress: typeof o.buyerAddress === "string" ? o.buyerAddress : "",
    buyerCity: typeof o.buyerCity === "string" ? o.buyerCity : "",
    buyerStateCode: typeof o.buyerStateCode === "string" ? o.buyerStateCode : "07",
    buyerEmail: typeof o.buyerEmail === "string" ? o.buyerEmail : "",
    buyerPhone: typeof o.buyerPhone === "string" ? o.buyerPhone : "",
    paymentMode: typeof o.paymentMode === "string" ? o.paymentMode : "",
    paymentRef: typeof o.paymentRef === "string" ? o.paymentRef : "",
    billingBrand: o.billingBrand === "repixelx" ? "repixelx" : "onelink",
    productLabel: typeof o.productLabel === "string" && o.productLabel.trim() ? o.productLabel : "OneLink",
    billingStage:
      o.billingStage === "advance" || o.billingStage === "final" || o.billingStage === "full"
        ? o.billingStage
        : "full",
    billingPercent: o.billingPercent === 50 ? 50 : 100,
    dueDate: typeof o.dueDate === "string" ? o.dueDate : "",
    paymentStatus: o.paymentStatus === "paid" ? "paid" : "unpaid",
  };
}

/** Human-readable tail for the link (after #). Not used for data — only for sharing context. */
export function buildReadableSlug(invoiceNo: string, buyerName: string): string {
  const inv = invoiceNo
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const name = (buyerName.trim() || "customer")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 48);
  return `${inv || "invoice"}--${name}`;
}

/** Full shareable URL: `pathname` + `?d=` payload + `#slug` (readable only). */
export function buildShareUrl(payload: SharePayload, pathname = "/invoice/share"): string {
  const json = JSON.stringify(payload);
  const d = compressToEncodedURIComponent(json);
  const slug = buildReadableSlug(payload.invoiceNo, payload.buyerName);
  const u = new URL(`${window.location.origin}${pathname}`);
  u.searchParams.set("d", d);
  u.hash = slug;
  return u.toString();
}

export function tryDecodeShare(searchParams: URLSearchParams): SharePayload | null {
  const d = searchParams.get("d");
  if (!d) return null;
  let raw: string | null;
  try {
    raw = decompressFromEncodedURIComponent(d);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return coerceSharePayload(o);
  } catch {
    return null;
  }
}
