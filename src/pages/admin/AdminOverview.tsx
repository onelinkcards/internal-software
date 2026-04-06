import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { BookingRecord, TeamMember } from "../../lib/internalStore";
import {
  bookingsByMonth,
  deleteBooking,
  fetchBookings,
  fetchTeamProfiles,
  funnelStats,
  revenueStats,
  statsByTeamMember,
  unpaidAmountTotal,
} from "../../lib/internalStore";
import { BookingProfileModal } from "./BookingProfileModal";

function VolumeBars({ rows }: { rows: { key: string; label: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-600">
            <span>{r.label}</span>
            <span className="tabular-nums text-slate-900">{r.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00A9FF] to-[#0077b6]"
              style={{ width: `${Math.max(6, (r.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminOverview() {
  const [tick, setTick] = useState(0);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BookingRecord | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [b, m] = await Promise.all([fetchBookings(), fetchTeamProfiles()]);
      setBookings(b);
      setMembers(m);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [tick, load]);
  const rev = useMemo(() => revenueStats(bookings), [bookings]);
  const funnel = useMemo(() => funnelStats(bookings), [bookings]);
  const teamRows = useMemo(() => statsByTeamMember(bookings, members), [bookings, members]);
  const monthSeries = useMemo(() => bookingsByMonth(bookings, 6), [bookings]);
  const paidCount = bookings.filter((b) => b.paymentStatus === "paid").length;
  const unpaidCount = bookings.filter((b) => b.paymentStatus === "unpaid").length;
  const unpaidPipe = useMemo(() => unpaidAmountTotal(bookings), [bookings]);
  const teamBookings = bookings.filter((b) => b.source === "team");
  const total = paidCount + unpaidCount;
  const paidPct = total ? Math.round((paidCount / total) * 100) : 0;

  const profileMemberHref =
    profile?.teamMemberId && profile.source === "team"
      ? `/admin/team/${profile.teamMemberId}`
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00A9FF]">OneLink</p>
          <h2 className="text-2xl font-black text-slate-900">Control dashboard</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            GST-inclusive revenue, 18% tax split, team performance, and intake trends.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#00A9FF] shadow-sm"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh data
        </button>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-slate-400">All records</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{bookings.length}</p>
          <p className="mt-1 text-xs text-slate-500">Team + website rows</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-slate-400">Paid (GST inclusive)</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">
            ₹{rev.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-slate-500">Collected on paid rows</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-sky-800/90">GST @ 18% (of paid total)</p>
          <p className="mt-1 text-2xl font-black text-sky-800">
            ₹{rev.gstApprox.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-sky-900/70">
            Taxable value ≈ ₹{rev.taxableApprox.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-amber-900/80">Unpaid pipeline</p>
          <p className="mt-1 text-2xl font-black text-amber-900">
            ₹{unpaidPipe.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-amber-900/70">{unpaidCount} open row(s)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-400">Volume by month</h3>
          <p className="mt-1 text-lg font-black text-slate-900">New records</p>
          <div className="mt-5">
            <VolumeBars rows={monthSeries} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-400">Payment mix</h3>
          <p className="mt-1 text-lg font-black text-slate-900">Paid vs unpaid</p>
          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} title={`Paid ${paidCount}`} />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${100 - paidPct}%` }}
              title={`Unpaid ${unpaidCount}`}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="font-bold text-emerald-700">Paid · {paidCount}</span>
            <span className="font-bold text-amber-800">Unpaid · {unpaidCount}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">Website funnel</h3>
              <p className="text-xs text-slate-500">
                Paid {funnel.websitePaidCount} · Unpaid pipeline {funnel.websiteCount - funnel.websitePaidCount} rows
              </p>
            </div>
            <Link to="/admin/website" className="text-sm font-bold text-[#00A9FF] hover:underline">
              Open
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between border-b border-slate-50 py-2">
              <span className="text-slate-600">Total intake</span>
              <span className="font-bold">{funnel.websiteCount}</span>
            </li>
            <li className="flex justify-between border-b border-slate-50 py-2">
              <span className="text-slate-600">Leads (no amount)</span>
              <span className="font-bold text-amber-700">{funnel.websiteLeadsCount}</span>
            </li>
            <li className="flex justify-between border-b border-slate-50 py-2">
              <span className="text-slate-600">With quote / amount</span>
              <span className="font-bold">{funnel.websiteQuotedCount}</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-slate-600">Closed paid</span>
              <span className="font-bold text-emerald-600">{funnel.websitePaidCount}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">Team channel</h3>
              <p className="text-xs text-slate-500">
                Paid {funnel.teamPaidCount} · Unpaid {funnel.teamUnpaidCount} · {funnel.teamCount} total
              </p>
            </div>
            <Link to="/admin/team" className="text-sm font-bold text-[#00A9FF] hover:underline">
              Roster
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {teamRows.length === 0 ? (
              <p className="text-sm text-slate-500">No team members in roster.</p>
            ) : (
              teamRows.map((t) => (
                <div
                  key={t.memberId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Paid {t.paidCount} · Unpaid {t.unpaidCount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-700">
                      ₹{t.revenueInclGst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                    <Link to={`/admin/team/${t.memberId}`} className="text-[11px] font-bold text-[#00A9FF] hover:underline">
                      Open profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900">Revenue by closer (paid, GST inclusive)</h3>
        <p className="mt-1 text-xs text-slate-500">Includes website-assigned closers where applicable.</p>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {[...rev.byMember.entries()].length === 0 ? (
            <li className="py-4 text-slate-500">No paid rows yet.</li>
          ) : (
            [...rev.byMember.entries()].map(([k, v]) => (
              <li key={k} className="flex justify-between py-3">
                <span className="font-medium text-slate-800">{k}</span>
                <span className="tabular-nums font-black text-slate-900">
                  ₹{v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900">Recent activity</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">₹</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 15).map((b) => (
                <tr key={b.id} className="border-b border-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-semibold capitalize">{b.source}</td>
                  <td className="px-3 py-2 text-slate-600">{b.teamMemberName ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">{b.customerName}</td>
                  <td className="px-3 py-2 tabular-nums">
                    ₹{b.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 font-semibold capitalize">{b.paymentStatus}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-bold text-[#00A9FF] hover:underline"
                        onClick={() => setProfile(b)}
                      >
                        Open profile
                      </button>
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
              ))}
            </tbody>
          </table>
        </div>
        {teamBookings.length === 0 && funnel.websiteCount === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No records yet. Use billing or the website checkout (with Supabase on the server).</p>
        ) : null}
      </div>

      <BookingProfileModal
        booking={profile}
        onClose={() => setProfile(null)}
        onChanged={() => setTick((t) => t + 1)}
        memberProfileHref={profileMemberHref}
      />
    </div>
  );
}
