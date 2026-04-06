import { useState } from "react";
import type { CompanyConfig } from "../types/company";

export type PreviewRow = {
  description: string;
  hsn: string;
  amountInclusive: number;
};

type Props = {
  company: CompanyConfig;
  docType: "proforma" | "tax_invoice";
  invoiceNo: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  paymentStatus?: "paid" | "unpaid";
  /** Shown under legal name (e.g. OneLink / Repixelx Studio). */
  billingBrandDisplay: string;
  buyerName: string;
  buyerBusiness: string;
  buyerGstin: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerStateCode: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentMode: string;
  paymentRef: string;
  rows: PreviewRow[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  isIntra: boolean;
  grandTotal: number;
  amountInWords?: string;
  overrideNote: string;
  logoSrc?: string;
  termsParagraph?: string;
  thankYouLine?: string;
  upiHint?: string;
  footerContractLine?: string;
  /** Shared customer link: hide internal approval notes. */
  customerView?: boolean;
};

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function InvoicePreview({
  company,
  docType,
  invoiceNo,
  issueDate,
  validUntil,
  dueDate,
  paymentStatus = "unpaid",
  billingBrandDisplay,
  buyerName,
  buyerBusiness,
  buyerGstin,
  buyerAddress,
  buyerCity,
  buyerState,
  buyerStateCode,
  buyerEmail,
  buyerPhone,
  paymentMode,
  paymentRef,
  rows,
  taxable,
  cgst,
  sgst,
  igst,
  isIntra,
  grandTotal,
  amountInWords,
  overrideNote,
  logoSrc = "/kriyon-logo.png",
  termsParagraph,
  thankYouLine = "THANK YOU FOR YOUR BUSINESS",
  upiHint,
  footerContractLine,
  customerView = false,
}: Props) {
  const [logoOk, setLogoOk] = useState(true);
  const titleShort = docType === "proforma" ? "PROFORMA" : "TAX INVOICE";
  const accent = "#00A9FF";

  const terms =
    termsParagraph ??
    "Payment is due on or before the due date on this invoice unless otherwise agreed in writing.";

  return (
    <div className="w-full min-w-0 print:bg-white">
      <div className="mx-auto w-full max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch] print:overflow-visible">
        <div
          id="kry-invoice-a4"
          className="invoice-a4 relative mx-auto box-border w-full min-h-[min(297mm,100%)] min-w-0 max-w-[210mm] bg-white px-4 py-5 text-[10px] leading-snug text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-6 sm:py-6 sm:text-[11px] print:m-0 print:h-auto print:min-h-[297mm] print:w-[210mm] print:max-w-none print:min-w-0 print:px-0 print:py-0 print:shadow-none md:max-w-[210mm]"
        >
        {docType === "proforma" ? (
          <div className="relative z-[1] mb-3 border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-amber-900">
            Proforma — not a tax invoice until payment &amp; finalisation
          </div>
        ) : null}

        <header className="relative z-[1] flex flex-col flex-wrap items-stretch justify-between gap-5 border-b-2 border-slate-900 pb-5 pt-1 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
            <div className="flex h-[6.75rem] w-[7.5rem] shrink-0 items-center justify-start sm:h-[7.25rem] sm:w-[8.25rem]">
              {logoOk ? (
                <img
                  src={logoSrc}
                  alt={billingBrandDisplay}
                  className="max-h-full max-w-full object-contain object-left"
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <span className="text-[8px] text-slate-400">Logo</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-black leading-tight tracking-tight text-slate-900 sm:text-[16px]">
                {company.legalName}
              </h1>
              <p className="mt-1 text-[10px] font-bold text-slate-800">Brand: {billingBrandDisplay}</p>
              <p className="mt-0.5 text-[9px] text-slate-500">{company.constitution}</p>
              <p className="mt-1 max-w-[92mm] text-[9px] text-slate-600">
                {company.addressLines.join(" ")}
              </p>
              <div className="mt-2 border border-slate-400 bg-white px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">GSTIN (supplier)</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-900">{company.gstin}</p>
                <p className="mt-1.5 text-[9px] text-slate-600">CIN {company.cin}</p>
              </div>
              {docType === "tax_invoice" ? (
                <p className="mt-2 text-[9px] text-slate-600">
                  <span className="font-bold">Supplier state:</span> {company.state}{" "}
                  <span className="text-slate-400">|</span>{" "}
                  <span className="font-bold">Code:</span> {company.stateCode}
                </p>
              ) : null}
              <p className="mt-1 text-[9px] text-slate-600">
                {company.contact.phoneDisplay} · {company.contact.email}
              </p>
            </div>
          </div>
          <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
            <p className="text-[22px] font-black leading-none tracking-tight text-slate-900 sm:text-[26px] md:text-[30px]">
              {titleShort}
            </p>
            <p className="mt-2 text-[10px] font-semibold text-slate-600">
              {docType === "tax_invoice" ? "Tax invoice no.:" : "Proforma ref.:"}{" "}
              <span className="text-slate-900">{invoiceNo}</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-600">
              Invoice date: <span className="text-slate-900">{issueDate}</span>
            </p>
            {dueDate ? (
              <p className="text-[10px] font-semibold text-slate-600">
                Due date: <span className="text-slate-900">{dueDate}</span>
              </p>
            ) : null}
            {validUntil ? (
              <p className="text-[10px] font-semibold text-slate-600">
                Valid until: <span className="text-slate-900">{validUntil}</span>
              </p>
            ) : null}
            <p className="mt-2 text-[10px] font-bold">
              <span className="text-slate-600">Payment status:</span>{" "}
              <span
                className={
                  paymentStatus === "paid"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }
              >
                {paymentStatus === "paid" ? "PAID" : "UNPAID"}
              </span>
            </p>
          </div>
        </header>

        <section className="relative z-[1] mt-5 grid gap-4 border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
              Invoice to
            </p>
            <p className="mt-1 text-[13px] font-bold text-slate-900">{buyerName || "—"}</p>
            {buyerBusiness ? <p className="text-[11px] font-semibold text-slate-700">{buyerBusiness}</p> : null}
            <p className="mt-2 whitespace-pre-line text-[10px] text-slate-600">{buyerAddress || "—"}</p>
            <p className="text-[10px] text-slate-600">
              {buyerCity}
              {buyerCity && buyerState ? ", " : ""}
              {buyerState} ({buyerStateCode})
            </p>
            {buyerGstin ? (
              <div className="mt-2 border border-slate-400 bg-white px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">Customer GSTIN</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-900">{buyerGstin}</p>
              </div>
            ) : null}
            <p className="mt-1 text-[10px] text-slate-600">{buyerEmail}</p>
            <p className="text-[10px] text-slate-600">{buyerPhone}</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-700">
              Place of supply: {buyerState}
            </p>
          </div>
          <div className="border-t border-slate-200 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
              Payment
            </p>
            <p className="mt-1 text-[10px] font-bold">
              <span className="text-slate-600">Status:</span>{" "}
              <span className={paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"}>
                {paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </span>
            </p>
            {paymentMode ? (
              <p className="mt-1 text-[10px]">
                <span className="font-bold">Mode:</span> {paymentMode}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-500">Mode: —</p>
            )}
            {paymentRef ? (
              <p className="text-[10px]">
                <span className="font-bold">Ref / UTR:</span> {paymentRef}
              </p>
            ) : null}
            {upiHint ? (
              <p className="mt-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-[9px] text-slate-700">
                {upiHint}
              </p>
            ) : null}
          </div>
        </section>

        <div className="relative z-[1] mt-5 -mx-1 overflow-x-auto print:mx-0 print:overflow-visible">
          <table className="w-full min-w-[280px] border-collapse overflow-hidden rounded-sm border border-slate-200 text-left print:min-w-0">
            <thead>
              <tr className="text-left text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                <th className="w-8 px-1.5 py-2 sm:w-10 sm:px-2 sm:py-2.5" style={{ backgroundColor: accent }}>
                  No.
                </th>
                <th className="px-1.5 py-2 sm:px-2 sm:py-2.5" style={{ backgroundColor: accent }}>
                  Description
                </th>
                <th className="w-[4.5rem] px-1.5 py-2 sm:w-20 sm:px-2 sm:py-2.5" style={{ backgroundColor: accent }}>
                  HSN/SAC
                </th>
                <th className="w-[5.5rem] px-1.5 py-2 text-right sm:w-28 sm:px-2 sm:py-2.5" style={{ backgroundColor: accent }}>
                  <span className="hidden sm:inline">Amount (incl. GST)</span>
                  <span className="sm:hidden">Amt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-1.5 py-2 align-top text-[9px] font-semibold text-slate-500 sm:px-2 sm:text-[10px]">
                    {i + 1}
                  </td>
                  <td className="px-1.5 py-2 align-top text-[9px] sm:px-2 sm:text-[10px]">
                    <span className="mr-1 inline-block text-[7px] sm:text-[8px]" style={{ color: accent }}>
                      ◆
                    </span>
                    {r.description}
                  </td>
                  <td className="px-1.5 py-2 align-top text-[9px] text-slate-600 sm:px-2 sm:text-[10px]">{r.hsn}</td>
                  <td className="px-1.5 py-2 text-right text-[9px] font-bold tabular-nums text-slate-900 sm:px-2 sm:text-[10px]">
                    {r.amountInclusive < 0 ? "(" : ""}
                    {formatInr(Math.abs(r.amountInclusive))}
                    {r.amountInclusive < 0 ? ")" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative z-[1] mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_220px]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-900">
              Terms &amp; conditions
            </p>
            <p className="mt-2 whitespace-pre-line text-[10px] font-medium leading-relaxed text-slate-700">
              {terms}
            </p>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span className="text-slate-600">Taxable value</span>
              <span className="font-semibold tabular-nums">{formatInr(taxable)}</span>
            </div>
            {isIntra ? (
              <>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">CGST @ 9%</span>
                  <span className="tabular-nums">{formatInr(cgst)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">SGST @ 9%</span>
                  <span className="tabular-nums">{formatInr(sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">IGST @ 18%</span>
                <span className="tabular-nums">{formatInr(igst)}</span>
              </div>
            )}
            <div
              className="mt-2 flex justify-between px-3 py-2.5 text-[12px] font-black text-white"
              style={{ backgroundColor: accent }}
            >
              <span>Total</span>
              <span className="tabular-nums">{formatInr(grandTotal)}</span>
            </div>
          </div>
        </div>

        {amountInWords && grandTotal > 0 ? (
          <div className="relative z-[1] mt-4 border border-slate-300 bg-slate-50/90 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">Amount chargeable (in words)</p>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-900">{amountInWords}</p>
          </div>
        ) : null}

        {overrideNote && !customerView ? (
          <p className="relative z-[1] mt-4 rounded border border-slate-200 bg-slate-50 p-2 text-[9px] text-slate-700">
            <span className="font-bold">Internal approval note:</span> {overrideNote}
          </p>
        ) : null}

        <p className="relative z-[1] mt-6 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-700">
          {thankYouLine}
        </p>

        <footer className="relative z-[1] mt-8 border-t border-slate-200 pt-4">
          {footerContractLine ? (
            <p className="mb-3 text-[10px] font-bold leading-snug text-slate-800">{footerContractLine}</p>
          ) : null}
          <div className="text-[8px] text-slate-500">
            <p className="font-bold text-slate-700">Contact</p>
            <p>
              {company.contact.phoneDisplay} · {company.contact.email}
            </p>
            <p className="mt-1 max-w-[170mm]">{company.addressLines.join(" ")}</p>
            <p className="mt-2 text-slate-600">
              Computer-generated document · {company.legalName}
            </p>
          </div>
        </footer>
        </div>
      </div>
    </div>
  );
}
