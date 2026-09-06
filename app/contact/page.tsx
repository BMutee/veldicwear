"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(1, "Message is required.").max(5000, "Message must be under 5,000 characters."),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ContactFormData) => {
    if (loading || sent) return;
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        setServerError(body.error || "Failed to send message.");
        return;
      }

      setSent(true);
      reset();
    } catch {
      setServerError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full border px-4 py-3 font-sans text-sm text-[#1B2737] outline-none transition-colors duration-200 bg-white placeholder:text-[#5B6B85] ${
      hasError
        ? "border-[#DC2626] focus:border-[#DC2626]"
        : "border-[#1B2737]/20 focus:border-[#2563EB]"
    }`;

  const labelClass = "block font-display text-xs font-bold tracking-[0.15em] uppercase text-[#1B2737]";

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F3F7FC]">
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
          <div className="border border-[#1B2737]/10 bg-white p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-600/20 bg-green-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-[#1B2737]">
              Message Sent
            </h1>
            <p className="mt-3 font-sans text-sm leading-6 text-[#5B6B85]">
              Thank you for reaching out. We&rsquo;ll get back to you as soon as possible.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 bg-[#1B2737] px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#F3F7FC] transition-colors duration-200 hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] cursor-pointer"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F7FC]">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="border border-[#1B2737]/10 bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1B2737] sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 font-sans text-sm text-[#5B6B85]">
            Have a question, feedback, or need assistance? Send us a message and we&rsquo;ll respond promptly.
          </p>

          {serverError && (
            <div className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
              <p className="font-sans text-sm text-[#DC2626]">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                id="name"
                autoComplete="name"
                placeholder="Your full name"
                {...register("name")}
                className={`mt-2 ${inputClass(!!errors.name)}`}
              />
              {errors.name && (
                <p className="mt-1 font-sans text-xs text-[#DC2626]">{errors.name.message}</p>
              )}
            </div>

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
                <p className="mt-1 font-sans text-xs text-[#DC2626]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className={labelClass}>
                Subject
              </label>
              <input
                id="subject"
                placeholder="What is this about?"
                {...register("subject")}
                className={`mt-2 ${inputClass(!!errors.subject)}`}
              />
              {errors.subject && (
                <p className="mt-1 font-sans text-xs text-[#DC2626]">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                placeholder="Tell us more…"
                {...register("message")}
                className={`mt-2 resize-y ${inputClass(!!errors.message)}`}
              />
              {errors.message && (
                <p className="mt-1 font-sans text-xs text-[#DC2626]">{errors.message.message}</p>
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
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}