import Link from "next/link";
import { headers } from "next/headers";
import AdminCJStatus from "@/components/AdminCJStatus";
import AdminCJProductSync from "@/components/AdminCJProductSync";
import AdminCJInventory from "@/components/AdminCJInventory";
import AdminCJOrderSync from "@/components/AdminCJOrderSync";

export const runtime = "nodejs";

async function getPublicBaseUrl() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function AdminCJPage() {
  const baseUrl = await getPublicBaseUrl();
  const webhookUrl = `${baseUrl}/api/webhook/cj`;

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-black">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-black/10 bg-slate-100 p-10 shadow-xl">
          <h1 className="text-4xl font-semibold">CJ Dropshipping</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.cjdropshipping.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917]/40 cursor-pointer"
            >
              Go to CJ Website → List to Store
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <Link
              href="/admin/cj/browse"
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]/40 cursor-pointer"
            >
              Browse CJ Catalog (optional)
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-clay/30 bg-clay/10 p-5 text-sm text-black/80">
            <p className="font-semibold text-[#92400E]">Webhook URL — configure this in your CJ account</p>
            <code className="mt-2 block rounded-lg bg-white px-3 py-2 font-mono text-xs break-all">
              {webhookUrl}
            </code>
          </div>
        </div>

        <AdminCJStatus />
        <AdminCJProductSync />
        <AdminCJInventory />
        <AdminCJOrderSync />
      </div>
    </main>
  );
}