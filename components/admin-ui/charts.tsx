import type { ReactNode } from "react";

/* ══════════════════════════════════════════════════════════════
   Veldic Admin — SVG charts
   Pure-SVG/DOM charts rendered on the server (no client JS, no
   chart library — mirrors the project's no-dependency precedent
   used for animations via <Reveal>).
   ══════════════════════════════════════════════════════════════ */

export type ChartPoint = { label: string; value: number };

function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-stone/30 bg-white text-sm text-stone">
      {label}
    </div>
  );
}

/* ─── Area / line chart ──────────────────────────────────────── */

export function AreaChart({
  data,
  height = 240,
  color = "#455A38",
  formatValue = (v: number) => String(Math.round(v)),
  chartId = "area",
  ariaLabel = "Trend chart",
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  chartId?: string;
  ariaLabel?: string;
}) {
  if (data.length === 0) return <EmptyChart />;

  const W = 640;
  const H = height;
  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max * 1.1;

  const x = (i: number) =>
    padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const linePath = `M${data
    .map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join("L")}`;
  const areaPath = `${linePath}L${x(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)}L${x(0).toFixed(1)},${(padT + innerH).toFixed(1)}Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);

  const labelIdx =
    data.length <= 8
      ? data.map((_, i) => i)
      : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((data.length - 1) * f));

  const gid = `grad-${chartId}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridVals.map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v).toFixed(1)}
            y2={y(v).toFixed(1)}
            stroke="rgba(23,21,18,0.08)"
            strokeWidth="1"
          />
          <text x={padL - 8} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="#8C8677">
            {formatValue(v)}
          </text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${gid})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={x(i).toFixed(1)}
            cy={y(d.value).toFixed(1)}
            r="3.5"
            fill="#fff"
            stroke={color}
            strokeWidth="1.5"
            className="opacity-0 transition-opacity duration-150 hover:opacity-100"
          />
          <circle cx={x(i).toFixed(1)} cy={y(d.value).toFixed(1)} r="12" fill="transparent">
            <title>{`${d.label}: ${formatValue(d.value)}`}</title>
          </circle>
        </g>
      ))}
      {labelIdx.map((i) => (
        <text key={i} x={x(i).toFixed(1)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8C8677">
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}

/* ─── Donut chart ────────────────────────────────────────────── */

export function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerValue,
  centerLabel,
  chartId = "donut",
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  chartId?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return <EmptyChart />;

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Donut chart${centerValue ? `: ${centerValue}` : ""}`}
      className="h-auto w-full"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(23,21,18,0.06)"
          strokeWidth={thickness}
        />
        {segments
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={`${chartId}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash.toFixed(2)} ${(c - dash).toFixed(2)}`}
                strokeDashoffset={(-acc * c).toFixed(2)}
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            );
            acc += frac;
            return el;
          })}
      </g>
      {centerValue && (
        <text x="50%" y="48%" textAnchor="middle" fontSize="22" fontWeight="700" fill="#171512">
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="#8C8677">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

/* ─── Horizontal bar list ────────────────────────────────────── */

export function BarList({
  data,
  formatValue = (v: number) => String(v),
  color = "bg-moss",
  emptyLabel = "No data yet",
}: {
  data: { label: string; value: number; sub?: string }[];
  formatValue?: (v: number) => string;
  color?: string;
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-stone">{emptyLabel}</div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{d.label}</span>
            <span className="shrink-0 font-mono text-xs text-stone">{formatValue(d.value)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/5">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
          {d.sub && <p className="mt-0.5 text-xs text-stone">{d.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; value: ReactNode; color: string }[];
}) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
          <span className="flex-1 truncate text-stone">{it.label}</span>
          <span className="font-mono text-xs text-ink">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

