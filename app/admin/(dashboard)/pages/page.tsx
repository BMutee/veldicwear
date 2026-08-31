import { requireAdmin } from "@/lib/admin-guard";
import AdminCmsClient from "@/components/AdminCmsClient";

export default async function AdminPagesPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <AdminCmsClient />
      </div>
    </main>
  );
}