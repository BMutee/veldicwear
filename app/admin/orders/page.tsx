import { requireAdmin } from "@/lib/admin-guard";
import AdminOrdersClient from "@/components/AdminOrdersClient";

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-7xl">
        <AdminOrdersClient />
      </div>
    </main>
  );
}