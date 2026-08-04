import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") ?? "";
  const page = url.searchParams.get("page") ?? "1";
  const size = url.searchParams.get("size") ?? "20";
  const categoryId = url.searchParams.get("categoryId") ?? "";

  const data = await cjGet<{
    pageSize: number;
    pageNumber: number;
    totalRecords: number;
    totalPages: number;
    content: Array<{
      productList: Array<Record<string, unknown>>;
    }>;
  }>("product/listV2", {
    keyWord: keyword,
    page,
    size,
    ...(categoryId ? { categoryId } : {}),
    features: JSON.stringify(["enable_description"]),
  });

  return NextResponse.json(data.data);
}
