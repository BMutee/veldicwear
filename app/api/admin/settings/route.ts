import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

const SETTING_FIELDS = [
  "storeName", "logo", "email", "phone", "address", "instagram", "facebook",
  "twitter", "tiktok", "youtube", "copyrightText", "footerNavLinks",
  "currency", "currencySymbol",
] as const;

type SettingField = (typeof SETTING_FIELDS)[number];

type SettingValue = string | null;

const DEFAULT_SETTINGS = {
  id: "store",
  storeName: "VELDIC WEAR",
  logo: null,
  email: null,
  phone: null,
  address: null,
  instagram: "https://instagram.com/veldicwear",
  facebook: null,
  twitter: null,
  tiktok: "https://tiktok.com/@veldicwear",
  youtube: "https://youtube.com/@veldicwear",
  copyrightText: "All rights reserved.",
  footerNavLinks: null,
  currency: "USD",
  currencySymbol: "$",
  updatedAt: new Date(),
};

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  let settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: DEFAULT_SETTINGS });
  }
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body: Record<string, unknown> = await request.json();

  // Allowlist of scalar settings fields; anything else in the payload is
  // ignored so arbitrary keys can never reach the Prisma update.
  const data = {} as { [K in SettingField]?: SettingValue };
  for (const field of SETTING_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    data[field] = value === null ? null : String(value);
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "store" },
    create: { ...DEFAULT_SETTINGS },
    update: data as { [K in SettingField]?: string },
  });

  return NextResponse.json(settings);
}
