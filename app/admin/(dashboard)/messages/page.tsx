import { requireAdmin } from "@/lib/admin-guard";
import AdminMessagesClient from "@/components/AdminMessagesClient";
import { PageContainer } from "@/components/admin-ui/primitives";

export default async function AdminMessagesPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <AdminMessagesClient />
    </PageContainer>
  );
}
