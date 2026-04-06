import { useCallback, useEffect, useState } from "react";
import type { NotificationLog } from "../../lib/internalStore";
import { fetchNotifications } from "../../lib/internalStore";

function Section({
  title,
  subtitle,
  accent,
  items,
}: {
  title: string;
  subtitle: string;
  accent: string;
  items: { id: string; at: string; subject: string; preview: string; to: string }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`border-b border-slate-100 px-5 py-4 ${accent}`}>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <li className="px-5 py-10 text-center text-sm text-slate-500">No entries.</li>
        ) : (
          items.map((n) => (
            <li key={n.id} className="px-5 py-3">
              <p className="text-[11px] text-slate-500">{new Date(n.at).toLocaleString()}</p>
              <p className="mt-0.5 font-bold text-slate-900">{n.subject}</p>
              <p className="mt-1 text-xs text-slate-600">
                To: {n.to} — {n.preview}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function AdminNotifications() {
  const [tick, setTick] = useState(0);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setNotifications(await fetchNotifications());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed.");
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [tick, load]);

  const team = notifications.filter((n) => n.channel === "team");
  const website = notifications.filter((n) => n.channel === "website");
  const system = notifications.filter((n) => n.channel === "system" || !n.channel);

  const mapItems = (list: NotificationLog[]) =>
    list.slice(0, 40).map((n) => ({
      id: n.id,
      at: n.at,
      subject: n.subject,
      preview: n.preview,
      to: n.to,
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">OneLink</p>
          <h2 className="text-2xl font-black text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Activity from team invoices, website funnel sync, and admin actions (stored in Supabase).
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#00A9FF]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Team · invoices"
          subtitle="Saved paid / unpaid from staff workflow"
          accent="bg-sky-50/80"
          items={mapItems(team)}
        />
        <Section
          title="Website · intake"
          subtitle="Leads and paid orders from the site"
          accent="bg-violet-50/80"
          items={mapItems(website)}
        />
        <Section
          title="System · admin"
          subtitle="Mark paid, deletes, and other control actions"
          accent="bg-slate-50"
          items={mapItems(system)}
        />
      </div>
    </div>
  );
}
