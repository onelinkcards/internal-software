import type { BookingRecord, BookingSource, NotificationLog, TeamMember } from "./storeTypes";
import { getSupabaseBrowserClient } from "./supabase/browserClient";

type DbBooking = {
  id: string;
  created_at: string;
  paid_at: string | null;
  source: BookingSource;
  team_member_id: string | null;
  team_member_name: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  invoice_no: string;
  amount_inr: string | number;
  payment_status: "paid" | "unpaid";
  share_url: string;
  notes: string | null;
};

type DbNotification = {
  id: string;
  at: string;
  kind: "email" | "note";
  to_address: string;
  subject: string;
  preview: string;
  channel: string | null;
};

export type AppUserProfile = {
  id: string;
  email: string;
  role: "team" | "super";
  display_name: string;
  phone: string;
};

type DbProfile = AppUserProfile;

function mapBooking(r: DbBooking): BookingRecord {
  return {
    id: r.id,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    source: r.source,
    teamMemberId: r.team_member_id,
    teamMemberName: r.team_member_name,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    invoiceNo: r.invoice_no,
    amountInr: typeof r.amount_inr === "string" ? Number.parseFloat(r.amount_inr) : r.amount_inr,
    paymentStatus: r.payment_status,
    shareUrl: r.share_url ?? "",
    notes: r.notes ?? undefined,
  };
}

function mapNotification(r: DbNotification): NotificationLog {
  const ch = r.channel;
  const channel =
    ch === "team" || ch === "website" || ch === "system" ? ch : ("system" as const);
  return {
    id: r.id,
    at: r.at,
    kind: r.kind,
    to: r.to_address,
    subject: r.subject,
    preview: r.preview,
    channel,
  };
}

function requireClient() {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  return sb;
}

export async function fetchBookings(): Promise<BookingRecord[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("bookings").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DbBooking[]).map(mapBooking);
}

export async function fetchTeamProfiles(): Promise<TeamMember[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id,email,display_name,phone,role")
    .eq("role", "team")
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbProfile[]).map((p) => ({
    id: p.id,
    name: p.display_name || p.email,
    email: p.email,
    phone: p.phone ?? "",
  }));
}

export async function insertTeamBooking(input: {
  source: "team";
  teamMemberId: string | null;
  teamMemberName: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNo: string;
  amountInr: number;
  paymentStatus: "paid" | "unpaid";
  shareUrl: string;
  notes?: string;
}): Promise<BookingRecord> {
  const sb = requireClient();
  const at = new Date().toISOString();
  const row = {
    created_at: at,
    paid_at: input.paymentStatus === "paid" ? at : null,
    source: "team" as const,
    team_member_id: input.teamMemberId,
    team_member_name: input.teamMemberName,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    invoice_no: input.invoiceNo,
    amount_inr: input.amountInr,
    payment_status: input.paymentStatus,
    share_url: input.shareUrl,
    notes: input.notes ?? null,
  };
  const { data, error } = await sb.from("bookings").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapBooking(data as DbBooking);
}

export async function markBookingPaid(bookingId: string): Promise<boolean> {
  const sb = requireClient();
  const paidAt = new Date().toISOString();
  const { data: cur, error: e0 } = await sb.from("bookings").select("invoice_no,customer_name").eq("id", bookingId).maybeSingle();
  if (e0 || !cur) return false;
  const { error } = await sb
    .from("bookings")
    .update({ payment_status: "paid", paid_at: paidAt })
    .eq("id", bookingId);
  if (error) return false;
  await insertNotification({
    kind: "note",
    to: "dashboard",
    subject: `Marked paid · ${(cur as { invoice_no: string }).invoice_no}`,
    preview: (cur as { customer_name: string }).customer_name,
    channel: "system",
  });
  return true;
}

export async function deleteBooking(bookingId: string): Promise<boolean> {
  const sb = requireClient();
  const { error } = await sb.from("bookings").delete().eq("id", bookingId);
  if (error) return false;
  await insertNotification({
    kind: "note",
    to: "dashboard",
    subject: "Booking deleted",
    preview: bookingId,
    channel: "system",
  });
  return true;
}

export async function fetchNotifications(): Promise<NotificationLog[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("notification_log").select("*").order("at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DbNotification[]).map(mapNotification);
}

export async function insertNotification(entry: Omit<NotificationLog, "id" | "at">): Promise<void> {
  const sb = requireClient();
  const row = {
    kind: entry.kind,
    to_address: entry.to,
    subject: entry.subject,
    preview: entry.preview,
    channel: entry.channel ?? "system",
  };
  const { error } = await sb.from("notification_log").insert(row);
  if (error) console.error("[notification_log]", error.message);
}

export async function signOut() {
  const sb = getSupabaseBrowserClient();
  if (sb) await sb.auth.signOut();
}

export async function fetchMyProfile(): Promise<AppUserProfile | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data, error } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error || !data) return null;
  return data as DbProfile;
}
