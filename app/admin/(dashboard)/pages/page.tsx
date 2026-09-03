import { requireAdmin } from "@/lib/admin-guard";
import AdminCmsClient from "@/components/AdminCmsClient";
import { PageContainer } from "@/components/admin-ui/primitives";

export default async function AdminPagesPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <AdminCmsClient />
    </PageContainer>
  );
}