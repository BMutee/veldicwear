import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  try {
    const response = await cjGet("shopping/query-order", { orderId });
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch CJ order details." },
      { status: 500 }
    );
  }
}
