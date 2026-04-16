import { useState } from "react";
import { calculateGSTInclusive } from "../lib/gst";
import type { CompanyConfig } from "../types/company";
import stampSrc from "../../Group 10fff00008673.png";

export type PreviewRow = {
  description: string;
  subtitle?: string;
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
  /** Shown under legal name (e.g. OneLink / Repixelx Studio). */
  billingBrandDisplay: string;
  billingStageLabel?: string;
  billingPercent?: 50 | 100;
  projectTypeLabel?: string;
  paymentStatusLabel?: string;
  dueLabel?: string;
  advanceAmount?: number;
  finalAmount?: number;
  buyerName: string;
  buyerBusiness: string;
  buyerGstin: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerStateCode: string;
  buyerEmail: string;
  buyerPhone: string;
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
  billingBrandDisplay,
  billingStageLabel,
  billingPercent = 100,
  projectTypeLabel,
  paymentStatusLabel,
  dueLabel,
  advanceAmount,
  finalAmount,
  buyerName,
  buyerBusiness,
  buyerGstin,
  buyerAddress,
  buyerCity,
  buyerState,
  buyerStateCode,
  buyerEmail,
  buyerPhone,
  rows,
  taxable,
  cgst,
  sgst,
  igst,
  isIntra,
  grandTotal,
  amountInWords,
  overrideNote,
  logoSrc = "/stamp-1776347234053.png",
  footerContractLine,
  customerView = false,
}: Props) {
  const [logoOk, setLogoOk] = useState(true);
  const titleShort = docType === "proforma" ? "PROFORMA" : "TAX INVOICE";
  const accent = "#00A9FF";

  const terms = [
    "50% advance payment is required before work begins",
    "Remaining 50% is payable before final delivery",
    "Please use the invoice number as payment reference",
    "All services are subject to our standard Terms & Conditions: https://www.kriyongroup.com/legal",
  ];
  const computedAdvance = Math.round((grandTotal / 2) * 100) / 100;
  const computedFinal = Math.round((grandTotal - computedAdvance) * 100) / 100;
  const advanceToPay = typeof advanceAmount === "number" ? advanceAmount : computedAdvance;
  const finalToPay = typeof finalAmount === "number" ? finalAmount : computedFinal;

  return (
    <div className="w-full min-w-0 print:bg-white">
      <div className="mx-auto w-full max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch] print:overflow-visible">
        <div
          id="kry-invoice-a4"
          className="invoice-a4 relative mx-auto box-border h-auto w-[210mm] min-h-[297mm] min-w-[210mm] max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white p-[12mm] text-[11px] leading-snug text-slate-900 shadow-[0_16px_48px_rgba(15,23,42,0.1)] print:m-0 print:min-h-[297mm] print:w-[210mm] print:min-w-[210mm] print:rounded-none print:border-0 print:p-0 print:shadow-none"
        >
        {docType === "proforma" ? (
          <div className="relative z-[1] mb-3 border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-amber-900">
            Proforma — not a tax invoice until payment &amp; finalisation
          </div>
        ) : null}

        <header className="relative z-[1] flex flex-col items-stretch justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-[102px] w-[122px] shrink-0 items-center justify-start pl-1 sm:h-[114px] sm:w-[134px] sm:pl-2">
              {logoOk ? (
                <img
                  src={logoSrc}
                  alt={billingBrandDisplay}
                  className="max-h-full max-w-full origin-left scale-105 object-contain object-left"
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <span className="text-[8px] text-slate-400">Logo</span>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-[16px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[17px]">
                {company.legalName}
              </h1>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-800">
                <span className="font-semibold text-slate-950">GSTIN:</span> {company.gstin}
              </p>
              <p className="text-[9px] leading-relaxed text-slate-800">
                <span className="font-semibold text-slate-950">Brand:</span> {billingBrandDisplay}
              </p>
              <p className="text-[9px] leading-relaxed text-slate-800">
                <span className="font-semibold text-slate-950">Phone:</span> {company.contact.phoneDisplay}
              </p>
              <p className="text-[9px] leading-relaxed text-slate-800">
                <span className="font-semibold text-slate-950">Email:</span> {company.contact.email}
              </p>
              <p className="mt-1 max-w-[98mm] text-[9px] leading-relaxed text-slate-800">
                {company.addressLines.join(" ")}
              </p>
              <p className="mt-1 text-[8px] text-slate-500">CIN: {company.cin}</p>
            </div>
          </div>
          <div className="w-full shrink-0 text-left sm:w-auto sm:min-w-[210px] sm:text-right">
            <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-950 sm:text-[26px] md:text-[30px]">
              {titleShort}
            </p>
            <p className="mt-2 text-[10px] font-medium text-slate-800">
              {docType === "tax_invoice" ? "Invoice No:" : "Ref No:"}{" "}
              <span className="font-semibold text-slate-950">{invoiceNo}</span>
            </p>
            <p className="text-[10px] font-medium text-slate-800">
              Date: <span className="font-semibold text-slate-950">{issueDate}</span>
            </p>
            {dueDate ? (
              <p className="text-[10px] font-medium text-slate-800">
                Due date: <span className="font-semibold text-slate-950">{dueDate}</span>
              </p>
            ) : null}
            {validUntil ? (
              <p className="text-[10px] font-medium text-slate-600">
                Valid until: <span className="text-slate-900">{validUntil}</span>
              </p>
            ) : null}
          </div>
        </header>

        <section className="relative z-[1] mt-4 grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
              Bill To
            </p>
            <p className="mt-1 text-[13px] font-bold text-slate-950">{buyerName || "—"}</p>
            {buyerBusiness ? <p className="text-[11px] font-semibold text-slate-800">{buyerBusiness}</p> : null}
            <p className="mt-2 whitespace-pre-line text-[10px] text-slate-800">{buyerAddress || "—"}</p>
            {buyerGstin ? (
              <p className="mt-2 text-[10px] text-slate-800">
                <span className="font-bold text-slate-950">Client GSTIN:</span> {buyerGstin}
              </p>
            ) : null}
            <p className="mt-1 text-[10px] text-slate-800">
              <span className="font-bold text-slate-950">Contact:</span> {buyerName || "—"}
            </p>
            <p className="text-[10px] text-slate-800">
              <span className="font-bold text-slate-950">Email:</span> {buyerEmail || "—"}
            </p>
            <p className="text-[10px] text-slate-800">
              <span className="font-bold text-slate-950">Phone:</span> {buyerPhone || "—"}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-slate-900">
              Place of Supply: {buyerState}
              {buyerCity ? `, ${buyerCity}` : ""} ({buyerStateCode})
            </p>
          </div>
          <div>
            {billingStageLabel ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[9px] shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                <p className="font-semibold uppercase tracking-[0.15em] text-slate-700">Billing Stage</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {billingStageLabel} ({billingPercent}%)
                </p>
                {projectTypeLabel ? (
                  <p className="mt-2 text-slate-800">
                    <span className="font-semibold text-slate-950">Project Type:</span> {projectTypeLabel}
                  </p>
                ) : null}
                <p className="text-slate-800">
                  <span className="font-semibold text-slate-950">Payment Terms:</span>{" "}
                  {paymentStatusLabel || "50% advance before starting"}
                </p>
                <p className="text-slate-800">
                  <span className="font-semibold text-slate-950">Balance:</span>{" "}
                  {dueLabel || "50% balance before final delivery"}
                </p>
                <div className="mt-2 space-y-2">
                  <div className="rounded-lg border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-3 py-2 shadow-[0_2px_8px_rgba(14,116,144,0.12)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-sky-800">
                      Pay Advance (50%)
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold tabular-nums text-sky-950">{formatInr(advanceToPay)}</p>
                  </div>
                  <div className="rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-2 shadow-[0_2px_8px_rgba(79,70,229,0.12)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-violet-800">
                      Pay Before Final Delivery (50%)
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold tabular-nums text-violet-950">{formatInr(finalToPay)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="relative z-[1] mt-5 -mx-1 overflow-x-auto print:mx-0 print:overflow-visible">
          <table className="w-full min-w-[280px] border-collapse overflow-hidden rounded-lg border border-slate-200 text-left print:min-w-0">
            <thead>
              <tr className="text-left text-[8px] font-semibold uppercase tracking-wider text-white sm:text-[9px]">
                <th className="bg-[#0B0F1A] px-2 py-2.5 sm:px-3 sm:py-3">
                  Description
                </th>
                <th className="w-[4.8rem] bg-[#0B0F1A] px-2 py-2.5 sm:w-20 sm:px-3 sm:py-3">
                  SAC
                </th>
                <th className="w-[5.8rem] bg-[#0B0F1A] px-2 py-2.5 text-right sm:w-24 sm:px-3 sm:py-3">
                  Taxable Value
                </th>
                <th className="w-[4.8rem] bg-[#0B0F1A] px-2 py-2.5 text-right sm:w-20 sm:px-3 sm:py-3">
                  GST
                </th>
                <th className="w-[5.8rem] bg-[#0B0F1A] px-2 py-2.5 text-right sm:w-24 sm:px-3 sm:py-3">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/20">
                  <td className="px-3 py-3.5 align-top text-[9px] sm:px-4 sm:text-[10px]">
                    <p className="font-semibold text-slate-950">{r.description}</p>
                    {r.subtitle ? (
                      <p className="mt-1 text-[8px] leading-relaxed text-slate-600 sm:text-[9px]">{r.subtitle}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-3.5 align-top text-[9px] text-slate-900 sm:px-3 sm:text-[10px]">{r.hsn}</td>
                  {(() => {
                    const split = calculateGSTInclusive(Math.abs(r.amountInclusive), 100);
                    return (
                      <>
                  <td className="px-2 py-3.5 text-right text-[9px] tabular-nums font-bold text-slate-950 sm:px-3 sm:text-[10px]">
                    {formatInr(split.taxableValue)}
                  </td>
                  <td className="px-2 py-3.5 text-right text-[9px] tabular-nums font-bold text-slate-950 sm:px-3 sm:text-[10px]">
                    {formatInr(split.cgst + split.sgst)}
                  </td>
                  <td className="px-2 py-3.5 text-right text-[9px] font-bold tabular-nums text-slate-950 sm:px-3 sm:text-[10px]">
                    {r.amountInclusive < 0 ? "(" : ""}
                    {formatInr(split.total)}
                    {r.amountInclusive < 0 ? ")" : ""}
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative z-[1] mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-950">Terms</p>
              <ul className="mt-2 space-y-1.5 text-[10px] text-slate-900">
                {terms.map((term) => (
                  <li key={term}>• {term}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-[10px] shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
              <div className="flex justify-between border-b border-slate-300 py-1.5">
                <span className="font-medium text-slate-900">Taxable value</span>
                <span className="font-bold tabular-nums text-slate-950">{formatInr(taxable)}</span>
              </div>
              {isIntra ? (
                <>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-slate-900">CGST @ 9%</span>
                    <span className="tabular-nums text-slate-950">{formatInr(cgst)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-slate-900">SGST @ 9%</span>
                    <span className="tabular-nums text-slate-950">{formatInr(sgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1">
                  <span className="font-medium text-slate-900">IGST @ 18%</span>
                  <span className="tabular-nums text-slate-950">{formatInr(igst)}</span>
                </div>
              )}
              <div className="mt-2 rounded-[12px] bg-[#111827] px-4 py-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">Grand Total</p>
                <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-white">
                  {formatInr(grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {amountInWords && grandTotal > 0 ? (
          <div className="relative z-[1] mt-4 border border-slate-300 bg-slate-50/90 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">Amount Chargeable (in words)</p>
            <p className="mt-1 text-[9px] font-medium leading-relaxed text-slate-900">{amountInWords}</p>
          </div>
        ) : null}

        {overrideNote && !customerView ? (
          <p className="relative z-[1] mt-4 rounded border border-slate-200 bg-slate-50 p-2 text-[9px] text-slate-700">
            <span className="font-bold">Internal approval note:</span> {overrideNote}
          </p>
        ) : null}

        <div className="relative z-[1] mt-5 flex justify-end">
          <div className="w-[220px] text-center">
            <img
              src={stampSrc}
              alt=""
              aria-hidden="true"
              className="mx-auto h-auto w-[190px] rotate-[-10deg] object-contain opacity-90"
            />
            <p className="mt-1 text-[9px] text-slate-600">Authorized Signatory</p>
          </div>
        </div>

        {footerContractLine && !customerView ? null : null}
        </div>
      </div>
    </div>
  );
}
