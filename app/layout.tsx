import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { parseFooterContent } from "@/lib/footer-section";
import type { StoreSettings } from "@/lib/store-settings";
import { getActiveAnnouncement } from "@/lib/announcement";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

// Brand tagline used as the page description fallback when no live value exists.
const DESCRIPTION_FALLBACK =
  "Premium lifestyle & activewear for every journey. Wear the ground you cover.";

/**
 * Build page metadata from the live StoreSettings row. The title uses the
 * store name; the description comes from the footer content's brand
 * description (or a brand fallback). DB errors degrade gracefully to defaults
 * so a down DB never breaks SSR.
 */
export async function generateMetadata(): Promise<Metadata> {
  let storeName = "Veldic Wear";
  let description = DESCRIPTION_FALLBACK;
  try {
    const settings = await getStoreSettings();
    storeName = settings.storeName;
  } catch {
    /* keep defaults */
  }
  try {
    const footerSection = await prisma.siteSection.findUnique({
      where: { key: "footer" },
    });
    description =
      parseFooterContent(footerSection?.content ?? null).brandDescription ||
      DESCRIPTION_FALLBACK;
  } catch {
    /* keep fallback */
  }
  return {
    title: `${storeName} | Premium Lifestyle & Activewear`,
    description,
  };
}

/**
 * Hide Navbar & Footer on admin/auth pages.
 * The pathname is injected by proxy.ts via x-pathname header.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  // Currency resolved by proxy.ts (Vercel IP detection + cookie override).
  const viewerCurrency = h.get("x-viewer-currency") || "USD";
  const viewerCurrencySource = h.get("x-viewer-currency-source") || "ip";

  const hideUI =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-2fa");

  let footerContent: unknown = null;
  let navbarContent: unknown = null;
  let announcement: Awaited<ReturnType<typeof getActiveAnnouncement>> = null;
  let settings: StoreSettings | null = null;
  if (!hideUI) {
    try {
      settings = await getStoreSettings();
    } catch {
      settings = null;
    }
    try {
      const footerSection = await prisma.siteSection.findUnique({
        where: { key: "footer" },
      });
      footerContent = footerSection?.content
        ? JSON.parse(footerSection.content)
        : null;
    } catch {
      footerContent = null;
    }
    try {
      const navbarSection = await prisma.siteSection.findUnique({
        where: { key: "navbar" },
      });
      navbarContent = navbarSection?.content ? JSON.parse(navbarSection.content) : null;
    } catch {
      navbarContent = null;
    }
    try {
      announcement = await getActiveAnnouncement();
    } catch {
      announcement = null;
    }
  }

  return (
    <html
      lang="en"
      data-currency={viewerCurrency}
      data-currency-source={viewerCurrencySource}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bone text-ink antialiased">
        {!hideUI && <AnnouncementBar announcement={announcement} />}
        {!hideUI && (
          <Navbar
            settings={settings}
            content={navbarContent}
            currency={viewerCurrency}
          />
        )}
        {children}
        {!hideUI && <Footer content={footerContent} settings={settings} />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}