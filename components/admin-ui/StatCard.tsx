import Link from "next/link";
import type { ReactNode } from "react";

/* ══════════════════════════════════════════════════════════════
   Veldic Admin — StatCard (KPI)
   Server-renderable. Optional delta vs previous period with
   direction-aware coloring (goodWhen="down" for metrics where
   a decrease is an improvement, e.g. cancellations).
   ══════════════════════════════════════════════════════════════ */

export function StatCard({
  label,
  value,
  sub,
  delta,
  deltaLabel = "vs previous 30 days",
  icon,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: number; goodWhen?: "up" | "down" };
  deltaLabel?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const showDelta =
    delta && typeof delta.value === "number" && Number.isFinite(delta.value);
  const deltaGood = showDelta
    ? delta!.goodWhen === "down"
      ? delta!.value <= 0
      : delta!.value >= 0
    : false;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-stone">{sub}</p>}
        </div>
        {icon && (
          <div className="shrink-0 rounded-lg bg-moss/10 p-2 text-moss [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </div>
        )}
      </div>
      {showDelta && (
        <p
          className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
            deltaGood ? "text-moss" : "text-red-600"
          }`}
        >
          {delta!.value >= 0 ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
          {Math.abs(delta!.value).toFixed(0)}% {deltaLabel}
        </p>
      )}
    </>
  );

  const cls =
    "block rounded-xl border border-stone/20 bg-white p-5 shadow-sm transition-colors duration-200";

  return href ? (
    <Link href={href} className={`${cls} cursor-pointer hover:border-moss/50`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
