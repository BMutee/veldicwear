"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyTotp, sendEmailOtp, verifyEmailOtp } = useAuth();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    if (loading) return;
    setServerError("");
    setLoading(true);

    const result = await login(data.email, data.password);

    if (!result.success) {
      setServerError(result.error || "Login failed.");
      setLoading(false);
      return;
    }

    // Account has 2FA enabled — show the code-entry step. The session is only
    // created after the code is verified (see handleVerify2fa).
    if (result.twoFactorRedirect) {
      setShow2fa(true);
      setLoading(false);
      return;
    }

    // Check user role and redirect accordingly
    // Wait a moment for session to propagate
    setTimeout(() => {
      if (result.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    }, 300);
  };

  const handleVerify2fa = async (code: string) => {
    if (twoFactorLoading) return;
    setTwoFactorError("");
    setTwoFactorLoading(true);

    // Try the authenticator-app code first.
    let result = await verifyTotp(code);
    if (!result.success) {
      // Fall back to treating it as an emailed OTP code.
      result = await verifyEmailOtp(code);
    }

    if (!result.success) {
      setTwoFactorError(result.error || "Invalid code. Try again.");
      setTwoFactorLoading(false);
      return;
    }

    setTimeout(() => {
      if (result.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    }, 300);
  };

  const handleSendEmailCode = async () => {
    setTwoFactorError("");
    const result = await sendEmailOtp();
    if (!result.success) {
      setTwoFactorError(result.error || "Failed to send the email code.");
      return;
    }
    setTwoFactorError("");
  };

  const inputClass = (hasError: boolean) =>
    `w-full border px-4 py-3 font-sans text-sm text-[#1B2737] outline-none transition-colors duration-200 bg-white placeholder:text-[#5B6B85] ${
      hasError
        ? "border-[#DC2626] focus:border-[#DC2626]"
        : "border-[#1B2737]/20 focus:border-[#2563EB]"
    }`;

  const labelClass = "block font-display text-xs font-bold tracking-[0.15em] uppercase text-[#1B2737]";

  return (
    <main className="min-h-screen bg-[#F3F7FC]">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="border border-[#1B2737]/10 bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1B2737] sm:text-4xl">
            Sign In
          </h1>
          <p className="mt-2 font-sans text-sm text-[#5B6B85]">
            Welcome back. Enter your credentials to continue.
          </p>

          {serverError && (
            <div className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
              <p className="font-sans text-sm text-[#DC2626]">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
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

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-sans text-xs font-medium text-[#2563EB] underline decoration-[#2563EB]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#2563EB] cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...register("password")}
                className={`mt-2 ${inputClass(!!errors.password)}`}
              />
              {errors.password && (
                <p className="mt-1 font-sans text-xs text-[#DC2626]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 font-display text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 cursor-pointer ${
                loading
                  ? "cursor-not-allowed bg-[#1B2737]/10 text-[#5B6B85]"
                  : "bg-[#1B2737] text-[#F3F7FC] hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
              }`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {show2fa && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify2fa(twoFactorCode.trim());
              }}
              className="mt-8 space-y-6 border-t border-[#1B2737]/10 pt-8"
            >
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-[#1B2737]">
                  Two-factor verification
                </h2>
                <p className="mt-2 font-sans text-sm text-[#5B6B85]">
                  Enter the 6-digit code from your authenticator app, or the code we emailed you.
                </p>
              </div>

              {twoFactorError && (
                <div className="border border-[#DC2626]/30 bg-[#DC2626]/5 p-4" role="alert">
                  <p className="font-sans text-sm text-[#DC2626]">{twoFactorError}</p>
                </div>
              )}

              <div>
                <label htmlFor="twoFactorCode" className={labelClass}>
                  Verification code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, ""));
                    setTwoFactorError("");
                  }}
                  className={`mt-2 text-center font-mono text-lg tracking-[0.4em] ${inputClass(!!twoFactorError)}`}
                />
              </div>

              <button
                type="submit"
                disabled={twoFactorLoading || twoFactorCode.length < 6}
                className={`w-full py-3.5 font-display text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 cursor-pointer ${
                  twoFactorLoading || twoFactorCode.length < 6
                    ? "cursor-not-allowed bg-[#1B2737]/10 text-[#5B6B85]"
                    : "bg-[#1B2737] text-[#F3F7FC] hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
                }`}
              >
                {twoFactorLoading ? "Verifying…" : "Verify code"}
              </button>

              <p className="text-center font-sans text-xs text-[#5B6B85]">
                No authenticator app?{" "}
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  className="font-semibold text-[#2563EB] underline decoration-[#2563EB]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#2563EB] cursor-pointer"
                >
                  Email me a code
                </button>
              </p>
            </form>
          )}

          <p className="mt-6 text-center font-sans text-sm text-[#5B6B85]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#1B2737] underline decoration-[#2563EB]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#2563EB] cursor-pointer"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}