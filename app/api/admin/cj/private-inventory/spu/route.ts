import { NextResponse } from "next/server";
import { cjPost } from "@/lib/cj";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await cjPost<{
      pageNum: number;
      pageSize: number;
      totalCount: number;
      pageCount: number;
      content: Array<unknown>;
    }>("product/stock/privateInventory/querySpuPage", body);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to query private inventory." },
      { status: 500 }
    );
  }
}
