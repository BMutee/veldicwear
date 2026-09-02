import { NextResponse } from "next/server";
import { renderToReadableStream } from "react-dom/server.edge";
import type { ReactElement } from "react";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { getStoreSettings } from "@/lib/settings";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { getSectionDef } from "@/lib/theme/definitions/sections";
import { getBlockDef } from "@/lib/theme/definitions/blocks";
import { resolveSettings } from "@/lib/theme/resolve";
import { renderSectionRequestSchema } from "@/lib/theme/types";
import type { ResolvedSection, SettingValues } from "@/lib/theme/types";

export const runtime = "nodejs";

// ─── Single-section render endpoint (Section Rendering API equivalent) ───────
// Given a section definition type and a PROPOSED settings/blocks payload
// (typically unsaved editor state), re-runs only that section's definition
// and returns its HTML. Callers morph/patch this fragment into a live preview
// without re-rendering the whole page.
//
// react-dom/server.edge is used (not react-dom/server): Next 16 hard-bans the
// Node entry in server bundles, while the edge entry works in every runtime
// and exposes the same streaming renderer over web streams.

async function renderElementToHtml(node: ReactElement): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const stream = await renderToReadableStream(node, { signal: controller.signal });
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let html = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = renderSectionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid render request." }, { status: 400 });
  }

  const def = getSectionDef(parsed.data.type);
  if (!def) {
    return NextResponse.json({ error: `Unknown section type: ${parsed.data.type}` }, { status: 404 });
  }

  let globalSettings: SettingValues = {};
  try {
    globalSettings = (await getStoreSettings()) as unknown as SettingValues;
  } catch {
    // resolver falls back to schema defaults
  }

  const section: ResolvedSection = {
    id: "preview",
    type: def.type,
    hidden: false,
    settings: resolveSettings(def.settings, parsed.data.settings, globalSettings),
    blocks: parsed.data.blocks.map((block, index) => {
      const blockDef = getBlockDef(block.type);
      return {
        id: `preview_block_${index}`,
        type: block.type,
        static: true,
        settings: resolveSettings(blockDef?.settings ?? [], block.settings, globalSettings),
        blocks: [],
      };
    }),
  };

  // The element is created outside the try: element construction is pure and
  // must not be entangled with render-error handling (react-hooks/error-boundaries).
  const element = <SectionRenderer section={section} />;

  try {
    const html = await renderElementToHtml(element);
    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Section render failed." },
      { status: 500 }
    );
  }
}
