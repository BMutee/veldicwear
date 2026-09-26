import { redirect } from "next/navigation";

/**
 * The seeded footer support link is "Shipping & Returns" -> /shipping, and that
 * URL used to 404 because only app/[slug]/page.tsx claimed it. The canonical
 * policy now lives at /shipping-policy, so keep the short URL working with a
 * redirect instead of a dead link.
 */
export default function ShippingRedirectPage() {
  redirect("/shipping-policy");
}
