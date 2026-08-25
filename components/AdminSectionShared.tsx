"use client";

// Shared admin-editor UI primitives for SiteSection-backed editors
// (FeaturedProducts, Footer) — mirrors the Hero editor's styling exactly.

import { useState } from "react";
import { ANIMATION_TYPES, type AnimationType } from "@/lib/section-shared";
import Reveal from "./motion/Reveal";

export const INPUT_CLS =
  "w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none " +
  "focus:border-moss focus:ring-2 focus:ring-moss/20 transition font-body bg-white";

export const LABEL_CLS = "block space-y-1.5 text-sm font-medium text-stone font-body";

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export const TAB_BTN_CLS = (active: boolean) =>
  [
    "cursor-pointer px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 rounded-t",
    active ? "border-moss text-ink" : "border-transparent text-stone hover:text-ink",
  ].join(" ");

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const normalizedForPicker = /^#[0-9a-fA-F]{3}$/.test(value)
    ? "#" + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]
    : value;

  return (
    <div className={LABEL_CLS}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-stone/20 focus-within:ring-2 focus-within:ring-moss/40 transition">
          <input
            type="color"
            value={normalizedForPicker}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                onChange(e.target.value.toUpperCase());
              }
            }}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className="block h-full w-full"
            style={{ backgroundColor: normalizedForPicker }}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
          placeholder="#FAFAF8"
          spellCheck={false}
          className={INPUT_CLS + " font-mono"}
        />
      </div>
    </div>
  );
}

export function NumberField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={LABEL_CLS}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        value={value}
        onChange={(e) =>
          onChange(clampNumber(Number(e.target.value), min, max))
        }
        className={INPUT_CLS + " font-mono"}
      />
    </label>
  );
}

export function PaddingFields({
  padding,
  onChange,
  minTop = 48,
  minBottom = 48,
  minX = 24,
}: {
  padding: {
    paddingTop: { mobile: number; desktop: number };
    paddingBottom: { mobile: number; desktop: number };
    paddingX: { mobile: number; desktop: number };
  };
  onChange: (
    key: "paddingTop" | "paddingBottom" | "paddingX",
    breakpoint: "mobile" | "desktop",
    value: number
  ) => void;
  minTop?: number;
  minBottom?: number;
  minX?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <BreakpointField
        label="Padding top (px)"
        mobile={padding.paddingTop.mobile}
        desktop={padding.paddingTop.desktop}
        mobileMin={minTop}
        desktopMin={minTop}
        mobileMax={400}
        desktopMax={400}
        onChangeMobile={(v) => onChange("paddingTop", "mobile", v)}
        onChangeDesktop={(v) => onChange("paddingTop", "desktop", v)}
      />
      <BreakpointField
        label="Padding bottom (px)"
        mobile={padding.paddingBottom.mobile}
        desktop={padding.paddingBottom.desktop}
        mobileMin={minBottom}
        desktopMin={minBottom}
        mobileMax={400}
        desktopMax={400}
        onChangeMobile={(v) => onChange("paddingBottom", "mobile", v)}
        onChangeDesktop={(v) => onChange("paddingBottom", "desktop", v)}
      />
      <BreakpointField
        label="Horizontal padding (px)"
        mobile={padding.paddingX.mobile}
        desktop={padding.paddingX.desktop}
        mobileMin={minX}
        desktopMin={minX}
        mobileMax={200}
        desktopMax={200}
        onChangeMobile={(v) => onChange("paddingX", "mobile", v)}
        onChangeDesktop={(v) => onChange("paddingX", "desktop", v)}
      />
    </div>
  );
}

/**
 * A labeled field with separate Mobile / Desktop number inputs (used by the
 * Banner editor for per-breakpoint sizing). Mobile inputs can carry a tighter
 * max so an admin can't accidentally blow out a 375px viewport (e.g. heading).
 */
export function BreakpointField({
  label,
  mobile,
  desktop,
  mobileMin = 0,
  mobileMax = 200,
  desktopMin = 0,
  desktopMax = 200,
  onChangeMobile,
  onChangeDesktop,
}: {
  label: string;
  mobile: number;
  desktop: number;
  mobileMin?: number;
  mobileMax?: number;
  desktopMin?: number;
  desktopMax?: number;
  onChangeMobile: (v: number) => void;
  onChangeDesktop: (v: number) => void;
}) {
  return (
    <div className={LABEL_CLS}>
      <span>{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Mobile"
          min={mobileMin}
          max={mobileMax}
          value={mobile}
          onChange={onChangeMobile}
        />
        <NumberField
          label="Desktop"
          min={desktopMin}
          max={desktopMax}
          value={desktop}
          onChange={onChangeDesktop}
        />
      </div>
    </div>
  );
}

export type AnimationValue = { type: AnimationType; scrollTrigger: boolean };

const ANIMATION_LABELS: Record<AnimationType, string> = {
  NONE: "None",
  FADE: "Fade",
  SLIDE_UP: "Slide up",
  SLIDE_IN: "Slide in",
};

/**
 * Entrance-animation control: type dropdown + scroll-trigger toggle, with a
 * live sample box that plays the chosen effect (Replay remounts it). The
 * sample runs through the same <Reveal> mechanism the live site uses, so its
 * prefers-reduced-motion behavior is identical to production.
 */
export function AnimationField({
  value,
  onChange,
}: {
  value: AnimationValue;
  onChange: (next: AnimationValue) => void;
}) {
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div className={LABEL_CLS}>
      <span>Animation</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={value.type}
          onChange={(e) =>
            onChange({ ...value, type: e.target.value as AnimationType })
          }
          className={INPUT_CLS + " cursor-pointer"}
          aria-label="Entrance animation type"
        >
          {ANIMATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {ANIMATION_LABELS[type]}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-stone">
          <input
            type="checkbox"
            checked={value.scrollTrigger}
            disabled={value.type === "NONE"}
            onChange={(e) =>
              onChange({ ...value, scrollTrigger: e.target.checked })
            }
            className="h-4 w-4 cursor-pointer accent-moss disabled:cursor-not-allowed disabled:opacity-40"
          />
          Animate on scroll into view
        </label>
      </div>
      {value.type !== "NONE" && (
        <div className="flex items-center gap-3 pt-1">
          <Reveal
            key={replayKey}
            type={value.type}
            scrollTrigger={value.scrollTrigger}
            className="min-w-0 flex-1 rounded-lg border border-stone/20 bg-white"
          >
            <div className="px-4 py-3 text-sm text-stone">
              Sample content — plays the selected entrance.
            </div>
          </Reveal>
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="shrink-0 cursor-pointer rounded-lg border border-stone/20 px-4 py-2.5 text-sm font-medium text-stone transition hover:border-moss hover:text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
          >
            Replay
          </button>
        </div>
      )}
      <p className="text-xs text-stone">
        Site-wide guarantee: visitors with reduced motion enabled always see
        content instantly and fully visible.
      </p>
    </div>
  );
}
