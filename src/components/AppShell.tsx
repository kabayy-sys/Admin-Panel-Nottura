"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: (active: boolean) => ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? "text-white" : "text-white/60"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Akun Google Pro",
    shortLabel: "Akun Pro",
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? "text-white" : "text-white/60"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Datalist Pelanggan",
    shortLabel: "Pelanggan",
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? "text-white" : "text-white/60"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    href: "/finance",
    label: "Keuangan / Cashflow",
    shortLabel: "Keuangan",
    icon: (active) => (
      <svg
        className={`h-5 w-5 ${active ? "text-white" : "text-white/60"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authMode, logout, submitting } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Halaman login tampil full-screen tanpa sidebar/header
  if (pathname?.startsWith("/login")) {
    return <div className="min-h-screen bg-[#121212] text-white">{children}</div>;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  const currentPage =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href),
    ) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#090A33] border-r border-white/10 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-base tracking-tight text-white group-hover:bg-white/15 transition">
              N
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-white block leading-none">
                Nottura
              </span>
              <span className="text-[11px] text-white/60 tracking-wide">
                admin.nottura.my.id
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-white/45">
            Menu Operasional
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : Boolean(pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/12 text-white border border-white/15 shadow-sm"
                    : "text-white/65 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {item.icon(isActive)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Logout Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-semibold uppercase text-white">
              {user?.name ? user.name.slice(0, 2) : "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.name ?? "Tim Nottura"}
              </p>
              <p className="text-xs text-white/60 truncate">
                {user?.email ?? "admin@nottura.my.id"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 text-white/70 border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {authMode === "dummy" ? "Fase 1 (Lokal)" : "Google OAuth"}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-[#090A33]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Brand */}
            <Link
              href="/"
              className="lg:hidden h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-bold text-sm text-white"
            >
              N
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {currentPage.label}
              </h1>
              <p className="hidden sm:block text-xs text-white/60">
                Panel Operasional Internal Google AI Pro & Cashflow Nottura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80">
                {user ? `${user.name}` : "Admin Nottura"}
              </span>
              {user?.role ? (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                  {user.role}
                </span>
              ) : null}
            </div>

            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Top Slide-down Menu */}
        {mobileMenuOpen ? (
          <div className="lg:hidden bg-[#090A33] border-b border-white/10 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.name ?? "Admin Nottura"}
                </p>
                <p className="text-xs text-white/60">
                  {user?.email ?? "admin@nottura.my.id"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-200 border border-rose-500/30"
              >
                Logout
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : Boolean(pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border ${
                      isActive
                        ? "bg-white/12 text-white border-white/20"
                        : "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    {item.icon(isActive)}
                    <span>{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Page Canvas */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Nyaman dipakai dari HP sesuai PRD) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#090A33]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : Boolean(pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {item.icon(isActive)}
                <span className="mt-1 truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
