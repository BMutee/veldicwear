import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

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

  const body = await request.json();

  const data: any = {};
  const fields = [
    "storeName", "email", "phone", "address", "instagram", "facebook",
    "twitter", "tiktok", "youtube", "copyrightText", "footerNavLinks",
    "currency", "currencySymbol",
  ];
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "store" },
    create: { ...DEFAULT_SETTINGS, ...data },
    update: data,
  });

  return NextResponse.json(settings);
}