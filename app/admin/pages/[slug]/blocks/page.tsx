import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminBlocksClient from "@/components/AdminBlocksClient";

export default async function AdminBlocksPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug }, select: { id: true } });
  if (!page) notFound();
  return <AdminBlocksClient slug={slug} />;
}
