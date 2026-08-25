import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Exactly one persisted owner for a reusable content block. */
export type BlockOwner = { pageId: string; sectionKey?: never } | { sectionKey: string; pageId?: never };

export function blockOwnerWhere(owner: BlockOwner): Prisma.BlockWhereInput {
  return "pageId" in owner ? { pageId: owner.pageId } : { sectionKey: owner.sectionKey };
}

export function blockOwnerData(owner: BlockOwner): Pick<Prisma.BlockCreateInput, "page" | "section"> {
  return "pageId" in owner
    ? { page: { connect: { id: owner.pageId } } }
    : { section: { connect: { key: owner.sectionKey } } };
}

/** Shared fetch path for CMS pages today and SiteSection-backed blocks later. */
export function findBlocksForOwner(owner: BlockOwner) {
  return prisma.block.findMany({ where: blockOwnerWhere(owner), orderBy: { order: "asc" } });
}
