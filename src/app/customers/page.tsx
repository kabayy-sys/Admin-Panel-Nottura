"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
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

const STATUS_TABS: { value: CustomerStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "expiring_soon", label: "H-3 Expired" },
  { value: "expired", label: "Expired" },
];

function CustomersContent() {
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

  // Demo mode fallback when Supabase is not configured locally
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

  // Tab counts
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

  // Add / Edit Customer Modal State
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

  // Renew (+30 hari) Confirmation Modal State (PRD Section 4.D: memunculkan form konfirmasi pencatatan pemasukan ke Keuangan)
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
      // ignore partial date
    }
  }

  function handlePackageChange(value: string) {
    setPackageName(value);
    setIncomeAmount(getDefaultPackagePrice(value));
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWa = normalizeWhatsApp(whatsapp);

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
            created_by: "arya@nottura.my.id",
            created_at: getTodayDateString(),
          },
          ...prev,
        ]);
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
    }
    setFormModalOpen(false);
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

    if (isUsingDemo) {
      const nextEnd = calculateRenewedEndDate(renewTarget.end_date, renewDays);
      setDemoRawCustomers((prev) =>
        prev.map((c) =>
          c.id === renewTarget.id ? { ...c, end_date: nextEnd } : c,
        ),
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
    setRenewTarget(null);
  }

  async function handleDeleteCustomer(customer: EnrichedCustomer) {
    if (isUsingDemo) {
      setDemoRawCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      return;
    }
    await deleteCustomer(customer.id);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <section className="bg-[#090A33] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Datalist Pelanggan Harian
              </h2>
              {isUsingDemo ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Mode Preview Data Dummy
                </span>
              ) : null}
            </div>
            <p className="text-xs text-white/65 mt-0.5">
              Kontrol masa aktif pelanggan, kirim pengingat WA 1-klik, dan
              perpanjang (+30 hari) otomatis tercatat ke Keuangan.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold text-xs sm:text-sm px-4 py-2.5 transition cursor-pointer shadow-sm"
          >
            <span>+ Tambah Pelanggan</span>
          </button>
        </div>

        {/* Filter Tabs + Search + Group Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-white/10">
          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const count = counts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                    active
                      ? "bg-white text-[#090A33] border-white font-semibold"
                      : "bg-[#121212] text-white/70 hover:text-white border-white/10"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? "bg-[#090A33]/15 text-[#090A33]"
                        : "bg-white/10 text-white/75"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Group Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <input
                type="search"
                placeholder="Cari nama, Gmail, atau 628..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-[#121212] border border-white/15 pl-3.5 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              />
            </div>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              aria-label="Filter Grup Family"
              className="rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
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
          className="rounded-2xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-xs text-rose-200"
        >
          {error}
        </div>
      ) : null}

      {/* Loading State */}
      {loading && activeCustomers.length === 0 ? (
        <div className="bg-[#090A33] border border-white/10 rounded-2xl p-8 text-center text-xs text-white/60">
          Memuat data pelanggan...
        </div>
      ) : null}

      {/* Mobile-Friendly Cards (Visible on < md screens per PRD Section 3: Mobile-Friendly) */}
      <section className="md:hidden space-y-3">
        {activeCustomers.length === 0 ? (
          <div className="bg-[#090A33] border border-white/10 rounded-2xl p-8 text-center text-xs text-white/60">
            Tidak ada pelanggan yang cocok dengan filter pencarian.
          </div>
        ) : (
          activeCustomers.map((customer) => {
            const st = getCustomerStatusMeta(customer.status);
            return (
              <div
                key={customer.id}
                className="bg-[#090A33] border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {customer.full_name}
                    </p>
                    <p className="text-xs text-white/65 truncate">
                      {customer.gmail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                    {st.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#121212]/70 border border-white/10 rounded-xl p-3">
                  <div>
                    <span className="text-white/50 block text-[11px]">
                      Grup & Paket
                    </span>
                    <span className="text-white font-medium">
                      {customer.family_group_name ?? "-"} &bull;{" "}
                      {customer.package_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[11px]">
                      WhatsApp
                    </span>
                    <span className="text-white font-mono">
                      {customer.whatsapp}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[11px]">
                      Mulai
                    </span>
                    <span className="text-white/80">
                      {formatShortDate(customer.start_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[11px]">
                      Berakhir
                    </span>
                    <span className="text-white font-medium">
                      {formatShortDate(customer.end_date)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={customer.remind_wa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/35 py-2 px-3 text-xs font-medium"
                  >
                    Remind WA
                  </a>
                  <button
                    type="button"
                    onClick={() => openRenewModal(customer)}
                    className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 py-2 px-3 text-xs font-medium cursor-pointer"
                  >
                    +30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(customer)}
                    className="rounded-xl bg-white/5 text-white/80 border border-white/10 py-2 px-3 text-xs cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCustomer(customer)}
                    className="rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 py-2 px-3 text-xs cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Desktop Table (Visible on md+ screens with all 9 columns from PRD Section 4.D) */}
      <section className="hidden md:block bg-[#090A33] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-white/60 bg-black/20">
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
            <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
              {activeCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-sm text-white/55"
                  >
                    Tidak ada data pelanggan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                activeCustomers.map((customer) => {
                  const st = getCustomerStatusMeta(customer.status);
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        {customer.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-white/80 whitespace-nowrap">
                        {customer.whatsapp}
                      </td>
                      <td className="py-3.5 px-4 text-white/80">
                        {customer.gmail}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-white/10 text-white/85 border border-white/15">
                          {customer.family_group_name ?? "Belum dipilih"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white/85 whitespace-nowrap">
                        {customer.package_name}
                      </td>
                      <td className="py-3.5 px-4 text-white/70 whitespace-nowrap">
                        {formatShortDate(customer.start_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {formatShortDate(customer.end_date)}
                        </div>
                        <div className="text-[11px] text-white/50">
                          {customer.days_remaining < 0
                            ? `Lewat ${Math.abs(customer.days_remaining)} hari`
                            : customer.days_remaining === 0
                              ? "Habis hari ini"
                              : `Sisa ${customer.days_remaining} hari`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                          />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <a
                          href={customer.remind_wa_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/35 px-2.5 py-1.5 text-xs font-medium transition"
                        >
                          Remind WA
                        </a>
                        <button
                          type="button"
                          onClick={() => openRenewModal(customer)}
                          className="rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 px-2.5 py-1.5 text-xs font-medium cursor-pointer"
                        >
                          Perpanjang (+30h)
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(customer)}
                          className="rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 px-2.5 py-1.5 text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDeleteCustomer(customer)}
                          className="rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 text-xs cursor-pointer"
                        >
                          Hapus
                        </button>
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
      {formModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#090A33] border border-white/15 rounded-2xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {editingCustomer
                    ? `Edit Pelanggan: ${editingCustomer.full_name}`
                    : "Tambah Pelanggan Baru"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Nomor WA otomatis dinormalisasi ke format{" "}
                  <code className="text-white/90">628...</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                &#10005;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    placeholder="Contoh: Rizky Pratama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    placeholder="0812... atau 62812..."
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                  {whatsapp ? (
                    <p className="text-[11px] text-white/55 mt-1">
                      Disimpan sebagai:{" "}
                      <code className="text-emerald-300">
                        {normalizeWhatsApp(whatsapp)}
                      </code>
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Alamat Gmail Pelanggan
                </label>
                <input
                  type="email"
                  placeholder="nama.pelanggan@gmail.com"
                  value={gmail}
                  onChange={(e) => handleGmailChange(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                />
                {gmailWarning ? (
                  <div
                    role="status"
                    className="mt-2 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-200"
                  >
                    <strong>Peringatan Cooldown 12 Bulan:</strong>{" "}
                    {gmailWarning}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Grup Family Sharing
                  </label>
                  <select
                    value={familyGroupId}
                    onChange={(e) => setFamilyGroupId(e.target.value)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
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
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Paket Langganan
                  </label>
                  <select
                    value={packageName}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
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
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Tanggal Selesai (Default +30 Hari)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Pencatatan Pemasukan Otomatis (Hanya saat tambah pelanggan baru) */}
              {!editingCustomer ? (
                <div className="rounded-xl bg-[#121212]/80 border border-white/10 p-4 space-y-3">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordIncome}
                      onChange={(e) => setRecordIncome(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <span>
                      Catat otomatis sebagai Pemasukan (Order Baru) di Keuangan
                    </span>
                  </label>

                  {recordIncome ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-white/65 mb-1">
                          Nominal Pemasukan (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={incomeAmount}
                          onChange={(e) =>
                            setIncomeAmount(Number(e.target.value) || 0)
                          }
                          className="w-full rounded-xl bg-[#090A33] border border-white/15 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/65 mb-1">
                          Metode Pembayaran
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as PaymentMethod)
                          }
                          className="w-full rounded-xl bg-[#090A33] border border-white/15 px-3 py-1.5 text-xs text-white"
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

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-white/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Konfirmasi Perpanjang (+30 Hari) & Pencatatan Pemasukan */}
      {renewTarget ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090A33] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Perpanjang Masa Aktif (+1 Bulan)
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {renewTarget.full_name} ({renewTarget.package_name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                &#10005;
              </button>
            </div>

            <form onSubmit={handleConfirmRenew} className="space-y-4">
              <div className="rounded-xl bg-[#121212]/80 border border-white/10 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-white/60">Tanggal Habis Saat Ini:</span>
                  <span className="text-white font-medium">
                    {formatShortDate(renewTarget.end_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">
                    Tanggal Habis Setelah +{renewDays} Hari:
                  </span>
                  <span className="text-emerald-300 font-semibold">
                    {formatShortDate(
                      calculateRenewedEndDate(renewTarget.end_date, renewDays),
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Durasi Tambahan (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={renewDays}
                  onChange={(e) => setRenewDays(Number(e.target.value) || 30)}
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="rounded-xl bg-[#121212]/80 border border-white/10 p-4 space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-medium text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renewRecordIncome}
                    onChange={(e) => setRenewRecordIncome(e.target.checked)}
                  />
                  <span>Catat pemasukan Perpanjangan ke halaman Keuangan</span>
                </label>

                {renewRecordIncome ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-white/65 mb-1">
                        Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={renewAmount}
                        onChange={(e) =>
                          setRenewAmount(Number(e.target.value) || 0)
                        }
                        className="w-full rounded-xl bg-[#090A33] border border-white/15 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/65 mb-1">
                        Metode Bayar
                      </label>
                      <select
                        value={renewPaymentMethod}
                        onChange={(e) =>
                          setRenewPaymentMethod(e.target.value as PaymentMethod)
                        }
                        className="w-full rounded-xl bg-[#090A33] border border-white/15 px-3 py-1.5 text-xs text-white"
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

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRenewTarget(null)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-white/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-400 text-[#090A33] hover:bg-emerald-300 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {submitting
                    ? "Memproses..."
                    : "Konfirmasi Perpanjang (+30 Hari)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-white/60">
          Memuat daftar pelanggan...
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
