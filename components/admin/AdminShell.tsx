"use client";

// ─── Admin shell ─────────────────────────────────────────────────────────────
// Rebuilt application chrome for the admin panel:
//   desktop — fixed sidebar (ink), grouped navigation, collapsible with the
//             preference persisted in localStorage
//   mobile  — top bar + slide-in drawer (overlay, ESC + outside-click close,
//             body scroll lock)
// A11y: skip link, aria-current on active items, visible focus rings, ESC to
// close, labelled controls. Brand tokens (ink/moss/clay/bone) throughout.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

type NavItem = { label: string; href: string; icon: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25", exact: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
      { label: "Collections", href: "/admin/collections", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
      { label: "Orders", href: "/admin/orders", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" },
      { label: "Messages", href: "/admin/messages", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
    ],
  },
  {
    label: "Content & theme",
    items: [
      { label: "Theme editor", href: "/admin/editor", icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" },
      { label: "Pages & content", href: "/admin/pages", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
      { label: "Navbar", href: "/admin/navbar", icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" },
      { label: "Footer", href: "/admin/footer", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 9h16M4 13h16" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Security", href: "/admin/security", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
      { label: "Integrations", href: "/admin/integrations", icon: "M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.25 4.977l1.066 1.066m11.368 11.368l1.066 1.066M2.25 12h1.5m16.5 0h1.5" },
    ],
  },
];

const COLLAPSE_KEY = "veldic.admin.collapsed";

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

// ── Collapse preference external store (localStorage-backed) ─────────────────

const COLLAPSE_LISTENERS = new Set<() => void>();

function subscribeCollapse(listener: () => void) {
  COLLAPSE_LISTENERS.add(listener);
  // Cross-tab sync comes free via the storage event.
  window.addEventListener("storage", listener);
  return () => {
    COLLAPSE_LISTENERS.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getCollapseSnapshot(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    /* private mode */
    return false;
  }
}

function getServerCollapseSnapshot(): boolean {
  return false;
}

function setCollapsePref(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  COLLAPSE_LISTENERS.forEach((listener) => listener());
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop collapse preference — an external localStorage-backed store, read
  // via useSyncExternalStore so SSR renders the default and hydration swaps in
  // the persisted value without an effect-driven cascading render.
  const collapsed = useSyncExternalStore(subscribeCollapse, getCollapseSnapshot, getServerCollapseSnapshot);
  const toggleCollapsed = useCallback(() => {
    setCollapsePref(!getCollapseSnapshot());
  }, []);

  // Mobile drawer closes via nav-link onClick (renderNav(onNavigate)) and the
  // overlay/ESC handlers — no route-change effect needed.

  // ESC closes the drawer; lock body scroll while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const renderNav = (onNavigate?: () => void) => (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          {!collapsed && (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70 ${
                      collapsed ? "justify-center px-2" : ""
                    } ${active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                  >
                    <NavIcon path={item.icon} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-clay" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bone">
      {/* Skip link */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-moss focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-ink text-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`border-b border-white/10 ${collapsed ? "px-3" : "px-6"} py-5`}>
          <Link href="/admin" className="block" title="Veldic Admin">
            {collapsed ? (
              <span className="font-display text-lg font-bold tracking-tight">V</span>
            ) : (
              <>
                <span className="font-display text-xl font-bold tracking-tight">
                  VELDIC <span className="text-clay">Admin</span>
                </span>
                <p className="mt-0.5 text-xs text-white/40">Store management panel</p>
              </>
            )}
          </Link>
        </div>

        {renderNav()}

        <div className="border-t border-white/10 px-3 py-3">
          <Link
            href="/"
            target="_blank"
            title="Open storefront"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <NavIcon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            {!collapsed && "View storefront"}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <NavIcon path={collapsed ? "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" : "M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-ink px-4 text-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70"
        >
          <NavIcon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </button>
        <Link href="/admin" className="font-display text-lg font-bold tracking-tight">
          VELDIC <span className="text-clay">Admin</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          aria-label="Open storefront"
          className="ml-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70"
        >
          <NavIcon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </Link>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full cursor-pointer bg-ink/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <span className="font-display text-xl font-bold tracking-tight">
                VELDIC <span className="text-clay">Admin</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/70"
              >
                <NavIcon path="M6 18L18 6M6 6l12 12" />
              </button>
            </div>
            {renderNav(() => setMobileOpen(false))}
            <div className="border-t border-white/10 px-3 py-3">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <NavIcon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                View storefront
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className={`transition-[padding] duration-200 ${collapsed ? "md:pl-[72px]" : "md:pl-64"}`}>
        <main id="admin-main" className="min-h-screen">
          {children}
        </main>
      </div>

    </div>
  );
}


