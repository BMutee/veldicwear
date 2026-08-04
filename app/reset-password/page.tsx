"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-[#1C1917]/10 bg-white p-8 sm:p-10">
        <Link
          href="/"
          className="inline-block font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]"
        >
          VELDIC
        </Link>

        {success ? (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Password Reset
            </h1>
            <p className="mt-3 font-sans text-sm leading-relaxed text-[#78716C]">
              Your password has been successfully reset. Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-8 font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">
              Reset Password
            </h1>
            <p className="mt-2 font-sans text-sm text-[#78716C]">
              Enter your new password below.
            </p>

            {error && (
              <div className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
                <p className="font-sans text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="password" className="block font-display text-xs font-bold uppercase tracking-[0.15em] text-[#1C1917]">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="mt-2 w-full border border-[#1C1917]/20 px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition-colors duration-200 bg-white placeholder:text-[#A8A29E] focus:border-[#CA8A04]"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block font-display text-xs font-bold uppercase tracking-[0.15em] text-[#1C1917]">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                  className="mt-2 w-full border border-[#1C1917]/20 px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition-colors duration-200 bg-white placeholder:text-[#A8A29E] focus:border-[#CA8A04]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-[#1C1917] py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-[#FAFAF9] transition-colors duration-200 hover:bg-[#CA8A04] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}