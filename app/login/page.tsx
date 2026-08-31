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
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const inputClass = (hasError: boolean) =>
    `w-full border px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition-colors duration-200 bg-white placeholder:text-[#A8A29E] ${
      hasError
        ? "border-[#DC2626] focus:border-[#DC2626]"
        : "border-[#1C1917]/20 focus:border-[#CA8A04]"
    }`;

  const labelClass = "block font-display text-xs font-bold tracking-[0.15em] uppercase text-[#1C1917]";

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="border border-[#1C1917]/10 bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">
            Sign In
          </h1>
          <p className="mt-2 font-sans text-sm text-[#78716C]">
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
                  className="font-sans text-xs font-medium text-[#CA8A04] underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
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
                  ? "cursor-not-allowed bg-[#1C1917]/10 text-[#A8A29E]"
                  : "bg-[#1C1917] text-[#FAFAF9] hover:bg-[#CA8A04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04]"
              }`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-[#78716C]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#1C1917] underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}