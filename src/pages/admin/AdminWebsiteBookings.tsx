import { useCallback, useEffect, useState } from "react";
import { deleteBooking, fetchBookings, markBookingPaid } from "../../lib/internalStore";
import type { BookingRecord } from "../../lib/internalStore";
import { BookingProfileModal } from "./BookingProfileModal";

export function AdminWebsiteBookings() {
  const [tick, setTick] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BookingRecord | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const all = await fetchBookings();
      setBookings(all.filter((b) => b.source === "website"));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed.");
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [tick, load]);

  const leads = bookings.filter((b) => b.amountInr <= 0);
  const withAmount = bookings.filter((b) => b.amountInr > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">OneLink</p>
        <h2 className="text-2xl font-black text-slate-900">Website funnel</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Leads and paid orders from the marketing site are written to Supabase when{" "}
          <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> and{" "}
          <code className="rounded bg-slate-100 px-1">SUPABASE_URL</code> (or{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>) are set on the Next.js deployment.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-slate-400">All rows</p>
          <p className="mt-1 text-3xl font-black">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-amber-900/80">Leads (₹0)</p>
          <p className="mt-1 text-3xl font-black text-amber-900">{leads.length}</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-sky-900/80">With amount</p>
          <p className="mt-1 text-3xl font-black text-sky-900">{withAmount.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-black text-slate-800">Website bookings &amp; leads</h3>
          <button type="button" className="text-sm font-bold text-[#00A9FF]" onClick={() => setTick((t) => t + 1)}>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Mobile</th>
                <th className="px-4 py-2">Ref</th>
                <th className="px-4 py-2">₹</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Paid at</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-slate-500">
                    No website rows yet. Complete a test checkout on the site with Supabase env vars configured on the
                    server.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{b.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-slate-900">{b.customerPhone || "—"}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{b.invoiceNo}</td>
                    <td className="px-4 py-3 tabular-nums">
                      ₹{b.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-semibold capitalize">{b.paymentStatus}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {b.paidAt ? new Date(b.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white"
                          onClick={() => setProfile(b)}
                        >
                          Open profile
                        </button>
                        {b.paymentStatus === "unpaid" && b.amountInr > 0 ? (
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white"
                            onClick={() => {
                              void (async () => {
                                await markBookingPaid(b.id);
                                setTick((t) => t + 1);
                              })();
                            }}
                          >
                            Mark paid
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs font-bold text-red-600 hover:underline"
                          onClick={() => {
                            if (!window.confirm(`Delete ${b.invoiceNo}?`)) return;
                            void (async () => {
                              await deleteBooking(b.id);
                              setTick((t) => t + 1);
                            })();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BookingProfileModal
        booking={profile}
        onClose={() => setProfile(null)}
        onChanged={() => setTick((t) => t + 1)}
        memberProfileHref={null}
      />
    </div>
  );
}
