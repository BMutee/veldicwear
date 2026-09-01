"use client";

// ─── Theme-editor UI primitives (Polaris style) ─────────────────────────────
// These are the local-field controls used by panels embedded in the theme
// editor (Navbar, Footer, Sections). They mirror the brand-styled primitives
// in AdminSectionShared, but use the theme editor's neutral design language:
// #303030 text, #616161 muted, #c9cccf borders, #005bd3 focus/accent, and the
// system font stack. Editing behavior is identical — only the look differs.

import { useState } from "react";
import { ANIMATION_TYPES, type AnimationType } from "@/lib/section-shared";
import Reveal from "./motion/Reveal";

export const T_INPUT_CLS =
  "w-full rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] text-[#303030] " +
  "shadow-[0_1px_0_0_rgba(0,0,0,0.05)] outline-none transition placeholder:text-[#8a8a8a] " +
  "focus:border-[#005bd3] focus:ring-2 focus:ring-[#005bd3]/25";
export const T_LABEL_CLS = "block space-y-1.5 text-[13px] font-medium text-[#303030]";
export const T_HINT_CLS = "text-xs text-[#8a8a8a]";
export const T_LEGEND_CLS = "text-xs font-semibold uppercase tracking-wide text-[#616161]";

/** Theme-editor tab button (bottom-border style, matches block manager tabs). */
export const ttabCls = (active: boolean) =>
  [
    "cursor-pointer rounded-t-md border-b-2 px-2.5 py-1.5 text-[13px] font-medium transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50",
    active ? "border-[#005bd3] text-[#303030]" : "border-transparent text-[#616161] hover:text-[#303030]",
  ].join(" ");

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function ThemeNumberField({
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
    <label className={T_LABEL_CLS}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(clampNumber(Number(e.target.value), min, max))}
        className={T_INPUT_CLS + " font-mono"}
      />
    </label>
  );
}

export function ThemeColorField({
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
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(normalizedForPicker) ? normalizedForPicker : "#000000";
  return (
    <div className={T_LABEL_CLS}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-11 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#c9cccf] transition focus-within:ring-2 focus-within:ring-[#005bd3]/40">
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toUpperCase());
            }}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span aria-hidden="true" className="block h-full w-full" style={{ backgroundColor: pickerValue }} />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
          placeholder="#FFFFFF"
          spellCheck={false}
          className={T_INPUT_CLS + " font-mono"}
        />
      </div>
    </div>
  );
}

export function ThemeBreakpointField({
  label,
  mobile,
  desktop,
  mobileMin,
  mobileMax,
  desktopMin,
  desktopMax,
  onChangeMobile,
  onChangeDesktop,
}: {
  label: string;
  mobile: number;
  desktop: number;
  mobileMin: number;
  mobileMax: number;
  desktopMin: number;
  desktopMax: number;
  onChangeMobile: (v: number) => void;
  onChangeDesktop: (v: number) => void;
}) {
  return (
    <div className={T_LABEL_CLS}>
      <span>{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <ThemeNumberField label="Mobile" min={mobileMin} max={mobileMax} value={mobile} onChange={onChangeMobile} />
        <ThemeNumberField label="Desktop" min={desktopMin} max={desktopMax} value={desktop} onChange={onChangeDesktop} />
      </div>
    </div>
  );
}

export function ThemePaddingFields({
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
  onChange: (next: typeof padding) => void;
  minTop?: number;
  minBottom?: number;
  minX?: number;
}) {
  return (
    <div className="space-y-4">
      <ThemeBreakpointField
        label="Padding top (px)"
        mobile={padding.paddingTop.mobile}
        desktop={padding.paddingTop.desktop}
        mobileMin={minTop}
        mobileMax={400}
        desktopMin={minTop}
        desktopMax={400}
        onChangeMobile={(v) => onChange({ ...padding, paddingTop: { ...padding.paddingTop, mobile: v } })}
        onChangeDesktop={(v) => onChange({ ...padding, paddingTop: { ...padding.paddingTop, desktop: v } })}
      />
      <ThemeBreakpointField
        label="Padding bottom (px)"
        mobile={padding.paddingBottom.mobile}
        desktop={padding.paddingBottom.desktop}
        mobileMin={minBottom}
        mobileMax={400}
        desktopMin={minBottom}
        desktopMax={400}
        onChangeMobile={(v) => onChange({ ...padding, paddingBottom: { ...padding.paddingBottom, mobile: v } })}
        onChangeDesktop={(v) => onChange({ ...padding, paddingBottom: { ...padding.paddingBottom, desktop: v } })}
      />
      <ThemeBreakpointField
        label="Horizontal padding (px)"
        mobile={padding.paddingX.mobile}
        desktop={padding.paddingX.desktop}
        mobileMin={minX}
        mobileMax={200}
        desktopMin={minX}
        desktopMax={200}
        onChangeMobile={(v) => onChange({ ...padding, paddingX: { ...padding.paddingX, mobile: v } })}
        onChangeDesktop={(v) => onChange({ ...padding, paddingX: { ...padding.paddingX, desktop: v } })}
      />
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

export function ThemeAnimationField({
  value,
  onChange,
}: {
  value: AnimationValue;
  onChange: (next: AnimationValue) => void;
}) {
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div className={T_LABEL_CLS}>
      <span>Animation</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as AnimationType })}
          className={T_INPUT_CLS + " cursor-pointer"}
          aria-label="Entrance animation type"
        >
          {ANIMATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {ANIMATION_LABELS[type]}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#c9cccf] px-3 py-2 text-[13px] text-[#616161]">
          <input
            type="checkbox"
            checked={value.scrollTrigger}
            disabled={value.type === "NONE"}
            onChange={(e) => onChange({ ...value, scrollTrigger: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-[#005bd3] disabled:cursor-not-allowed disabled:opacity-40"
          />
          Animate on scroll
        </label>
      </div>
      {value.type !== "NONE" && (
        <div className="flex items-center gap-3 pt-1">
          <Reveal
            key={replayKey}
            type={value.type}
            scrollTrigger={value.scrollTrigger}
            className="min-w-0 flex-1 rounded-md border border-[#e3e3e3] bg-white"
          >
            <div className="px-4 py-3 text-[13px] text-[#616161]">Sample content</div>
          </Reveal>
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="shrink-0 cursor-pointer rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] transition hover:bg-[#f7f7f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50"
          >
            Replay
          </button>
        </div>
      )}
    </div>
  );
}