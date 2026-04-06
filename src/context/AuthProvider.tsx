import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/browserClient";
import { fetchMyProfile, signOut as supabaseSignOut } from "../lib/supabaseStore";
import type { User } from "@supabase/supabase-js";

export type SessionState =
  | { role: "guest" }
  | { role: "team"; memberId: string; memberName: string; memberPhone: string }
  | { role: "super" };

type ProfileRow = {
  id: string;
  role: "team" | "super";
  display_name: string;
  phone: string;
};

type Ctx = {
  authReady: boolean;
  supabaseConfigured: boolean;
  session: SessionState;
  user: User | null;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const supabaseConfigured = typeof window !== "undefined" && !!getSupabaseBrowserClient();

  const loadProfile = useCallback(async () => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setProfile(null);
      return;
    }
    const p = await fetchMyProfile();
    if (!p) {
      setProfile(null);
      return;
    }
    setProfile({
      id: p.id,
      role: p.role,
      display_name: p.display_name,
      phone: p.phone,
    });
  }, []);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setAuthReady(true);
      return;
    }

    sb.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        return session?.user ? loadProfile() : Promise.resolve();
      })
      .finally(() => setAuthReady(true));

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadProfile();
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const session: SessionState = useMemo(() => {
    if (!user || !profile) return { role: "guest" };
    if (profile.role === "super") return { role: "super" };
    return {
      role: "team",
      memberId: profile.id,
      memberName: profile.display_name || user.email || "Team",
      memberPhone: profile.phone || "",
    };
  }, [user, profile]);

  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const sb = getSupabaseBrowserClient();
      if (!sb) throw new Error("Supabase is not configured.");
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      await loadProfile();
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  const v = useMemo(
    () => ({
      authReady,
      supabaseConfigured,
      session,
      user,
      signInWithEmailPassword,
      logout,
    }),
    [authReady, supabaseConfigured, session, user, signInWithEmailPassword, logout],
  );

  return <AuthContext.Provider value={v}>{children}</AuthContext.Provider>;
}

export function useSession(): Ctx & { session: SessionState } {
  const c = useContext(AuthContext);
  if (!c) throw new Error("AuthProvider missing");
  return c as Ctx & { session: SessionState };
}

/** @deprecated use useSession + signInWithEmailPassword */
export function useAuth() {
  return useSession();
}
