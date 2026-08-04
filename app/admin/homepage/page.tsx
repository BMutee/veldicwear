import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminHomepageClient from "@/components/AdminHomepageClient";

type HomepageData = {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  heroImage: string;
  heroButtonText: string;
  heroButtonLink: string;
  trustProductCount: string;
  trustMemberCount: string;
  trustRating: string;
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
  updatedAt: Date;
};

const defaults: HomepageData = {
  id: "homepage",
  heroTitle: "FORGE\nYOUR\nEDGE",
  heroSubtitle: "Performance-driven apparel engineered for the relentless. Train. Dominate. Repeat.",
  heroTagline: "Fall / Winter 2026",
  heroImage: "",
  heroButtonText: "Shop Now",
  heroButtonLink: "/shop",
  trustProductCount: "200+",
  trustMemberCount: "50K+",
  trustRating: "4.9",
  featuredSectionTitle: "New Arrivals",
  featuredSectionSubtitle: "The latest drops engineered for the relentless.",
  updatedAt: new Date(),
};

export default async function AdminHomepagePage() {
  await requireAdmin();

  const dbData = (await prisma.homepage.findUnique({ where: { id: "homepage" } })) as HomepageData | null;
  const homepage: HomepageData = dbData || defaults;

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-3xl">
        <AdminHomepageClient homepage={homepage} />
      </div>
    </main>
  );
}