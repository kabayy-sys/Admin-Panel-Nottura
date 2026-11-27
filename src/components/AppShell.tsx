"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  UserCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CommandPalette } from "@/components/ui/CommandPalette";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: (active: boolean) => ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Dashboard",
    subtitle: "Ringkasan operasional, slot & arus kas bulanan",
    icon: (active) => (
      <LayoutGrid
        className={`h-[18px] w-[18px] transition-colors ${
          active
            ? "text-[#FAFAFA]"
            : "text-[#71717A] group-hover:text-[#E4E4E7]"
        }`}
        strokeWidth={1.8}
      />
    ),
  },
  {
    href: "/accounts",
    label: "Akun Google Pro",
    shortLabel: "Akun Pro",
    subtitle: "Manajemen grup Family Sharing & kapasitas slot",
    icon: (active) => (
      <UsersRound
        className={`h-[18px] w-[18px] transition-colors ${
          active
            ? "text-[#FAFAFA]"
            : "text-[#71717A] group-hover:text-[#E4E4E7]"
        }`}
        strokeWidth={1.8}
      />
    ),
  },
  {
    href: "/customers",
    label: "Datalist Pelanggan",
    shortLabel: "Pelanggan",
    subtitle: "Kontrol masa aktif, pengingat WA & perpanjangan",
    icon: (active) => (
      <UserCheck
        className={`h-[18px] w-[18px] transition-colors ${
          active
            ? "text-[#FAFAFA]"
            : "text-[#71717A] group-hover:text-[#E4E4E7]"
        }`}
        strokeWidth={1.8}
      />
    ),
  },
  {
    href: "/finance",
    label: "Keuangan / Cashflow",
    shortLabel: "Keuangan",
    subtitle: "Pencatatan pemasukan, modal akun & profit bersih",
    icon: (active) => (
      <Wallet
        className={`h-[18px] w-[18px] transition-colors ${
          active
            ? "text-[#FAFAFA]"
            : "text-[#71717A] group-hover:text-[#E4E4E7]"
        }`}
        strokeWidth={1.8}
      />
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authMode, loading, refresh, logout, submitting } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    if (!pathname?.startsWith("/login") && !user && !loading) {
      void refresh();
    }
  }, [pathname, user, loading, refresh]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  }, [logout, router]);

  if (pathname?.startsWith("/login")) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">{children}</div>
    );
  }

  const currentPage =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href),
    ) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col lg:flex-row">
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onLogout={handleLogout}
      />

      {/* Desktop Matte Architectural Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0C0C10] border-r border-white/[0.08] z-30">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.08]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-[#FAFAFA] text-[#09090B] flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-white transition">
              N
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#FAFAFA] block leading-none">
                Nottura
              </span>
              <span className="text-[11px] font-mono text-[#71717A] tracking-tight mt-1 block">
                admin.nottura.my.id
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71717A]">
            Operasional
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
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                  isActive
                    ? "text-[#FAFAFA]"
                    : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#17171D]/60"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 36,
                    }}
                    className="absolute inset-0 rounded-xl bg-[#17171D] border border-white/[0.1]"
                  >
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-full bg-[#FAFAFA]" />
                  </motion.span>
                ) : null}
                <span className="relative z-10 flex items-center gap-3">
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Logout Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#09090B]">
          {loading ? (
            <div className="space-y-2.5 py-1 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#17171D]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-[#17171D]" />
                  <div className="h-2.5 w-32 rounded bg-[#17171D]" />
                </div>
              </div>
              <div className="h-7 rounded-lg bg-[#17171D]" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-[#17171D] border border-white/[0.1] flex items-center justify-center text-xs font-semibold uppercase text-[#FAFAFA] shrink-0">
                  {user?.name ? user.name.slice(0, 2) : "NT"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#FAFAFA] truncate">
                    {user?.name ?? "Tim Nottura"}
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] truncate">
                    {user?.email ?? "admin@nottura.my.id"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#17171D] text-[#A1A1AA] border border-white/[0.08]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  {authMode === "dummy" ? "Lokal Dev" : "Google Auth"}
                </span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#17171D] hover:bg-[#22222A] border border-white/[0.08] transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* Solid Matte Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-[#09090B] border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="lg:hidden h-8 w-8 rounded-lg bg-[#FAFAFA] text-[#09090B] flex items-center justify-center font-bold text-xs shrink-0"
            >
              N
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-[#FAFAFA] tracking-tight truncate">
                {currentPage.label}
              </h1>
              <p className="hidden sm:block text-[11px] text-[#71717A] truncate">
                {currentPage.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#101014] hover:bg-[#17171D] border border-white/[0.09] px-2.5 sm:px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Navigasi cepat...</span>
              <kbd className="hidden sm:inline-flex items-center rounded bg-[#17171D] border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
                Ctrl K
              </kbd>
            </button>

            {loading ? (
              <div className="hidden sm:block h-8 w-28 rounded-xl bg-[#17171D] animate-pulse" />
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101014] border border-white/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-xs font-medium text-[#E4E4E7]">
                  {user ? user.name : "Admin"}
                </span>
                {user?.role ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#17171D] text-[#A1A1AA]">
                    {user.role}
                  </span>
                ) : null}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-xl bg-[#101014] border border-white/[0.09] text-[#A1A1AA] hover:text-[#FAFAFA] transition cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Top Slide-down Menu */}
        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden overflow-hidden bg-[#101014] border-b border-white/[0.08]"
            >
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <p className="text-xs font-semibold text-[#FAFAFA]">
                      {user?.name ?? "Admin Nottura"}
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A]">
                      {user?.email ?? "admin@nottura.my.id"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.1] cursor-pointer"
                  >
                    Keluar
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
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition ${
                          isActive
                            ? "bg-[#17171D] text-[#FAFAFA] border-white/[0.15]"
                            : "bg-[#0C0C10] text-[#A1A1AA] border-white/[0.07]"
                        }`}
                      >
                        {item.icon(isActive)}
                        <span>{item.shortLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Page Canvas */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0C0C10] border-t border-white/[0.08] px-2 py-1.5">
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
                className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
                  isActive
                    ? "text-[#FAFAFA]"
                    : "text-[#71717A] hover:text-[#E4E4E7]"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    className="absolute inset-x-2 inset-y-0.5 rounded-xl bg-[#17171D] border border-white/[0.1]"
                  />
                ) : null}
                <span className="relative z-10 flex flex-col items-center">
                  {item.icon(isActive)}
                  <span className="mt-1 truncate">{item.shortLabel}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
