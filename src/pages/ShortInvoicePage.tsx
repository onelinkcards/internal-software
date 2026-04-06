import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadShortSharePayload } from "../lib/shortInvoiceLinks";
import type { SharePayload } from "../lib/shareInvoice";
import { TeamInvoiceWorkspace } from "./TeamInvoiceWorkspace";

/** Customer-facing invoice from short URL /i/:customerSlug/:invoiceNo */
export function ShortInvoicePage() {
  const { customerSlug, invoiceNo } = useParams<{ customerSlug: string; invoiceNo: string }>();
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!customerSlug || !invoiceNo) {
      setPhase("missing");
      return;
    }
    let cancel = false;
    (async () => {
      const p = await loadShortSharePayload(customerSlug, invoiceNo);
      if (cancel) return;
      setPayload(p);
      setPhase(p ? "ready" : "missing");
    })();
    return () => {
      cancel = true;
    };
  }, [customerSlug, invoiceNo]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10 text-center sm:px-6">
        <p className="text-sm font-semibold text-slate-600">Loading invoice…</p>
      </div>
    );
  }

  if (phase === "missing" || !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10 text-center sm:px-6">
        <p className="text-lg font-bold text-slate-800">Invoice not available</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          This link may be wrong, expired, or the invoice has not been published yet. Ask the team to resend the link
          from billing after saving.
        </p>
      </div>
    );
  }

  return <TeamInvoiceWorkspace forcedSharePayload={payload} />;
}
