"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { buildDemoDashboardData } from "@/components/demo-data";
import {
  MONTH_OPTIONS,
  formatCompactRupiah,
  formatRupiah,
  formatShortDate,
  getCustomerStatusMeta,
  getMonthLabel,
} from "@/components/formatters";
import type {
  MonthlyCustomerGrowthPoint,
  MonthlyFinancePoint,
} from "@/types/database";

function CustomerGrowthChart({
  series,
  activeMonth,
}: {
  series: MonthlyCustomerGrowthPoint[];
  activeMonth: number;
}) {
  const maxVal = Math.max(
    1,
    ...series.map((item) => Math.max(item.newCustomers, item.cumulativeCustomers)),
  );

  return (
    <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Grafik Kenaikan Pelanggan
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Pertumbuhan pelanggan baru & total kumulatif per bulan
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            Pelanggan Baru
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-white/30" />
            Kumulatif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-44 pt-4 px-1 border-b border-white/10">
        {series.map((point) => {
          const newHeight = Math.round((point.newCustomers / maxVal) * 100);
          const cumHeight = Math.round(
            (point.cumulativeCustomers / maxVal) * 100,
          );
          const isCurrent = point.month === activeMonth;

          return (
            <div
              key={point.month}
              className="flex flex-col items-center h-full justify-end group relative"
            >
              {/* Hover Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-9 z-10 whitespace-nowrap rounded-lg bg-[#121212] border border-white/15 px-2 py-1 text-[10px] text-white shadow-lg">
                {point.label}: +{point.newCustomers} baru ({point.cumulativeCustomers} total)
              </div>

              <div className="w-full flex items-end justify-center gap-0.5 h-32">
                <div
                  style={{
                    height: `${Math.max(cumHeight, point.cumulativeCustomers > 0 ? 10 : 3)}%`,
                  }}
                  className={`w-1/2 rounded-t transition-all ${
                    isCurrent ? "bg-white/40" : "bg-white/20"
                  }`}
                />
                <div
                  style={{
                    height: `${Math.max(newHeight, point.newCustomers > 0 ? 12 : 3)}%`,
                  }}
                  className={`w-1/2 rounded-t transition-all ${
                    point.newCustomers > 0
                      ? "bg-emerald-400"
                      : "bg-emerald-400/20"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pt-2 text-center">
        {series.map((point) => {
          const isCurrent = point.month === activeMonth;
          return (
            <div
              key={point.month}
              className={`text-[10px] sm:text-[11px] truncate ${
                isCurrent ? "text-white font-semibold" : "text-white/55"
              }`}
            >
              {point.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceComparisonChart({
  series,
  activeMonth,
}: {
  series: MonthlyFinancePoint[];
  activeMonth: number;
}) {
  const maxVal = Math.max(
    1,
    ...series.map((item) => Math.max(item.income, item.expense)),
  );

  return (
    <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Grafik Keuangan Bulanan
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Perbandingan Pemasukan (Omzet) vs Pengeluaran (Modal)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            Pemasukan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
            Pengeluaran
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-44 pt-4 px-1 border-b border-white/10">
        {series.map((point) => {
          const incHeight = Math.round((point.income / maxVal) * 100);
          const expHeight = Math.round((point.expense / maxVal) * 100);

          return (
            <div
              key={point.month}
              className="flex flex-col items-center h-full justify-end group relative"
            >
              {/* Hover Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-11 z-10 whitespace-nowrap rounded-lg bg-[#121212] border border-white/15 px-2 py-1 text-[10px] text-white shadow-lg">
                <div>
                  {point.label}: Masuk {formatCompactRupiah(point.income)}
                </div>
                <div className="text-white/70">
                  Keluar {formatCompactRupiah(point.expense)} &bull; Profit{" "}
                  {formatCompactRupiah(point.netProfit)}
                </div>
              </div>

              <div className="w-full flex items-end justify-center gap-0.5 h-32">
                <div
                  style={{
                    height: `${Math.max(incHeight, point.income > 0 ? 10 : 3)}%`,
                  }}
                  className={`w-1/2 rounded-t transition-all ${
                    point.income > 0 ? "bg-emerald-400" : "bg-emerald-400/20"
                  }`}
                />
                <div
                  style={{
                    height: `${Math.max(expHeight, point.expense > 0 ? 10 : 3)}%`,
                  }}
                  className={`w-1/2 rounded-t transition-all ${
                    point.expense > 0 ? "bg-rose-400" : "bg-rose-400/20"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pt-2 text-center">
        {series.map((point) => {
          const isCurrent = point.month === activeMonth;
          return (
            <div
              key={point.month}
              className={`text-[10px] sm:text-[11px] truncate ${
                isCurrent ? "text-white font-semibold" : "text-white/55"
              }`}
            >
              {point.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    year,
    setYear,
    month,
    setMonth,
    data,
    loading,
    error,
    supabaseConfigured,
    refresh,
  } = useDashboard();

  const demoData = useMemo(
    () => buildDemoDashboardData(year, month),
    [year, month],
  );

  const activeData = data ?? (!supabaseConfigured ? demoData : null);
  const isUsingDemo = !data && !supabaseConfigured;

  return (
    <div className="space-y-6">
      {/* Top Toolbar & Period Filter */}
      <section className="bg-[#090A33] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Ringkasan Operasional & Cashflow
            </h2>
            {isUsingDemo ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Mode Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-white/65 mt-0.5">
            Periode aktif:{" "}
            <span className="text-white font-medium">
              {getMonthLabel(month)} {year}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="dash-month" className="sr-only">
              Bulan
            </label>
            <select
              id="dash-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value) || 1)}
              className="rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/35"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <label htmlFor="dash-year" className="sr-only">
              Tahun
            </label>
            <input
              id="dash-year"
              type="number"
              min={2024}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
              className="w-24 rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/35"
            />
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 text-xs sm:text-sm font-medium text-white transition cursor-pointer"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>Segarkan</span>
          </button>
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

      {loading && !activeData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-[#090A33]/60 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {activeData ? (
        <>
          {/* Row 1: Operational KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Pelanggan Aktif */}
            <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Total Pelanggan Aktif
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Berjalan
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-bold tracking-tight text-white">
                  {activeData.kpi.activeCustomers}
                </p>
                <Link
                  href="/customers"
                  className="text-xs text-white/65 hover:text-white underline underline-offset-4"
                >
                  Lihat semua &rarr;
                </Link>
              </div>
            </div>

            {/* Total Slot Ready */}
            <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Total Slot Ready (Shared)
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    activeData.kpi.totalReadySlots > 0
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeData.kpi.totalReadySlots > 0
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                    }`}
                  />
                  {activeData.kpi.totalReadySlots > 0
                    ? "Slot Tersedia"
                    : "Penuh"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-bold tracking-tight text-white">
                  {activeData.kpi.totalReadySlots}
                </p>
                <Link
                  href="/accounts"
                  className="text-xs text-white/65 hover:text-white underline underline-offset-4"
                >
                  Cek grup &rarr;
                </Link>
              </div>
            </div>

            {/* Perlu Perhatian (H-3 Expired) - Clickable directly to /customers?status=expiring_soon */}
            <Link
              href="/customers?status=expiring_soon"
              className="group bg-[#090A33] hover:bg-[#0d0f45] border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Perlu Perhatian (H-3 Expired)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  &le; 3 Hari
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-bold tracking-tight text-amber-300">
                  {activeData.kpi.expiringSoonCount}
                </p>
                <span className="text-xs text-amber-300/80 group-hover:text-amber-200 underline underline-offset-4">
                  Tagih sekarang &rarr;
                </span>
              </div>
            </Link>
          </section>

          {/* Row 2: Monthly Finance KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Omzet (Pemasukan) */}
            <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Omzet (Pemasukan) Bulan Ini
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Masuk
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 mt-3">
                {formatRupiah(activeData.kpi.monthlyIncome)}
              </p>
              <p className="text-[11px] text-white/55 mt-1">
                Akumulasi order baru & perpanjangan paket
              </p>
            </div>

            {/* Pengeluaran (Modal) */}
            <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Pengeluaran (Modal) Bulan Ini
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Keluar
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-400 mt-3">
                {formatRupiah(activeData.kpi.monthlyExpense)}
              </p>
              <p className="text-[11px] text-white/55 mt-1">
                Biaya akun induk Google Pro & operasional
              </p>
            </div>

            {/* Profit Bersih */}
            <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/65">
                  Profit Bersih ({getMonthLabel(month)})
                </span>
                <Link
                  href="/finance"
                  className="text-[11px] text-white/65 hover:text-white underline underline-offset-4"
                >
                  Detail kas &rarr;
                </Link>
              </div>
              <p
                className={`text-2xl sm:text-3xl font-bold tracking-tight mt-3 ${
                  activeData.kpi.monthlyNetProfit >= 0
                    ? "text-white"
                    : "text-rose-400"
                }`}
              >
                {formatRupiah(activeData.kpi.monthlyNetProfit)}
              </p>
              <p className="text-[11px] text-white/55 mt-1">
                Rumus: Omzet dikurangi total pengeluaran
              </p>
            </div>
          </section>

          {/* Row 3: Charts (Kenaikan Pelanggan & Keuangan) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CustomerGrowthChart
              series={activeData.customerGrowthSeries}
              activeMonth={month}
            />
            <FinanceComparisonChart
              series={activeData.financeSeries}
              activeMonth={month}
            />
          </section>

          {/* Row 4: Widget Cepat - Daftar Jatuh Tempo Terdekat (Top 5) */}
          <section className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Daftar Jatuh Tempo Terdekat (Top 5)
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Pelanggan aktif yang tanggal berakhirnya paling dekat &mdash;
                  klik tombol hijau untuk kirim pengingat WA 1-klik
                </p>
              </div>
              <Link
                href="/customers"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75 hover:text-white"
              >
                <span>Buka Datalist Pelanggan</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {activeData.upcomingExpirations.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/55">
                Belum ada pelanggan aktif yang mendekati jatuh tempo.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {activeData.upcomingExpirations.map((customer) => {
                  const statusMeta = getCustomerStatusMeta(customer.status);
                  return (
                    <div
                      key={customer.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {customer.full_name}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                            />
                            {statusMeta.label}
                          </span>
                          {customer.family_group_name ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-white/70 border border-white/10">
                              {customer.family_group_name}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {customer.gmail} &bull; Paket{" "}
                          <span className="text-white/80">
                            {customer.package_name}
                          </span>{" "}
                          &bull; Habis:{" "}
                          <span className="text-white font-medium">
                            {formatShortDate(customer.end_date)}
                          </span>{" "}
                          (
                          {customer.days_remaining === 0
                            ? "Hari ini"
                            : `Sisa ${customer.days_remaining} hari`}
                          )
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={customer.remind_wa_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/35 px-3.5 py-2 text-xs font-medium transition"
                        >
                          <svg
                            className="h-3.5 w-3.5 text-emerald-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                            />
                          </svg>
                          <span>Remind WA</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
