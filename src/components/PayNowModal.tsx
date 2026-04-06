import { useMemo } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  amountInr: number;
  upiId: string;
  payeeName: string;
  invoiceNo: string;
  /** After staff confirms payment (cash/UPI off-app), save as paid on the local dashboard. */
  onMarkPaid?: () => void;
};

function upiUri(pa: string, pn: string, am: number, inv: string): string {
  const params = new URLSearchParams({
    pa: pa.trim(),
    pn: pn.slice(0, 50),
    am: am.toFixed(2),
    cu: "INR",
    tn: `Invoice ${inv}`.slice(0, 80),
  });
  return `upi://pay?${params.toString()}`;
}

export function PayNowModal({
  open,
  onClose,
  amountInr,
  upiId,
  payeeName,
  invoiceNo,
  onMarkPaid,
}: Props) {
  const uri = useMemo(
    () => (upiId.trim() ? upiUri(upiId, payeeName, amountInr, invoiceNo) : ""),
    [upiId, payeeName, amountInr, invoiceNo],
  );

  const qrSrc = uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}`
    : "";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900">Pay now</h2>
            <p className="text-xs text-slate-500">UPI · Invoice {invoiceNo}</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="mt-3 text-2xl font-black text-[#00A9FF]">
          ₹{amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
        {!upiId.trim() ? (
          <p className="mt-4 text-sm text-amber-800">
            Set <code className="rounded bg-amber-50 px-1">upiId</code> in{" "}
            <code className="rounded bg-amber-50 px-1">company.json</code> → invoiceTemplate.
          </p>
        ) : (
          <>
            <div className="mt-4 flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
              {qrSrc ? (
                <img src={qrSrc} alt="UPI QR" className="h-[220px] w-[220px] object-contain" />
              ) : null}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">Scan with any UPI app</p>
            <p className="mt-3 break-all text-center text-xs font-mono font-semibold text-slate-800">
              {upiId}
            </p>
            <a
              href={uri}
              className="mt-4 block w-full rounded-xl bg-[#111827] py-3 text-center text-sm font-bold text-white"
            >
              Open UPI app
            </a>
          </>
        )}
        {onMarkPaid ? (
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
            onClick={() => onMarkPaid()}
          >
            Payment received · save as paid
          </button>
        ) : null}
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
