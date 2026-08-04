import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

type CJGlobalWarehouse = {
  areaCn: string;
  areaEn: string;
  areaId: number;
  countryCode: string;
  nameEn: string;
  valueEn: string;
  disabled: boolean;
  zh: string;
  en: string;
  de: string;
  fr: string;
  th: string;
  id: string;
};

export async function GET() {
  try {
    const response = await cjGet<CJGlobalWarehouse[]>("product/globalWarehouseList");
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch CJ global warehouses." },
      { status: 500 }
    );
  }
}
