import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BookingRecord, TeamMember } from "../../lib/internalStore";
import { deleteBooking, fetchBookings, fetchTeamProfiles, markBookingPaid } from "../../lib/internalStore";

export function AdminMemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const [tick, setTick] = useState(0);
  const [member, setMember] = useState<TeamMember | null | undefined>(undefined);
  const [rows, setRows] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoadError(null);
    try {
      const [allMembers, bookings] = await Promise.all([fetchTeamProfiles(), fetchBookings()]);
      const m = allMembers.find((x) => x.id === memberId) ?? null;
      setMember(m);
      const normalizedMemberName = (m?.name || "").trim().toLowerCase();
      setRows(
        bookings.filter((b) => {
          if (b.teamMemberId === memberId) return true;
          if (!b.teamMemberId && b.teamMemberName && normalizedMemberName) {
            return b.teamMemberName.trim().toLowerCase() === normalizedMemberName;
          }
          return false;
        }),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed.");
      setMember(null);
      setRows([]);
    }
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [tick, load]);

  if (!memberId) {
    return <p className="text-slate-600">Missing member.</p>;
  }

  if (member === undefined && !loadError) {
    return <p className="text-slate-600">Loading…</p>;
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-bold text-slate-800">Member not found.</p>
        <Link to="/admin/team" className="mt-4 inline-block font-bold text-[#00A9FF]">
          ← Back to roster
        </Link>
      </div>
    );
  }

  const paidSum = rows.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amountInr, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/team" className="text-sm font-bold text-[#00A9FF] hover:underline">
            ← Team roster
          </Link>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{member.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {member.email || "No email"} · <span className="font-mono">{member.phone || "—"}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Sign-in is via Supabase Auth (email + password or magic link). Reset passwords from the Supabase dashboard, not
            here.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right shadow-sm">
          <p className="text-[11px] font-black uppercase text-slate-400">Their paid total</p>
          <p className="text-2xl font-black text-emerald-600">
            ₹{paidSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500">{rows.length} booking(s)</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-black text-slate-800">All orders by this member</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Invoice</th>
                <th className="px-4 py-2">₹</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Paid at</th>
                <th className="min-w-[240px] px-4 py-2">Share link (full)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No bookings yet for this member.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{b.customerName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.invoiceNo}</td>
                    <td className="px-4 py-3 tabular-nums">
                      ₹{b.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-semibold capitalize">{b.paymentStatus}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {b.paidAt ? new Date(b.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="max-w-[320px] px-4 py-3 align-top">
                      {b.shareUrl ? (
                        <a
                          href={b.shareUrl}
                          className="break-all font-mono text-[10px] font-semibold text-[#00A9FF] hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {b.shareUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {b.paymentStatus === "unpaid" ? (
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
    </div>
  );
}
