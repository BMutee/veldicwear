import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function generateStaticParams() {
  const pages: { slug: string }[] = await prisma.cmsPage.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return pages.map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page) return {};
  return {
    title: page.seoTitle || `${page.title} | Veldic Wear`,
    description: page.metaDescription || undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.cmsPage.findUnique({ where: { slug } });

  // Published pages render; unpublished return 404 to public
  if (!page || !page.published) {
    // Check if it's a known static page that should fall through
    const staticSlugs = ["privacy", "terms", "faq", "about", "shipping", "shipping-policy", "returns", "returns-refund-policy"];
    if (staticSlugs.includes(slug)) {
      // Let the static page handle it
      notFound();
    }
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#CA8A04] hover:text-[#D49A11] transition-colors font-body mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="font-display text-4xl font-black text-[#1C1917] sm:text-5xl tracking-tight">
          {page.title}
        </h1>
        <p className="mt-2 font-sans text-sm text-[#78716C]">
          Last updated: {new Date(page.updatedAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </p>
        <div
          className="mt-10 prose prose-sm max-w-none font-sans text-[#44403C] leading-relaxed
            prose-headings:font-display prose-headings:text-[#1C1917] prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:mb-4 prose-p:leading-relaxed
            prose-a:text-[#CA8A04] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#1C1917]
            prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
            prose-li:marker:text-[#CA8A04]
            prose-blockquote:border-l-[#CA8A04] prose-blockquote:bg-[#FAFAF9] prose-blockquote:py-2 prose-blockquote:px-4
          "
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </main>
  );
}