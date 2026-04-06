import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSession } from "./context/AuthProvider";
import { TeamLoginPage } from "./pages/TeamLoginPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { TeamDashboard } from "./pages/TeamDashboard";
import { TeamInvoiceWorkspace, TeamInvoicePage } from "./pages/TeamInvoiceWorkspace";
import { ShortInvoicePage } from "./pages/ShortInvoicePage";
import { AdminShell } from "./pages/admin/AdminShell";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminTeamList } from "./pages/admin/AdminTeamList";
import { AdminMemberDetail } from "./pages/admin/AdminMemberDetail";
import { AdminWebsiteBookings } from "./pages/admin/AdminWebsiteBookings";
import { AdminNotifications } from "./pages/admin/AdminNotifications";
import type { ReactNode } from "react";

function SetupRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f1f5f9] px-6 text-center text-slate-900">
      <div className="max-w-lg rounded-[28px] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/40">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#00A9FF]">OneLink billing</p>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Supabase required</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
          Add <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">VITE_SUPABASE_ANON_KEY</code> to
          your environment (local <code className="text-xs">.env</code> or Vercel env vars). Run{" "}
          <code className="text-xs">supabase/schema.sql</code> in the Supabase SQL editor, then redeploy or restart dev.
        </p>
      </div>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f1f5f9] text-slate-600">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#00A9FF]" />
      <p className="text-sm font-semibold tracking-tight">Signing in…</p>
    </div>
  );
}

function usePublicInvoicePath() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/i/")) return true;
  if (pathname === "/invoice/share") return true;
  return false;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { session, authReady, supabaseConfigured } = useSession();
  const isPublic = usePublicInvoicePath();
  if (!isPublic && !supabaseConfigured) return <SetupRequired />;
  if (!isPublic && !authReady) return <AuthLoading />;
  if (session.role === "team") return <Navigate to="/team" replace />;
  if (session.role === "super") return <Navigate to="/admin" replace />;
  return children;
}

function RequireTeam() {
  const { session, authReady, supabaseConfigured } = useSession();
  if (!supabaseConfigured) return <SetupRequired />;
  if (!authReady) return <AuthLoading />;
  if (session.role === "guest") return <Navigate to="/team/login" replace />;
  if (session.role === "super") return <Navigate to="/admin" replace />;
  return <TeamDashboard />;
}

function RequireSuper({ children }: { children: ReactNode }) {
  const { session, authReady, supabaseConfigured } = useSession();
  if (!supabaseConfigured) return <SetupRequired />;
  if (!authReady) return <AuthLoading />;
  if (session.role === "guest") return <Navigate to="/admin/login" replace />;
  if (session.role !== "super") return <Navigate to="/team" replace />;
  return children;
}

function RequireTeamOrSuperForInvoice() {
  const { session, authReady, supabaseConfigured } = useSession();
  if (!supabaseConfigured) return <SetupRequired />;
  if (!authReady) return <AuthLoading />;
  if (session.role === "guest")
    return <Navigate to="/team/login?next=%2Fteam%2Finvoice" replace />;
  if (session.role !== "team" && session.role !== "super")
    return <Navigate to="/team/login" replace />;
  return <TeamInvoicePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/invoice/share" element={<TeamInvoiceWorkspace />} />
      <Route path="/i/:customerSlug/:invoiceNo" element={<ShortInvoicePage />} />
      <Route
        path="/team/login"
        element={
          <RequireGuest>
            <TeamLoginPage />
          </RequireGuest>
        }
      />
      <Route
        path="/admin/login"
        element={
          <RequireGuest>
            <AdminLoginPage />
          </RequireGuest>
        }
      />
      <Route path="/team" element={<RequireTeam />} />
      <Route path="/team/invoice" element={<RequireTeamOrSuperForInvoice />} />
      <Route
        path="/admin"
        element={
          <RequireSuper>
            <AdminShell />
          </RequireSuper>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="billing" element={<TeamInvoicePage />} />
        <Route path="team" element={<AdminTeamList />} />
        <Route path="team/:memberId" element={<AdminMemberDetail />} />
        <Route path="website" element={<AdminWebsiteBookings />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>
      <Route path="/" element={<Navigate to="/team/login" replace />} />
      <Route path="*" element={<Navigate to="/team/login" replace />} />
    </Routes>
  );
}
