import { requireAdmin } from "@/lib/admin-guard";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin-ui/toast";
import Script from "next/script";

// Navigation is defined in components/admin/AdminShell.tsx (grouped nav).

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ═══════════════════════════════════════════════════
  //  Server-side guard: checks session AND role === "admin"
  //  Redirects to /login or / if not authorized.
  // ═══════════════════════════════════════════════════
  await requireAdmin();

  return (
    <>
      <AdminShell>
        <ToastProvider>{children}</ToastProvider>
      </AdminShell>

      {/* Cloudinary Upload Widget — loaded on admin pages for product image uploads */}
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
      />
    </>
  );
}