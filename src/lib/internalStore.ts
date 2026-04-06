/**
 * Types + analytics helpers. All data lives in Supabase — use async exports for CRUD.
 */

export type { BookingRecord, BookingSource, NotificationLog, TeamMember } from "./storeTypes";
export type { AppUserProfile } from "./supabaseStore";

export {
  bookingsByMonth,
  funnelStats,
  revenueStats,
  statsByTeamMember,
  unpaidAmountTotal,
  type TeamMemberRowStats,
} from "./storePure";

export {
  deleteBooking,
  fetchBookings,
  fetchMyProfile,
  fetchNotifications,
  fetchTeamProfiles,
  insertNotification,
  insertTeamBooking,
  markBookingPaid,
  signOut,
} from "./supabaseStore";

export { insertTeamBooking as addBooking, insertNotification as logNotification } from "./supabaseStore";
