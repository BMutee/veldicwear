import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Warehouse id is required." }, { status: 400 });
  }

  try {
    const data = await cjGet<{
      id: string;
      name: string;
      areaId: number;
      areaCountryCode: string;
      address1: string;
      address2?: string | null;
      contacts?: string | null;
      phone?: string | null;
      city: string;
      province: string;
      logisticsBrandList: Array<{ id: string; name: string }>;
      isSelfPickup?: number | null;
      zipCode?: string | null;
    }>("warehouse/detail", { id });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch warehouse info." },
      { status: 500 }
    );
  }
}
