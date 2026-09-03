import { headers } from "next/headers";
import AdminCJStatus from "@/components/AdminCJStatus";
import AdminCJProductSync from "@/components/AdminCJProductSync";
import AdminCJInventory from "@/components/AdminCJInventory";
import AdminCJOrderSync from "@/components/AdminCJOrderSync";
import { PageContainer, PageHeader, LinkButton, AlertBanner } from "@/components/admin-ui/primitives";

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
    <PageContainer wide>
      <PageHeader
        title="CJ Dropshipping"
        description="Sync CJ catalog, inventory, and fulfillment with your store."
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="https://www.cjdropshipping.com/" target="_blank" rel="noopener noreferrer">
              Go to CJ Website
            </LinkButton>
            <LinkButton href="/admin/cj/browse" variant="secondary">
              Browse CJ Catalog
            </LinkButton>
          </div>
        }
      />

      <AlertBanner kind="info">
        <p className="font-semibold text-[#92400E]">Webhook URL — configure this in your CJ account</p>
        <code className="mt-1 block rounded-lg bg-white/60 px-2.5 py-1.5 font-mono text-xs break-all">
          {webhookUrl}
        </code>
      </AlertBanner>

      <div className="mt-6 space-y-6">
        <AdminCJStatus />
        <AdminCJProductSync />
        <AdminCJInventory />
        <AdminCJOrderSync />
      </div>
    </PageContainer>
  );
}