import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { listThreads, type InboxFilter } from "@/lib/message-threads";

const FILTERS: InboxFilter[] = ["open", "unread", "archived", "all"];

/**
 * The admin inbox: conversations, newest activity first.
 *
 *   GET /api/admin/messages?filter=open|unread|archived|all&search=…
 */
export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const url = new URL(request.url);
  const rawFilter = url.searchParams.get("filter") ?? "open";
  const filter: InboxFilter = FILTERS.includes(rawFilter as InboxFilter)
    ? (rawFilter as InboxFilter)
    : "open";
  const search = url.searchParams.get("search") ?? undefined;

  const threads = await listThreads({ filter, search });

  return NextResponse.json(threads);
}
