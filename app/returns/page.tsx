import { redirect } from "next/navigation";

/**
 * The seeded footer/support links know /returns as the short URL for the
 * refund policy, and app/[slug]/page.tsx already lists "returns" as a static
 * slug. The canonical policy lives at /returns-refund-policy, so keep the short
 * URL working with a redirect instead of a dead link.
 */
export default function ReturnsRedirectPage() {
  redirect("/returns-refund-policy");
}
