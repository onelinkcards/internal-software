import type { ReactNode } from "react";

type Variant = "team" | "admin";

const variantStyles: Record<Variant, { eyebrow: string; button: string; spinner: string }> = {
  team: {
    eyebrow: "text-[#00A9FF]",
    button:
      "bg-[#00A9FF] text-slate-950 shadow-[0_12px_32px_-12px_rgba(0,169,255,0.65)] hover:bg-[#33b8ff] active:scale-[0.99]",
    spinner: "border-slate-950/20 border-t-slate-950",
  },
  admin: {
    eyebrow: "text-slate-900",
    button:
      "bg-slate-900 text-white shadow-[0_12px_32px_-12px_rgba(15,23,42,0.45)] hover:bg-slate-800 active:scale-[0.99]",
    spinner: "border-white/25 border-t-white",
  },
};

export function LoginFrame({
  variant,
  eyebrow,
  title,
  description,
  children,
}: {
  variant: Variant;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const v = variantStyles[variant];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(0,169,255,0.08) 0%, transparent 45%),
            radial-gradient(circle at 80% 80%, rgba(15,23,42,0.06) 0%, transparent 40%)`,
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col justify-center px-5 py-14 sm:px-6">
        <div
          className={`rounded-[28px] border border-white/80 bg-white/95 p-8 shadow-[0_32px_64px_-32px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-10 ring-1 ${
            variant === "team" ? "ring-[#00A9FF]/20" : "ring-slate-900/10"
          }`}
        >
          <p className={`text-center text-[10px] font-black uppercase tracking-[0.28em] ${v.eyebrow}`}>{eyebrow}</p>
          <h1 className="mt-3 text-center text-[26px] font-black tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
          <p className="mx-auto mt-3 max-w-[320px] text-center text-[14px] leading-relaxed text-slate-500">{description}</p>
          <div className="mt-9">{children}</div>
        </div>
        <p className="mt-10 text-center text-[12px] font-medium text-slate-400">OneLink · secure sign-in</p>
      </div>
    </div>
  );
}

export function LoginSubmitButton({
  variant,
  disabled,
  busy,
  busyLabel,
  label,
  onClick,
}: {
  variant: Variant;
  disabled: boolean;
  busy: boolean;
  busyLabel: string;
  label: string;
  onClick: () => void;
}) {
  const v = variantStyles[variant];
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={`mt-8 w-full rounded-[14px] py-3.5 text-[15px] font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${v.button}`}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${v.spinner}`} />
          {busyLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

export const loginInputClass = {
  team: "mt-2 w-full rounded-[14px] border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00A9FF] focus:bg-white focus:ring-4 focus:ring-[#00A9FF]/12",
  admin:
    "mt-2 w-full rounded-[14px] border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10",
} as const;
