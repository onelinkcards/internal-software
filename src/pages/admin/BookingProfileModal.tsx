import type { BookingRecord } from "../../lib/internalStore";
import { deleteBooking, markBookingPaid } from "../../lib/internalStore";
import { Link } from "react-router-dom";

type Props = {
  booking: BookingRecord | null;
  onClose: () => void;
  onChanged: () => void;
  /** When set, show link to team member admin profile */
  memberProfileHref?: string | null;
};

export function BookingProfileModal({ booking, onClose, onChanged, memberProfileHref }: Props) {
  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-2 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase text-[#00A9FF]">Customer profile</p>
            <h2 className="text-lg font-black text-slate-900">{booking.customerName}</h2>
            <p className="text-xs font-mono text-slate-500">{booking.invoiceNo}</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase text-slate-400">Contact (follow-up)</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{booking.customerPhone || "—"}</p>
            <p className="mt-1 text-slate-600">{booking.customerEmail || "—"}</p>
            {booking.notes ? (
              <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Notes:</span> {booking.notes}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="font-bold uppercase text-slate-400">Source</p>
              <p className="mt-1 font-semibold capitalize">{booking.source}</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="font-bold uppercase text-slate-400">Status</p>
              <p
                className={`mt-1 font-bold capitalize ${
                  booking.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {booking.paymentStatus}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="font-bold uppercase text-slate-400">Amount</p>
              <p className="mt-1 font-black tabular-nums">
                ₹{booking.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="font-bold uppercase text-slate-400">Team</p>
              <p className="mt-1 font-medium text-slate-800">{booking.teamMemberName ?? "—"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Recorded:</span>{" "}
            {new Date(booking.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Payment time:</span>{" "}
            {booking.paidAt ? new Date(booking.paidAt).toLocaleString() : "—"}
          </p>
          {booking.shareUrl ? (
            <p className="break-all rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-800">
              {booking.shareUrl}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {booking.shareUrl ? (
              <a
                href={booking.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-[#00A9FF] py-3 text-sm font-bold text-white"
              >
                Open invoice link
              </a>
            ) : null}
            {memberProfileHref ? (
              <Link
                to={memberProfileHref}
                className="flex w-full items-center justify-center rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-800"
                onClick={onClose}
              >
                Open team member profile
              </Link>
            ) : null}
            {booking.paymentStatus === "unpaid" && booking.amountInr > 0 ? (
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                onClick={() => {
                  void (async () => {
                    const ok = await markBookingPaid(booking.id);
                    if (ok) {
                      onChanged();
                      onClose();
                    }
                  })();
                }}
              >
                Mark paid
              </button>
            ) : null}
            <button
              type="button"
              className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-600"
              onClick={() => {
                if (!window.confirm(`Delete ${booking.invoiceNo}?`)) return;
                void (async () => {
                  const ok = await deleteBooking(booking.id);
                  if (ok) {
                    onChanged();
                    onClose();
                  }
                })();
              }}
            >
              Delete record
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
