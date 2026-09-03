import { requireAdmin } from "@/lib/admin-guard";
import AdminOrdersClient from "@/components/AdminOrdersClient";
import { PageContainer } from "@/components/admin-ui/primitives";

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <AdminOrdersClient />
    </PageContainer>
  );
}