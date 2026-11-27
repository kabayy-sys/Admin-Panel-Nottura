"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  LayoutGrid,
  LogOut,
  Search,
  UserCheck,
  UsersRound,
  Wallet,
} from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
}

export function CommandPalette({
  open,
  onOpenChange,
  onLogout,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: "dashboard",
        label: "Buka Dashboard Utama",
        hint: "Ringkasan KPI & Grafik",
        keywords: "dashboard home kpi grafik omzet",
        icon: <LayoutGrid className="h-4 w-4 text-[#A1A1AA]" />,
        run: () => router.push("/"),
      },
      {
        id: "accounts",
        label: "Kelola Akun Google Pro",
        hint: "Grup Family Sharing & Slot Ready",
        keywords: "akun google pro family group slot",
        icon: <UsersRound className="h-4 w-4 text-[#A1A1AA]" />,
        run: () => router.push("/accounts"),
      },
      {
        id: "customers",
        label: "Datalist Pelanggan",
        hint: "Tambah, perpanjang, & remind WA",
        keywords: "pelanggan customer wa gmail",
        icon: <UserCheck className="h-4 w-4 text-[#A1A1AA]" />,
        run: () => router.push("/customers"),
      },
      {
        id: "expiring",
        label: "Pelanggan H-3 Expired",
        hint: "Prioritas penagihan ≤ 3 hari",
        keywords: "h-3 expired tagih jatuh tempo",
        icon: <AlertTriangle className="h-4 w-4 text-[#EAB308]" />,
        run: () => router.push("/customers?status=expiring_soon"),
      },
      {
        id: "finance",
        label: "Keuangan / Cashflow",
        hint: "Riwayat kas masuk/keluar & CSV",
        keywords: "keuangan cashflow profit omzet modal csv",
        icon: <Wallet className="h-4 w-4 text-[#A1A1AA]" />,
        run: () => router.push("/finance"),
      },
      {
        id: "logout",
        label: "Keluar dari Panel",
        hint: "Akhiri sesi admin saat ini",
        keywords: "logout keluar signout",
        icon: <LogOut className="h-4 w-4 text-[#EF4444]" />,
        run: () => void onLogout(),
      },
    ],
    [router, onLogout],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.keywords.includes(q),
    );
  }, [actions, query]);

  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      } else if (open && event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function executeAction(action: CommandAction) {
    onOpenChange(false);
    action.run();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cmdk-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-[60] bg-black/75 flex items-start justify-center pt-[14vh] px-4"
        >
          <motion.div
            key="cmdk-panel"
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#101014] border border-white/[0.12] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
              <Search className="h-4 w-4 text-[#71717A] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) =>
                      filtered.length > 0 ? (prev + 1) % filtered.length : 0,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) =>
                      filtered.length > 0
                        ? (prev - 1 + filtered.length) % filtered.length
                        : 0,
                    );
                  } else if (e.key === "Enter" && filtered[activeIndex]) {
                    e.preventDefault();
                    executeAction(filtered[activeIndex]);
                  }
                }}
                placeholder="Ketik perintah atau halaman tujuan..."
                className="flex-1 bg-transparent text-sm text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none"
              />
              <kbd className="rounded-md bg-[#17171D] border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#71717A]">
                  Tidak ada perintah yang cocok.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const selected = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => executeAction(item)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                        selected
                          ? "bg-[#17171D] text-[#FAFAFA]"
                          : "text-[#A1A1AA] hover:bg-[#17171D]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#0C0C10] border border-white/[0.08] flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#FAFAFA] truncate">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-[#71717A] truncate">
                            {item.hint}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          selected
                            ? "text-[#FAFAFA] translate-x-0.5"
                            : "text-[#52525B]"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
