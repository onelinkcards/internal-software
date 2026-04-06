import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TeamMember } from "../../lib/internalStore";
import { fetchTeamProfiles } from "../../lib/internalStore";
import { getSupabaseBrowserClient } from "../../lib/supabase/browserClient";

export function AdminTeamList() {
  const [tick, setTick] = useState(0);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setMembers(await fetchTeamProfiles());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [tick, load]);

  const createTeamMember = async () => {
    setCreateError(null);
    setCreateOk(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setCreateError("Name, email, and password are required.");
      return;
    }
    if (password.trim().length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }

    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setCreateError("Supabase client is not configured.");
      return;
    }

    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setCreateError("Session expired. Please log in again.");
      return;
    }

    setCreateBusy(true);
    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
        }),
      });

      const payload = (await res.json()) as { error?: string; user?: { email?: string } };
      if (!res.ok) {
        setCreateError(payload.error || "User creation failed.");
        return;
      }

      setCreateOk(`Team member created: ${payload.user?.email || email.trim()}`);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setTick((t) => t + 1);
    } catch {
      setCreateError("Network/server error while creating user.");
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Team members</h2>
        <p className="mt-1 text-sm text-slate-600">
          Super admin can create team login directly from this screen. New users are created in Supabase Authentication and
          added to roster automatically.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Create team member login</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void createTeamMember()}
            disabled={createBusy}
            className="rounded-xl bg-[#00A9FF] px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50"
          >
            {createBusy ? "Creating..." : "Create team login"}
          </button>
          {createOk ? <p className="text-sm font-semibold text-emerald-700">{createOk}</p> : null}
          {createError ? <p className="text-sm font-semibold text-red-700">{createError}</p> : null}
        </div>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h3 className="text-sm font-black text-slate-800">Roster</h3>
          <button
            type="button"
            className="text-sm font-bold text-[#00A9FF]"
            onClick={() => setTick((t) => t + 1)}
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">User id</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                    No team profiles yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{m.name}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{m.email || "—"}</p>
                      <p className="font-mono text-xs">{m.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">{m.id}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/admin/team/${m.id}`} className="font-bold text-[#00A9FF] hover:underline">
                        Open profile
                      </Link>
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
