"use client";

import { useState } from "react";
import {
  DEFAULT_CALLOUT_BODY,
  DEFAULT_CALLOUT_TITLE,
  DEFAULT_CHART_ROWS,
  DEFAULT_HEADING,
  DEFAULT_NOTES,
  DEFAULT_SIZES,
  type SizeChartData,
  type SizeChartRow,
} from "@/lib/size-chart";

type Row = SizeChartRow;

function formatValue(inches: number | null | undefined, unit: "in" | "cm") {
  if (inches == null) return "—";
  if (unit === "in") return String(inches);
  return (inches * 2.54).toFixed(1);
}

function TeeDiagram() {
  return (
    <svg
      viewBox="0 0 340 280"
      role="img"
      aria-label="T-shirt diagram showing chest and length measurement points"
      className="mx-auto mt-6 w-full max-w-[340px] text-ink"
    >
      {/* Tee outline */}
      <path
        d="M140 34 C146 52, 174 52, 180 34 L214 42 L278 76 L256 138 L226 122 L226 252 L94 252 L94 122 L64 138 L42 76 L106 42 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Collar */}
      <path
        d="M140 34 Q160 58 180 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Drop seam annotation */}
      <line x1="252" y1="78" x2="286" y2="60" stroke="currentColor" strokeWidth="1" />
      <text x="270" y="54" fontSize="9" fill="currentColor" textAnchor="middle">
        drop seam
      </text>

      {/* 1 — Chest: horizontal arrow one inch below the armhole */}
      <line x1="104" y1="152" x2="148" y2="152" stroke="currentColor" strokeWidth="1.2" />
      <path d="M104 152 l6 -3 v6 z M148 152 l-6 -3 v6 z" fill="currentColor" />
      <line x1="172" y1="152" x2="216" y2="152" stroke="currentColor" strokeWidth="1.2" />
      <path d="M216 152 l-6 -3 v6 z M172 152 l6 -3 v6 z" fill="currentColor" />
      <circle cx="160" cy="152" r="11" fill="currentColor" />
      <text x="160" y="156" fontSize="11" fill="white" textAnchor="middle" fontWeight="700">
        1
      </text>

      {/* 2 — Length: vertical arrow from high point of shoulder to hem */}
      <line x1="200" y1="60" x2="200" y2="116" stroke="currentColor" strokeWidth="1.2" />
      <path d="M200 60 l-3 6 h6 z M200 116 l-3 -6 h6 z" fill="currentColor" />
      <line x1="200" y1="146" x2="200" y2="238" stroke="currentColor" strokeWidth="1.2" />
      <path d="M200 238 l-3 -6 h6 z M200 146 l3 6 h6 z" fill="currentColor" />
      <circle cx="200" cy="131" r="11" fill="currentColor" />
      <text x="200" y="135" fontSize="11" fill="white" textAnchor="middle" fontWeight="700">
        2
      </text>
    </svg>
  );
}

/**
 * Size chart panel: laid-flat measurement diagram + table with an IN/CM
 * toggle. Content comes from the product's `sizeChart` (edited in
 * Admin → Products) with sensible defaults as fallback; the column for
 * `selectedSize` (passed down from the size selector) is highlighted in
 * black. Headers are display-only — selection happens in the size selector.
 */
export default function SizeChart({
  selectedSize = "",
  sizes,
  data,
}: {
  selectedSize?: string;
  /** Fallback columns (the product's variant sizes) when no chart is stored. */
  sizes?: string[];
  /** Per-product chart content from Admin → Products. */
  data?: SizeChartData | null;
}) {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  const heading = data?.heading?.trim() || DEFAULT_HEADING;
  const notes = data?.notes?.trim() || DEFAULT_NOTES;
  const calloutTitle = data?.calloutTitle?.trim() || DEFAULT_CALLOUT_TITLE;
  const calloutBody = data?.calloutBody?.trim() || DEFAULT_CALLOUT_BODY;
  const rows: Row[] = data?.rows?.length ? data.rows : DEFAULT_CHART_ROWS;

  // Columns: admin-defined order when a chart is stored, else the product's
  // variant sizes, else the default S–2XL run. Deduped case-insensitively.
  const storedSizes = data?.sizes?.filter((size) => size.trim().length > 0);
  const source =
    storedSizes && storedSizes.length > 0
      ? storedSizes
      : sizes && sizes.length > 0
        ? sizes
        : DEFAULT_SIZES;
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const size of source) {
    const key = size.trim().toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    columns.push(size.trim());
  }

  const activeSize =
    columns.find(
      (size) => size.toUpperCase() === selectedSize.trim().toUpperCase(),
    ) ?? null;

  return (
    <div>
      {/* Subheader */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">{heading}</p>
        <div className="flex items-center gap-1.5" role="group" aria-label="Measurement unit">
          {(["in", "cm"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              className={`font-sans text-xs font-bold uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
                unit === u ? "text-ink" : "text-stone hover:text-ink"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <TeeDiagram />

      {/* Measurement table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-24" aria-hidden="true" />
              {columns.map((size) => (
                <th
                  key={size}
                  scope="col"
                  className={`px-2 py-3 text-center font-sans text-sm font-semibold transition-colors duration-150 ${
                    activeSize === size
                      ? "bg-ink text-white"
                      : "border-b border-stone/15 text-ink"
                  }`}
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="py-3 pr-3 align-middle font-sans text-sm font-normal text-ink">
                  <span className="flex items-center gap-2">
                    {row.callout ? (
                      <span
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white"
                        aria-hidden="true"
                      >
                        {row.callout}
                      </span>
                    ) : null}
                    {row.label}
                  </span>
                </th>
                {columns.map((size) => {
                  const value = row.values[size] ?? row.values[size.trim().toUpperCase()];
                  return (
                    <td
                      key={size}
                      className={`px-2 py-3 text-center font-mono text-sm transition-colors duration-150 ${
                        activeSize === size
                          ? "bg-ink font-medium text-white"
                          : "border-b border-stone/15 text-ink"
                      }`}
                    >
                      {formatValue(value, unit)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Measurement notes */}
      <p className="mt-4 font-sans text-sm leading-relaxed text-stone">
        {notes === DEFAULT_NOTES ? (
          <>
            <span className="font-medium text-ink">1</span>: one inch below the armhole,
            doubled.{" "}
            <span className="font-medium text-ink">2</span>: high point of shoulder to hem.
            Cut oversized; take your usual size, or one size down for a closer fit.
          </>
        ) : (
          notes
        )}
      </p>

      {/* Callout */}
      <div className="mt-4 border-l-2 border-ink bg-stone/5 px-4 py-3">
        <p className="font-sans text-sm leading-relaxed text-ink">
          <span className="font-bold">{calloutTitle}</span> {calloutBody}
        </p>
      </div>
    </div>
  );
}


