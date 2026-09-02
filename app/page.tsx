import SectionRenderer from "@/components/sections/SectionRenderer";
import SectionHighlighter from "@/components/SectionHighlighter";
import { getRenderSections } from "@/lib/theme/render";
import { SECTION_DEFS } from "@/lib/theme/definitions/sections";
import { t } from "@/lib/theme/locales";
import { verifyPreviewToken } from "@/lib/preview-token";
import { Fragment } from "react";

// Editor preview wrappers label each section with its definition display name.
const SECTION_NAMES: Record<string, string> = Object.fromEntries(
  SECTION_DEFS.map((def) => [def.type, t(def.name)])
);

export const dynamic = "force-dynamic";

// ─── Homepage = ordered sections (Shopify JSON-template logic) ───────────────
// The render order and visibility live in the database (SiteSection.position
// and SiteSection.published), managed by /admin/editor. This file only maps
// section keys to components. With a valid preview token (?preview=1&t=…,
// minted by the admin editor) draft/hidden sections render too — that is how
// the editor's live preview shows sections before they go live.

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const preview =
    params.preview === "1" && verifyPreviewToken(typeof params.t === "string" ? params.t : null);

  const { sections } = await getRenderSections();
  const visible = preview ? sections : sections.filter((section) => !section.hidden);

  return (
    <>
      {visible.map((section) =>
        preview ? (
          <div
            key={section.id}
            data-veldic-section=""
            data-veldic-section-id={section.id}
            data-veldic-label={SECTION_NAMES[section.type] ?? section.type}
            {...(section.hidden ? { "data-veldic-hidden": "" } : {})}
          >
            <SectionRenderer section={section} />
          </div>
        ) : (
          <Fragment key={section.id}>
            <SectionRenderer section={section} />
          </Fragment>
        )
      )}
      {preview && <SectionHighlighter />}
    </>
  );
}

