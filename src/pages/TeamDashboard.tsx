import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/AuthProvider";
import type { BookingRecord } from "../lib/internalStore";
import { fetchBookings, markBookingPaid, revenueStats } from "../lib/internalStore";

export function TeamDashboard() {
  const { session, logout } = useSession();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingRecord | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchBookings();
      setBookings(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load bookings.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mine =
    session.role === "team"
      ? bookings.filter((b) => {
          if (b.teamMemberId === session.memberId) return true;
          if (!b.teamMemberId && b.teamMemberName) {
            return b.teamMemberName.trim().toLowerCase() === session.memberName.trim().toLowerCase();
          }
          return false;
        })
      : bookings;

  const stats = useMemo(() => revenueStats(mine), [mine]);
  const unpaidCount = mine.filter((b) => b.paymentStatus === "unpaid").length;
  const paidCount = mine.filter((b) => b.paymentStatus === "paid").length;

  const name = session.role === "team" ? session.memberName : "Team";

  const copyUrl = useCallback(async (url: string, id: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyId(id);
      window.setTimeout(() => setCopyId(null), 2000);
    } catch {
      window.prompt("Copy link:", url);
    }
  }, []);

  const refresh = () => void load();

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">Team · OneLink billing</p>
            <h1 className="text-2xl font-black text-slate-900">Hi, {name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/team/invoice"
              state={{ fresh: true }}
              className="rounded-xl bg-[#00A9FF] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              + New invoice
            </Link>
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loadError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase text-slate-400">Your invoices</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{mine.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase text-amber-900/80">Unpaid</p>
            <p className="mt-1 text-3xl font-black text-amber-900">{unpaidCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase text-emerald-900/80">Paid (GST incl.)</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">
              ₹{stats.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-emerald-900/70">Paid rows: {paidCount}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-black text-slate-800">Your pipeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-2">When</th>
                  <th className="px-5 py-2">Customer</th>
                  <th className="px-5 py-2">Invoice</th>
                  <th className="px-5 py-2">₹</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mine.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-500">
                      No invoices yet. Create one with <strong>New invoice</strong>.
                    </td>
                  </tr>
                ) : (
                  mine.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="max-w-[200px] px-5 py-3">
                        <span className="font-semibold text-slate-900">{b.customerName}</span>
                        {b.notes ? (
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{b.notes}</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">{b.invoiceNo}</td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums font-semibold text-slate-800">
                        ₹{b.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            b.paymentStatus === "paid"
                              ? "font-bold text-emerald-600"
                              : "font-bold text-amber-600"
                          }
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-slate-800"
                            onClick={() => setDetail(b)}
                          >
                            Open
                          </button>
                          {b.shareUrl ? (
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                              onClick={() => void copyUrl(b.shareUrl, b.id)}
                            >
                              {copyId === b.id ? "Copied" : "Copy link"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {detail ? (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-2 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-[#00A9FF]">Invoice detail</p>
                <h2 className="text-lg font-black text-slate-900">{detail.invoiceNo}</h2>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                onClick={() => setDetail(null)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Customer</p>
                <p className="mt-1 font-bold text-slate-900">{detail.customerName}</p>
                <p className="mt-2 text-slate-600">
                  <span className="font-semibold text-slate-700">Phone:</span> {detail.customerPhone || "—"}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-700">Email:</span> {detail.customerEmail || "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {detail.shareUrl ? (
                  <a
                    href={detail.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-[#00A9FF] py-3 text-center text-sm font-bold text-white"
                  >
                    Open customer invoice
                  </a>
                ) : null}
                {detail.paymentStatus === "unpaid" ? (
                  <button
                    type="button"
                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                    onClick={() => {
                      void (async () => {
                        const ok = await markBookingPaid(detail.id);
                        if (ok) {
                          await load();
                          setDetail(null);
                        }
                      })();
                    }}
                  >
                    Mark paid
                  </button>
                ) : null}
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                  onClick={() => setDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
