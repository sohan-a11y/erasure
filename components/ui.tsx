import type { ReactNode } from "react";

export function Panel({
  title,
  sub,
  children,
  badge,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
  badge?: string;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {sub ? <p className="mt-1 text-sm text-slate-400">{sub}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
            {badge}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-sky-500 text-black hover:bg-sky-400 disabled:bg-sky-900 disabled:text-slate-400"
      : variant === "danger"
        ? "bg-rose-500/90 text-black hover:bg-rose-400"
        : "border border-white/10 text-slate-200 hover:bg-white/5";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
