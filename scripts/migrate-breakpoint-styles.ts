import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { HERO_DEFAULT_STYLES } from "../lib/hero-section";
import { FEATURED_DEFAULT_STYLES } from "../lib/featured-section";
import { FOOTER_DEFAULT_STYLES } from "../lib/footer-section";

type BreakpointValue = { mobile: number; desktop: number };
type StyleRecord = Record<string, unknown>;

type MigrationConfig = {
  key: string;
  defaults: StyleRecord;
  floors: Record<string, number>;
  maxima: Record<string, number>;
};

const configs: MigrationConfig[] = [
  {
    key: "hero",
    defaults: HERO_DEFAULT_STYLES as unknown as StyleRecord,
    floors: { paddingTop: 64, paddingBottom: 32, paddingX: 24, headlineFontSize: 40 },
    maxima: { paddingTop: 400, paddingBottom: 400, paddingX: 200, headlineFontSize: 200 },
  },
  {
    key: "featured-products",
    defaults: FEATURED_DEFAULT_STYLES as unknown as StyleRecord,
    floors: { paddingTop: 48, paddingBottom: 48, paddingX: 24, headingFontSize: 32 },
    maxima: { paddingTop: 400, paddingBottom: 400, paddingX: 200, headingFontSize: 160 },
  },
  {
    key: "footer",
    defaults: FOOTER_DEFAULT_STYLES as unknown as StyleRecord,
    floors: { paddingTop: 40, paddingBottom: 40, paddingX: 24 },
    maxima: { paddingTop: 400, paddingBottom: 400, paddingX: 200 },
  },
];

function migrateValue(
  raw: unknown,
  fallback: BreakpointValue,
  floor: number,
  maximum: number
): BreakpointValue {
  const rawDesktop =
    typeof raw === "number"
      ? raw
      : raw && typeof raw === "object" && typeof (raw as { desktop?: unknown }).desktop === "number"
        ? (raw as { desktop: number }).desktop
        : fallback.desktop;
  return {
    mobile: floor,
    desktop: Math.max(floor, Math.min(maximum, rawDesktop)),
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    for (const config of configs) {
      const row = await prisma.siteSection.findUnique({ where: { key: config.key } });
      if (!row) throw new Error(`Missing required SiteSection row: ${config.key}`);

      const content = row.content ? JSON.parse(row.content) as Record<string, unknown> : {};
      const currentStyles =
        content.styles && typeof content.styles === "object"
          ? content.styles as StyleRecord
          : {};
      const nextStyles: StyleRecord = { ...config.defaults, ...currentStyles };
      const migrated: Record<string, { before: unknown; after: BreakpointValue }> = {};

      for (const [field, floor] of Object.entries(config.floors)) {
        const fallback = config.defaults[field] as BreakpointValue;
        const next = migrateValue(currentStyles[field], fallback, floor, config.maxima[field]);
        migrated[field] = { before: currentStyles[field] ?? fallback.desktop, after: next };
        nextStyles[field] = next;
      }

      await prisma.siteSection.update({
        where: { key: config.key },
        data: { content: JSON.stringify({ ...content, styles: nextStyles }) },
      });
      console.log(JSON.stringify({ key: config.key, migrated }, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Breakpoint migration failed:", error);
  process.exit(1);
});
