import type { BookingRecord, TeamMember } from "./storeTypes";

export function revenueStats(bookings: BookingRecord[]) {
  const paid = bookings.filter((b) => b.paymentStatus === "paid");
  const total = paid.reduce((s, b) => s + b.amountInr, 0);
  const taxable = total / 1.18;
  const gst = total - taxable;
  const byMember = new Map<string, number>();
  for (const b of paid) {
    const k = b.teamMemberName || "Website / unassigned";
    byMember.set(k, (byMember.get(k) ?? 0) + b.amountInr);
  }
  return { total, gstApprox: gst, taxableApprox: taxable, byMember };
}

export function funnelStats(bookings: BookingRecord[]) {
  const website = bookings.filter((b) => b.source === "website");
  const team = bookings.filter((b) => b.source === "team");
  const websiteLeads = website.filter((b) => b.amountInr <= 0);
  const websiteQuoted = website.filter((b) => b.amountInr > 0);
  const websitePaid = website.filter((b) => b.paymentStatus === "paid");
  const teamPaid = team.filter((b) => b.paymentStatus === "paid");
  const teamUnpaid = team.filter((b) => b.paymentStatus === "unpaid");
  return {
    websiteCount: website.length,
    websiteLeadsCount: websiteLeads.length,
    websiteQuotedCount: websiteQuoted.length,
    websitePaidCount: websitePaid.length,
    teamCount: team.length,
    teamPaidCount: teamPaid.length,
    teamUnpaidCount: teamUnpaid.length,
  };
}

export type TeamMemberRowStats = {
  memberId: string;
  name: string;
  paidCount: number;
  unpaidCount: number;
  revenueInclGst: number;
};

export function statsByTeamMember(bookings: BookingRecord[], members: TeamMember[]): TeamMemberRowStats[] {
  return members.map((m) => {
    const rows = bookings.filter((b) => b.source === "team" && b.teamMemberId === m.id);
    const paid = rows.filter((b) => b.paymentStatus === "paid");
    const unpaid = rows.filter((b) => b.paymentStatus === "unpaid");
    return {
      memberId: m.id,
      name: m.name,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      revenueInclGst: paid.reduce((s, b) => s + b.amountInr, 0),
    };
  });
}

export function unpaidAmountTotal(bookings: BookingRecord[]) {
  return bookings
    .filter((b) => b.paymentStatus === "unpaid")
    .reduce((s, b) => s + Math.max(0, b.amountInr), 0);
}

export function bookingsByMonth(bookings: BookingRecord[], monthsBack = 6) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);
  for (const b of bookings) {
    const k = b.createdAt.slice(0, 7);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return keys.map((k) => ({
    key: k,
    label: `${k.slice(5)}/${k.slice(2, 4)}`,
    count: counts.get(k) ?? 0,
  }));
}
