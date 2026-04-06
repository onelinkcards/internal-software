export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type BookingSource = "website" | "team";

export type BookingRecord = {
  id: string;
  createdAt: string;
  paidAt: string | null;
  source: BookingSource;
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
};

export type NotificationLog = {
  id: string;
  at: string;
  kind: "email" | "note";
  to: string;
  subject: string;
  preview: string;
  channel?: "team" | "website" | "system";
};
