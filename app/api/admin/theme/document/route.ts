import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import {
  TEMPLATE_TYPE,
  getTemplateDocument,
  saveTemplateDocument,
} from "@/lib/theme/document";


export const runtime = "nodejs";

// ─── Template document API (the editor's persistence endpoint) ───────────────
// The editor's data model IS the stored JSON document — there is no separate
// draft format. GET returns the current document; PUT validates and persists
// a full document (autosave debounces writes client-side).

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { doc, source } = await getTemplateDocument();
  return NextResponse.json({ templateType: TEMPLATE_TYPE, doc, source });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const doc = await saveTemplateDocument(body);
    return NextResponse.json({ ok: true, doc });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to save template document." },
      { status: 400 }
    );
  }
}
