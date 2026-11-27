"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CalendarPlus,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type {
  CustomerRow,
  CustomerStatus,
  EnrichedCustomer,
  FamilyGroupWithSlots,
  PaymentMethod,
} from "@/types/database";
import {
  PACKAGE_OPTIONS,
  calculateDefaultEndDate,
  calculateRenewedEndDate,
  checkDuplicateGmail,
  filterCustomers,
  getDefaultPackagePrice,
  getTodayDateString,
} from "@/lib/logic/customer";
import { normalizeWhatsApp } from "@/lib/logic/whatsapp";
import { useCustomers } from "@/hooks/useCustomers";
import {
  buildDemoEnrichedCustomers,
  buildDemoGroupsWithSlots,
  buildDemoSeed,
} from "@/components/demo-data";
import {
  formatRupiah,
  formatShortDate,
  getCustomerStatusMeta,
} from "@/components/formatters";
import { CopyButton } from "@/components/ui/CopyButton";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/MotionPrimitives";
import { useToast } from "@/components/ui/ToastProvider";

const STATUS_TABS: { value: CustomerStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "expiring_soon", label: "H-3 Expired" },
  { value: "expired", label: "Expired" },
];

function CustomersContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") as
    | CustomerStatus
    | "all"
    | null;

  const {
    customers,
    allCustomers,
    groups,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    groupFilter,
    setGroupFilter,
    loading,
    submitting,
    error,
    supabaseConfigured,
    checkGmailDuplicate,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    renewCustomer,
  } = useCustomers(initialStatusParam ?? "all");

  useEffect(() => {
    if (
      initialStatusParam === "active" ||
      initialStatusParam === "expiring_soon" ||
      initialStatusParam === "expired"
    ) {
      setStatusFilter(initialStatusParam);
    }
  }, [initialStatusParam, setStatusFilter]);

  const initialDemo = useMemo(() => buildDemoSeed(), []);
  const [demoRawCustomers, setDemoRawCustomers] = useState<CustomerRow[]>(
    initialDemo.customers,
  );
  const isUsingDemo = !supabaseConfigured && allCustomers.length === 0;

  const activeGroups: FamilyGroupWithSlots[] = useMemo(() => {
    if (isUsingDemo) {
      return buildDemoGroupsWithSlots(initialDemo.groups, demoRawCustomers);
    }
    return groups;
  }, [isUsingDemo, initialDemo.groups, demoRawCustomers, groups]);

  const activeAllCustomers: EnrichedCustomer[] = useMemo(() => {
    if (isUsingDemo) {
      return buildDemoEnrichedCustomers(initialDemo.groups, demoRawCustomers);
    }
    return allCustomers;
  }, [isUsingDemo, initialDemo.groups, demoRawCustomers, allCustomers]);

  const activeCustomers: EnrichedCustomer[] = useMemo(() => {
    if (isUsingDemo) {
      return filterCustomers(activeAllCustomers, {
        search,
        status: statusFilter,
        familyGroupId: groupFilter,
      });
    }
    return customers;
  }, [
    isUsingDemo,
    activeAllCustomers,
    search,
    statusFilter,
    groupFilter,
    customers,
  ]);

  const counts = useMemo(() => {
    return {
      all: activeAllCustomers.length,
      active: activeAllCustomers.filter((c) => c.status === "active").length,
      expiring_soon: activeAllCustomers.filter(
        (c) => c.status === "expiring_soon",
      ).length,
      expired: activeAllCustomers.filter((c) => c.status === "expired").length,
    };
  }, [activeAllCustomers]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<EnrichedCustomer | null>(null);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [gmail, setGmail] = useState("");
  const [familyGroupId, setFamilyGroupId] = useState("");
  const [packageName, setPackageName] = useState(PACKAGE_OPTIONS[0].name);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(
    calculateDefaultEndDate(getTodayDateString(), 30),
  );
  const [recordIncome, setRecordIncome] = useState(true);
  const [incomeAmount, setIncomeAmount] = useState(PACKAGE_OPTIONS[0].price);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [gmailWarning, setGmailWarning] = useState<string | null>(null);

  const [renewTarget, setRenewTarget] = useState<EnrichedCustomer | null>(null);
  const [renewDays, setRenewDays] = useState(30);
  const [renewRecordIncome, setRenewRecordIncome] = useState(true);
  const [renewAmount, setRenewAmount] = useState(35000);
  const [renewPaymentMethod, setRenewPaymentMethod] =
    useState<PaymentMethod>("QRIS");

  function openCreateModal() {
    const today = getTodayDateString();
    setEditingCustomer(null);
    setFullName("");
    setWhatsapp("");
    setGmail("");
    setFamilyGroupId(activeGroups[0]?.id ?? "");
    setPackageName(PACKAGE_OPTIONS[0].name);
    setStartDate(today);
    setEndDate(calculateDefaultEndDate(today, 30));
    setRecordIncome(true);
    setIncomeAmount(PACKAGE_OPTIONS[0].price);
    setPaymentMethod("QRIS");
    setGmailWarning(null);
    setFormModalOpen(true);
  }

  function openEditModal(customer: EnrichedCustomer) {
    setEditingCustomer(customer);
    setFullName(customer.full_name);
    setWhatsapp(customer.whatsapp);
    setGmail(customer.gmail);
    setFamilyGroupId(customer.family_group_id ?? "");
    setPackageName(customer.package_name);
    setStartDate(customer.start_date);
    setEndDate(customer.end_date);
    setGmailWarning(null);
    setFormModalOpen(true);
  }

  function handleGmailChange(value: string) {
    setGmail(value);
    const check = isUsingDemo
      ? checkDuplicateGmail(value, demoRawCustomers, editingCustomer?.id)
      : checkGmailDuplicate(value, editingCustomer?.id);
    setGmailWarning(check.warningMessage);
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    try {
      setEndDate(calculateDefaultEndDate(value, 30));
    } catch {
      // ignore partial input
    }
  }

  function handlePackageChange(value: string) {
    setPackageName(value);
    setIncomeAmount(getDefaultPackagePrice(value));
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWa = normalizeWhatsApp(whatsapp);

    try {
      if (isUsingDemo) {
        if (editingCustomer) {
          setDemoRawCustomers((prev) =>
            prev.map((c) =>
              c.id === editingCustomer.id
                ? {
                    ...c,
                    full_name: fullName.trim(),
                    whatsapp: normalizedWa,
                    gmail: gmail.trim().toLowerCase(),
                    family_group_id: familyGroupId || null,
                    package_name: packageName,
                    start_date: startDate,
                    end_date: endDate,
                  }
                : c,
            ),
          );
          toast.success(`Data ${fullName.trim()} diperbarui`);
        } else {
          setDemoRawCustomers((prev) => [
            {
              id: `demo-cust-${Date.now()}`,
              full_name: fullName.trim(),
              whatsapp: normalizedWa,
              gmail: gmail.trim().toLowerCase(),
              family_group_id: familyGroupId || null,
              package_name: packageName,
              start_date: startDate,
              end_date: endDate,
              created_by: "nottura@local",
              created_at: getTodayDateString(),
            },
            ...prev,
          ]);
          toast.success(`Pelanggan ${fullName.trim()} ditambahkan`);
        }
        setFormModalOpen(false);
        return;
      }

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          full_name: fullName.trim(),
          whatsapp: normalizedWa,
          gmail: gmail.trim(),
          family_group_id: familyGroupId || null,
          package_name: packageName,
          start_date: startDate,
          end_date: endDate,
        });
        toast.success(`Data ${fullName.trim()} diperbarui`);
      } else {
        await createCustomer(
          {
            full_name: fullName.trim(),
            whatsapp: normalizedWa,
            gmail: gmail.trim(),
            family_group_id: familyGroupId || null,
            package_name: packageName,
            start_date: startDate,
            end_date: endDate,
          },
          {
            recordIncome: {
              record: recordIncome,
              amount: incomeAmount,
              payment_method: paymentMethod,
            },
          },
        );
        toast.success(`Pelanggan ${fullName.trim()} ditambahkan`);
      }
      setFormModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan data pelanggan",
      );
    }
  }

  function openRenewModal(customer: EnrichedCustomer) {
    setRenewTarget(customer);
    setRenewDays(30);
    setRenewRecordIncome(true);
    setRenewAmount(getDefaultPackagePrice(customer.package_name));
    setRenewPaymentMethod("QRIS");
  }

  async function handleConfirmRenew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renewTarget) return;

    try {
      if (isUsingDemo) {
        const nextEnd = calculateRenewedEndDate(
          renewTarget.end_date,
          renewDays,
        );
        setDemoRawCustomers((prev) =>
          prev.map((c) =>
            c.id === renewTarget.id ? { ...c, end_date: nextEnd } : c,
          ),
        );
        toast.success(
          `${renewTarget.full_name} diperpanjang +${renewDays} hari`,
        );
        setRenewTarget(null);
        return;
      }

      await renewCustomer(renewTarget.id, {
        days: renewDays,
        recordIncome: {
          record: renewRecordIncome,
          amount: renewAmount,
          payment_method: renewPaymentMethod,
        },
      });
      toast.success(
        `${renewTarget.full_name} diperpanjang +${renewDays} hari`,
      );
      setRenewTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperpanjang masa aktif",
      );
    }
  }

  async function handleDeleteCustomer(customer: EnrichedCustomer) {
    if (confirmDeleteId !== customer.id) {
      setConfirmDeleteId(customer.id);
      window.setTimeout(() => {
        setConfirmDeleteId((current) =>
          current === customer.id ? null : current,
        );
      }, 3000);
      return;
    }

    setConfirmDeleteId(null);
    try {
      if (isUsingDemo) {
        setDemoRawCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        toast.success(`${customer.full_name} dihapus`);
        return;
      }
      await deleteCustomer(customer.id);
      toast.success(`${customer.full_name} dihapus`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus pelanggan",
      );
    }
  }

  return (
    <PageTransition className="space-y-6">
      {/* Top Header & Quick Actions */}
      <section className="surface-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-semibold text-[#FAFAFA] tracking-tight">
                Datalist Pelanggan Harian
              </h2>
              {isUsingDemo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                  Preview Data Dummy
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[#71717A] mt-1">
              Kontrol masa aktif, kirim pengingat WA 1-klik, dan perpanjang
              (+30 hari) otomatis tercatat ke Keuangan.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreateModal}
            className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold text-xs sm:text-sm px-4 py-2 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pelanggan</span>
          </motion.button>
        </div>

        {/* Filter Tabs + Search + Group Filter */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl surface-inset p-1">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const count = counts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`relative whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    active ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#E4E4E7]"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="customers-status-tab"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 35,
                      }}
                      className="absolute inset-0 rounded-lg bg-[#17171D] border border-white/[0.1]"
                    />
                  ) : null}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] tabular-nums ${
                        active
                          ? "bg-[#22222A] text-[#FAFAFA]"
                          : "bg-[#17171D] text-[#71717A]"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-3.5 w-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, Gmail, atau 628..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field w-full rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm placeholder:text-[#52525B]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              aria-label="Filter Grup Family"
              className="input-field rounded-xl px-3 py-2 text-xs sm:text-sm"
            >
              <option value="all">Semua Grup Family</option>
              {activeGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && supabaseConfigured ? (
        <div
          role="alert"
          className="rounded-2xl bg-[#17171D] border border-white/[0.1] border-l-2 border-l-[#EF4444] px-4 py-3 text-xs text-[#E4E4E7]"
        >
          {error}
        </div>
      ) : null}

      {loading && activeCustomers.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center text-xs text-[#71717A]">
          Memuat data pelanggan...
        </div>
      ) : null}

      {/* Mobile-Friendly Cards */}
      <section className="md:hidden space-y-3">
        {activeCustomers.length === 0 ? (
          <div className="surface-card rounded-2xl p-8 text-center text-xs text-[#71717A]">
            Tidak ada pelanggan yang cocok dengan filter pencarian.
          </div>
        ) : (
          activeCustomers.map((customer) => {
            const st = getCustomerStatusMeta(customer.status);
            const confirmingDelete = confirmDeleteId === customer.id;
            return (
              <div
                key={customer.id}
                className="surface-card rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#FAFAFA] truncate">
                      {customer.full_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs font-mono text-[#71717A] truncate">
                        {customer.gmail}
                      </p>
                      <CopyButton value={customer.gmail} label="Gmail" />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.badgeClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                    />
                    {st.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs surface-inset rounded-xl p-3">
                  <div>
                    <span className="text-[#71717A] block text-[11px]">
                      Grup &amp; Paket
                    </span>
                    <span className="text-[#FAFAFA] font-medium">
                      {customer.family_group_name ?? "-"} &bull;{" "}
                      {customer.package_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[11px]">
                      WhatsApp
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#FAFAFA] font-mono">
                      <span>{customer.whatsapp}</span>
                      <CopyButton value={customer.whatsapp} label="WhatsApp" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[11px]">
                      Mulai
                    </span>
                    <span className="font-mono text-[#A1A1AA]">
                      {formatShortDate(customer.start_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[11px]">
                      Berakhir
                    </span>
                    <span className="font-mono text-[#FAFAFA] font-medium">
                      {formatShortDate(customer.end_date)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={customer.remind_wa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] text-[#FAFAFA] border border-white/[0.1] py-2 px-3 text-xs font-medium transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#22C55E]" />
                    <span>Remind WA</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openRenewModal(customer)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] text-[#FAFAFA] border border-white/[0.1] py-2 px-3 text-xs font-medium cursor-pointer transition"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-[#A1A1AA]" />
                    <span>+30 Hari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(customer)}
                    className="rounded-xl bg-[#0C0C10] hover:bg-[#17171D] text-[#A1A1AA] border border-white/[0.08] py-2 px-3 text-xs cursor-pointer transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCustomer(customer)}
                    className={`rounded-xl border py-2 px-3 text-xs font-medium cursor-pointer transition ${
                      confirmingDelete
                        ? "bg-[#EF4444] text-white border-[#EF4444]"
                        : "bg-[#0C0C10] text-[#A1A1AA] border-white/[0.08]"
                    }`}
                  >
                    {confirmingDelete ? "Yakin?" : "Hapus"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Desktop 9-Column Table */}
      <section className="hidden md:block surface-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#71717A] bg-[#0C0C10]">
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Alamat Gmail</th>
                <th className="py-3.5 px-4">Grup Family</th>
                <th className="py-3.5 px-4">Paket</th>
                <th className="py-3.5 px-4">Mulai</th>
                <th className="py-3.5 px-4">Selesai</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07] text-xs sm:text-sm">
              {activeCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-[#71717A]"
                  >
                    Tidak ada data pelanggan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                activeCustomers.map((customer) => {
                  const st = getCustomerStatusMeta(customer.status);
                  const confirmingDelete = confirmDeleteId === customer.id;
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#17171D]/55 transition"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#FAFAFA] whitespace-nowrap">
                        {customer.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span>{customer.whatsapp}</span>
                          <CopyButton
                            value={customer.whatsapp}
                            label="WhatsApp"
                          />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA]">
                        <span className="inline-flex items-center gap-1">
                          <span>{customer.gmail}</span>
                          <CopyButton value={customer.gmail} label="Gmail" />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#0C0C10] text-[#E4E4E7] border border-white/[0.08]">
                          {customer.family_group_name ?? "Belum dipilih"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#E4E4E7] whitespace-nowrap text-xs">
                        {customer.package_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#71717A] whitespace-nowrap">
                        {formatShortDate(customer.start_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-[#FAFAFA] font-medium">
                          {formatShortDate(customer.end_date)}
                        </div>
                        <div className="text-[11px] text-[#71717A]">
                          {customer.days_remaining < 0
                            ? `Lewat ${Math.abs(customer.days_remaining)} hari`
                            : customer.days_remaining === 0
                              ? "Habis hari ini"
                              : `Sisa ${customer.days_remaining} hari`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                          />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={customer.remind_wa_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#17171D] hover:bg-[#22222A] text-[#FAFAFA] border border-white/[0.1] px-2.5 py-1.5 text-xs font-medium transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-[#22C55E]" />
                            <span>Remind WA</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => openRenewModal(customer)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#17171D] hover:bg-[#22222A] text-[#FAFAFA] border border-white/[0.1] px-2.5 py-1.5 text-xs font-medium cursor-pointer transition"
                          >
                            <CalendarPlus className="h-3.5 w-3.5 text-[#A1A1AA]" />
                            <span>+30h</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(customer)}
                            title="Edit pelanggan"
                            className="rounded-lg bg-[#0C0C10] hover:bg-[#17171D] text-[#A1A1AA] hover:text-[#FAFAFA] border border-white/[0.08] p-1.5 text-xs cursor-pointer transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleDeleteCustomer(customer)}
                            title="Hapus pelanggan"
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium cursor-pointer transition ${
                              confirmingDelete
                                ? "bg-[#EF4444] text-white border-[#EF4444]"
                                : "bg-[#0C0C10] hover:bg-[#17171D] text-[#A1A1AA] hover:text-[#EF4444] border-white/[0.08]"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {confirmingDelete ? <span>Yakin?</span> : null}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Tambah / Edit Pelanggan */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={
          editingCustomer
            ? `Edit Pelanggan: ${editingCustomer.full_name}`
            : "Tambah Pelanggan Baru"
        }
        subtitle="Nomor WA otomatis dinormalisasi ke format 628..."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Nama Lengkap
              </label>
              <input
                placeholder="Contoh: Rizky Pratama"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Nomor WhatsApp
              </label>
              <input
                placeholder="0812... atau 62812..."
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
              {whatsapp ? (
                <p className="text-[11px] text-[#71717A] mt-1">
                  Disimpan sebagai:{" "}
                  <code className="font-mono text-[#FAFAFA]">
                    {normalizeWhatsApp(whatsapp)}
                  </code>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Alamat Gmail Pelanggan
            </label>
            <input
              type="email"
              placeholder="nama.pelanggan@gmail.com"
              value={gmail}
              onChange={(e) => handleGmailChange(e.target.value)}
              required
              className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
            />
            {gmailWarning ? (
              <div
                role="status"
                className="mt-2 rounded-xl bg-[#17171D] border border-white/[0.1] border-l-2 border-l-[#EAB308] px-3.5 py-2.5 text-xs text-[#E4E4E7] flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-[#EAB308] shrink-0 mt-0.5" />
                <span>
                  <strong>Peringatan Cooldown 12 Bulan:</strong> {gmailWarning}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Grup Family Sharing
              </label>
              <select
                value={familyGroupId}
                onChange={(e) => setFamilyGroupId(e.target.value)}
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Grup Family --</option>
                {activeGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.group_name} (
                    {group.is_full
                      ? "FULL"
                      : `${group.ready_slots} slot ready`}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Paket Langganan
              </label>
              <select
                value={packageName}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                {PACKAGE_OPTIONS.map((pkg) => (
                  <option key={pkg.name} value={pkg.name}>
                    {pkg.name} ({formatRupiah(pkg.price)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Tanggal Selesai (Default +30 Hari)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>
          </div>

          {!editingCustomer ? (
            <div className="rounded-xl surface-inset p-4 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#FAFAFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordIncome}
                  onChange={(e) => setRecordIncome(e.target.checked)}
                  className="accent-[#FAFAFA]"
                />
                <span>
                  Catat otomatis sebagai Pemasukan (Order Baru) di Keuangan
                </span>
              </label>

              {recordIncome ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#71717A] mb-1">
                      Nominal Pemasukan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={incomeAmount}
                      onChange={(e) =>
                        setIncomeAmount(Number(e.target.value) || 0)
                      }
                      className="input-field w-full rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#71717A] mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="input-field w-full rounded-xl px-3 py-1.5 text-xs"
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.08] px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold px-4 py-2 text-xs cursor-pointer transition"
            >
              {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Perpanjang (+30 Hari) */}
      <Modal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        title="Perpanjang Masa Aktif (+1 Bulan)"
        subtitle={
          renewTarget
            ? `${renewTarget.full_name} (${renewTarget.package_name})`
            : undefined
        }
        maxWidth="sm"
      >
        {renewTarget ? (
          <form onSubmit={handleConfirmRenew} className="space-y-4">
            <div className="rounded-xl surface-inset p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Tanggal Habis Saat Ini</span>
                <span className="font-mono text-[#FAFAFA] font-medium">
                  {formatShortDate(renewTarget.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">
                  Setelah +{renewDays} Hari
                </span>
                <span className="font-mono text-[#FAFAFA] font-semibold">
                  {formatShortDate(
                    calculateRenewedEndDate(renewTarget.end_date, renewDays),
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Durasi Tambahan (Hari)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value) || 30)}
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div className="rounded-xl surface-inset p-4 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#FAFAFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={renewRecordIncome}
                  onChange={(e) => setRenewRecordIncome(e.target.checked)}
                  className="accent-[#FAFAFA]"
                />
                <span>Catat pemasukan Perpanjangan ke halaman Keuangan</span>
              </label>

              {renewRecordIncome ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#71717A] mb-1">
                      Nominal (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={renewAmount}
                      onChange={(e) =>
                        setRenewAmount(Number(e.target.value) || 0)
                      }
                      className="input-field w-full rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#71717A] mb-1">
                      Metode Bayar
                    </label>
                    <select
                      value={renewPaymentMethod}
                      onChange={(e) =>
                        setRenewPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="input-field w-full rounded-xl px-3 py-1.5 text-xs"
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.08] px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold px-4 py-2 text-xs cursor-pointer transition"
              >
                {submitting
                  ? "Memproses..."
                  : "Konfirmasi Perpanjang (+30 Hari)"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </PageTransition>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[#71717A]">
          Memuat daftar pelanggan...
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
