import { NavLink, Outlet, Link } from "react-router-dom";
import { useSession } from "../../context/AuthProvider";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
    isActive
      ? "bg-gradient-to-r from-[#00A9FF]/25 to-transparent text-white shadow-[inset_3px_0_0_#00A9FF]"
      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
  }`;

export function AdminShell() {
  const { logout } = useSession();

  return (
    <div className="flex min-h-screen bg-[#eef2f6] text-slate-900">
      <aside className="hidden w-[272px] shrink-0 flex-col bg-gradient-to-b from-[#0a0f1a] via-[#0d1424] to-[#0a1628] text-white shadow-xl lg:flex">
        <div className="border-b border-white/[0.08] px-5 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00A9FF] text-lg font-black text-slate-950">
              OL
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">OneLink</p>
              <h1 className="text-base font-black leading-tight">Super admin</h1>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Revenue, GST view, team performance, website intake, and alerts.
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-wider text-slate-600">Navigate</p>
          <NavLink to="/admin" end className={navCls}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/billing" className={navCls}>
            Customer billing
          </NavLink>
          <NavLink to="/admin/team" className={navCls}>
            Team members
          </NavLink>
          <NavLink to="/admin/website" className={navCls}>
            Website funnel
          </NavLink>
          <NavLink to="/admin/notifications" className={navCls}>
            Notifications
          </NavLink>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <Link
            to="/admin/billing"
            state={{ fresh: true }}
            className="flex w-full items-center justify-center rounded-xl bg-[#00A9FF] py-3 text-center text-[13px] font-black text-slate-950 shadow-lg shadow-[#00A9FF]/25"
          >
            Customer billing
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[13px] font-bold text-white hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#00A9FF]">OneLink</p>
              <span className="text-sm font-black text-slate-900">Super admin</span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
            >
              Log out
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-bold">
            <NavLink to="/admin" end className="text-[#00A9FF]">
              Home
            </NavLink>
            <NavLink to="/admin/billing" className="text-[#00A9FF]">
              Billing
            </NavLink>
            <NavLink to="/admin/team" className="text-[#00A9FF]">
              Team
            </NavLink>
            <NavLink to="/admin/website" className="text-[#00A9FF]">
              Website
            </NavLink>
            <NavLink to="/admin/notifications" className="text-[#00A9FF]">
              Alerts
            </NavLink>
            <Link to="/admin/billing" state={{ fresh: true }} className="text-slate-600">
              New invoice
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
