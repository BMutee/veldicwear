"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";

/* ══════════════════════════════════════════════════════════════
   Veldic Admin — UI primitives
   On-brand building blocks (ink / moss / clay / stone / bone)
   shared by every admin page. No external UI dependency.
   ══════════════════════════════════════════════════════════════ */

/* ─── Spinner ────────────────────────────────────────────────── */

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ─── Button ─────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-moss text-white hover:bg-[#37472C] focus-visible:ring-moss/50 shadow-sm",
  secondary:
    "bg-white text-ink border border-stone/30 hover:border-moss hover:text-moss focus-visible:ring-moss/50 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 shadow-sm",
  ghost: "bg-transparent text-stone hover:text-ink hover:bg-ink/5 focus-visible:ring-ink/20",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  type = "button",
  onClick,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ─── Form controls ──────────────────────────────────────────── */

const FIELD_CLS =
  "w-full rounded-lg border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder:text-stone/70 transition-colors duration-150 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 disabled:cursor-not-allowed disabled:bg-ink/5";

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone">{hint}</span>}
    </label>
  );
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  min,
  max,
  step,
  className = "",
  ariaLabel,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={`${FIELD_CLS} ${className}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={`${FIELD_CLS} cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  required,
  disabled,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      className={`${FIELD_CLS} resize-y ${className}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-moss" : "bg-stone/40"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ─── Display ────────────────────────────────────────────────── */

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink/5 text-stone",
    success: "bg-moss/10 text-moss",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    accent: "bg-clay/10 text-clay",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps free-form order/status strings to a Badge tone. */
export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone =
    s === "delivered" || s === "paid" || s === "confirmed"
      ? "success"
      : s === "pending" || s === "processing"
        ? "warning"
        : s === "cancelled" || s === "failed" || s === "refunded"
          ? "danger"
          : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-stone/20 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone/20 px-5 py-4">
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone/30 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-1 text-stone/60">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-stone">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}


