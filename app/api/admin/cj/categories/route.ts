import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

type CJCategory = {
  categoryFirstName: string;
  categoryFirstList: Array<{
    categorySecondName: string;
    categorySecondList: Array<{
      categoryId: string;
      categoryName: string;
    }>;
  }>;
};

export async function GET() {
  try {
    const response = await cjGet<CJCategory[]>("product/getCategory");
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch CJ product categories." },
      { status: 500 }
    );
  }
}
