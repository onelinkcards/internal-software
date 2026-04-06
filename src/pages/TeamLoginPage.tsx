import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../context/AuthProvider";
import { fetchMyProfile } from "../lib/internalStore";
import { LoginFrame, LoginSubmitButton, loginInputClass } from "../components/auth/LoginFrame";

export function TeamLoginPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/team";
  const { signInWithEmailPassword, supabaseConfigured } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A9FF]">Configuration</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
            Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold">VITE_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold">VITE_SUPABASE_ANON_KEY</code> in
            your deployment environment, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoginFrame
      variant="team"
      eyebrow="OneLink · Team"
      title="Staff sign in"
      description="Use the work email and password from your administrator. Sessions are secured with Supabase Auth."
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Work email</span>
          <input
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            className={loginInputClass.team}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={loginInputClass.team}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
      <LoginSubmitButton
        variant="team"
        disabled={!email.trim() || !password}
        busy={busy}
        busyLabel="Signing in…"
        label="Continue"
        onClick={() => {
          void (async () => {
            setError(null);
            setBusy(true);
            try {
              await signInWithEmailPassword(email, password);
              const profile = await fetchMyProfile();
              if (profile?.role === "super") {
                nav("/admin", { replace: true });
                return;
              }
              if (profile?.role !== "team") {
                setError("This account is not enabled for team access.");
                return;
              }
              nav(safeNext, { replace: true });
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Sign in failed.";
              setError(msg);
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
    </LoginFrame>
  );
}
