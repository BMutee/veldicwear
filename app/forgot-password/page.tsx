"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotFormData) => {
    if (loading) return;
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setServerError(errData.error || "Failed to send reset email.");
      }
    } catch {
      setServerError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full border px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition-colors duration-200 bg-white placeholder:text-[#A8A29E] ${
      hasError
        ? "border-[#DC2626] focus:border-[#DC2626]"
        : "border-[#1C1917]/20 focus:border-[#CA8A04]"
    }`;

  const labelClass =
    "block font-display text-xs font-bold tracking-[0.15em] uppercase text-[#1C1917]";

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="border border-[#1C1917]/10 bg-white p-8 sm:p-10">
          <Link
            href="/"
            className="inline-block font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]"
          >
            VELDIC
          </Link>

          {sent ? (
            <div className="mt-8">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
                Check Your Email
              </h1>
              <p className="mt-3 font-sans text-sm leading-relaxed text-[#78716C]">
                If an account with{" "}
                <strong className="text-[#1C1917]">
                  {watch("email")}
                </strong>{" "}
                exists, you will receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block font-sans text-sm font-medium text-[#CA8A04] underline underline-offset-2 hover:text-[#1C1917] transition-colors duration-200"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mt-8 font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">
                Forgot Password
              </h1>
              <p className="mt-2 font-sans text-sm text-[#78716C]">
                Enter your email and we&rsquo;ll send you a reset link.
              </p>

              {serverError && (
                <div className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
                  <p className="font-sans text-sm text-[#DC2626]">
                    {serverError}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-6"
              >
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    {...register("email")}
                    className={`mt-2 ${inputClass(!!errors.email)}`}
                  />
                  {errors.email && (
                    <p className="mt-1 font-sans text-xs text-[#DC2626]">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 font-display text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 cursor-pointer ${
                    loading
                      ? "cursor-not-allowed bg-[#1C1917]/10 text-[#A8A29E]"
                      : "bg-[#1C1917] text-[#FAFAF9] hover:bg-[#CA8A04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04]"
                  }`}
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="mt-6 text-center font-sans text-sm text-[#78716C]">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1C1917] underline decoration-[#CA8A04]/40 underline-offset-2 hover:decoration-[#CA8A04] transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}