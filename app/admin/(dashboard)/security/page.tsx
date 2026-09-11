"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import QRCode from "react-qr-code";

export default function AdminSecurityPage() {
  const { user, loading: authLoading, authClient } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
  const [verificationCode, setVerificationCode] = useState("");

  /**
   * Extract the raw base32 secret from the otpauth URI so the user can type
   * it into their authenticator app manually.
   * The old regex parsed the URI LABEL (email) instead of the `secret=`
   * query param, so the displayed "key" was rejected by authenticator apps.
   */
  const manualKey = useMemo(() => {
    if (!totpUri) return "";
    try {
      const url = new URL(totpUri);
      return url.searchParams.get("secret") ?? "";
    } catch {
      return "";
    }
  }, [totpUri]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    checkStatus();
  }, [user, authLoading, router]);

  const checkStatus = async () => {
    try {
      const { data } = await authClient.getSession();
      const su = data?.user as any;
      setTwoFactorEnabled(su?.twoFactorEnabled ?? false);
    } catch {
      // not enabled
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!password) return;
    setActionLoading(true);
    setMessage(null);
    try {
      // Step 1: Enable 2FA - get TOTP URI
      const res = await authClient.twoFactor.enable({ password }) as any;
      if (res.error) {
        setMessage({ type: "error", text: res.error.message || "Failed to enable 2FA." });
        setActionLoading(false);
        return;
      }
      const data = res.data;
      if (data?.totpURI) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes ?? data.recoveryCodes ?? null);
        setStep("setup");
        setMessage({ type: "success", text: "2FA key generated! Scan the QR code or enter the key in your authenticator app, then verify with a code." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "An error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: verificationCode }) as any;
      if (res.error) {
        setMessage({ type: "error", text: res.error.message || "Invalid code. Try again." });
      } else {
        setTwoFactorEnabled(true);
        setStep("idle");
        setMessage({ type: "success", text: "✅ Two-factor authentication is now active!" });
        setPassword("");
        setVerificationCode("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "An error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await authClient.twoFactor.disable({ password }) as any;
      if (res.error) {
        setMessage({ type: "error", text: res.error.message || "Failed to disable 2FA." });
      } else {
        setTwoFactorEnabled(false);
        setTotpUri(null);
        setBackupCodes(null);
        setStep("idle");
        setMessage({ type: "success", text: "Two-factor authentication disabled." });
        setPassword("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "An error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl">
          <p className="font-sans text-sm text-stone">Loading security settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink">
          Security Settings
        </h1>
        <p className="mt-2 font-sans text-sm text-stone">
          Manage your account security and two-factor authentication.
        </p>

        {message && (
          <div
            className={`mt-6 border p-4 font-sans text-sm ${
              message.type === "success"
                ? "border-green-600/30 bg-moss/5 text-moss"
                : "border-red-600/30 bg-clay/5 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 2FA Section */}
        <div className="mt-10 border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                twoFactorEnabled ? "bg-moss/50" : "bg-[#78716C]"
              }`}
            />
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
              Two-Factor Authentication
            </h2>
          </div>
          <p className="mt-3 font-sans text-sm leading-relaxed text-stone">
            {twoFactorEnabled
              ? "2FA is active. You'll need an authenticator app code when signing in."
              : "Add an extra layer of security. Scan the QR code with Google Authenticator or any TOTP app."}
          </p>

          {/* TOTP Setup - Show QR code / key */}
          {step === "setup" && totpUri && (
            <div className="mt-6 space-y-4">
              {/* QR Code — rendered locally (the old chart.googleapis.com
                  API was shut down by Google, so the <img> never loaded) */}
              <div className="flex justify-center">
                <div className="border-2 border-ink/10 p-4 bg-white">
                  <QRCode value={totpUri} size={192} data-testid="totp-qr" />
                </div>
              </div>

              {/* Manual setup key */}
              <div className="bg-ink/5 p-4">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-stone mb-2">
                  Or enter this key manually:
                </p>
                <code className="block bg-white border border-ink/10 px-4 py-3 font-mono text-sm text-ink break-all select-all">
                  {manualKey || totpUri}
                </code>
              </div>

              {/* Verify */}
              <div>
                <label htmlFor="verify-code" className="block font-display text-xs font-bold uppercase tracking-[0.15em] text-ink">
                  Verify with a code from your app
                </label>
                <input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  className="mt-2 w-full border border-ink/20 px-4 py-3 font-sans text-sm text-ink outline-none transition-colors duration-200 bg-white placeholder:text-stone focus:border-clay text-center text-2xl tracking-[0.3em]"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={actionLoading || verificationCode.length !== 6}
                className="w-full bg-clay py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors duration-200 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {actionLoading ? "Verifying…" : "Verify & Activate 2FA"}
              </button>
            </div>
          )}

          {/* Backup Codes Display */}
          {backupCodes && backupCodes.length > 0 && step !== "setup" && (
            <div className="mt-4 border border-clay/30 bg-clay/5 p-4">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-clay">
                ⚠ Save these backup codes
              </p>
              <p className="mt-1 font-sans text-xs text-stone">
                Each code can be used once if you lose access to your authenticator app.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="bg-white border border-ink/10 px-3 py-1.5 font-mono text-xs text-ink">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}

          {step !== "setup" && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="2fa-password" className="block font-display text-xs font-bold uppercase tracking-[0.15em] text-ink">
                  Confirm Password
                </label>
                <input
                  id="2fa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="mt-2 w-full border border-ink/20 px-4 py-3 font-sans text-sm text-ink outline-none transition-colors duration-200 bg-white placeholder:text-stone focus:border-clay"
                />
              </div>

              {twoFactorEnabled ? (
                <button
                  onClick={handleDisable}
                  disabled={actionLoading || !password}
                  className="w-full border border-[#B91C1C] py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-[#B91C1C] transition-colors duration-200 hover:bg-[#B91C1C] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {actionLoading ? "Disabling…" : "Disable 2FA"}
                </button>
              ) : (
                <button
                  onClick={handleEnable}
                  disabled={actionLoading || !password}
                  className="w-full bg-ink py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors duration-200 hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {actionLoading ? "Setting up…" : "Set Up 2FA"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-6 border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
            Account
          </h2>
          <div className="mt-4 space-y-2 font-sans text-sm text-ink">
            <p><span className="text-stone">Email: </span>{user?.email}</p>
            <p><span className="text-stone">Role: </span><span className="font-bold text-clay uppercase">{user && 'role' in user ? (user as any).role : 'admin'}</span></p>
            <p><span className="text-stone">Name: </span>{user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}