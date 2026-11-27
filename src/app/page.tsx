"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Layers,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { buildDemoDashboardData } from "@/components/demo-data";
import {
  formatCompactRupiah,
  formatRupiah,
  formatShortDate,
  getCustomerStatusMeta,
  getMonthLabel,
} from "@/components/formatters";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CopyButton } from "@/components/ui/CopyButton";
import { PageTransition } from "@/components/ui/MotionPrimitives";
import { PeriodStepper } from "@/components/ui/PeriodStepper";
import type {
  MonthlyCustomerGrowthPoint,
  MonthlyFinancePoint,
} from "@/types/database";

function CustomerGrowthChart({
  series,
  activeMonth,
  onSelectMonth,
}: {
  series: MonthlyCustomerGrowthPoint[];
  activeMonth: number;
  onSelectMonth: (month: number) => void;
}) {
  const maxVal = Math.max(
    1,
    ...series.map((item) => Math.max(item.newCustomers, item.cumulativeCustomers)),
  );

  // Build crisp SVG polyline points for cumulative trend
  const trendPath = useMemo(() => {
    if (series.length === 0) return "";
    return series
      .map((point, index) => {
        const x = ((index + 0.5) / series.length) * 100;
        const pct = Math.max(
          point.cumulativeCustomers > 0 ? 10 : 3,
          Math.round((point.cumulativeCustomers / maxVal) * 100),
        );
        const y = 100 - pct;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [series, maxVal]);

  return (
    <div className="surface-card rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
            Grafik Kenaikan Pelanggan
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Klik bulan untuk memfilter KPI periode tersebut
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#FAFAFA]" />
            Baru
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#3F3F46]" />
            Kumulatif
          </span>
        </div>
      </div>

      <div className="relative h-44 pt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between"
        >
          <div className="border-t border-dashed border-white/[0.06]" />
          <div className="border-t border-dashed border-white/[0.06]" />
          <div className="border-t border-white/[0.09]" />
        </div>

        {/* SVG Cumulative Trend Overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-12 bottom-0 h-32 w-[calc(100%-0.5rem)] z-20"
        >
          <motion.path
            d={trendPath}
            fill="none"
            stroke="rgba(250, 250, 250, 0.35)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-1.5 items-end h-full px-1">
          {series.map((point, index) => {
            const newHeight = Math.round((point.newCustomers / maxVal) * 100);
            const cumHeight = Math.round(
              (point.cumulativeCustomers / maxVal) * 100,
            );
            const isCurrent = point.month === activeMonth;

            return (
              <button
                key={point.month}
                type="button"
                onClick={() => onSelectMonth(point.month)}
                className={`flex flex-col items-center h-full justify-end group relative rounded-lg px-0.5 transition-colors cursor-pointer ${
                  isCurrent ? "bg-[#17171D]" : "hover:bg-[#17171D]/55"
                }`}
              >
                <div className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-150 absolute -top-10 z-30 whitespace-nowrap rounded-lg bg-[#17171D] border border-white/[0.14] px-2.5 py-1.5 text-[10px] text-[#FAFAFA]">
                  <span className="font-semibold">{point.label}:</span>{" "}
                  <span className="font-mono text-[#FAFAFA]">
                    +{point.newCustomers} baru
                  </span>{" "}
                  <span className="text-[#A1A1AA] font-mono">
                    ({point.cumulativeCustomers} total)
                  </span>
                </div>

                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.32,
                      delay: index * 0.018,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      height: `${Math.max(cumHeight, point.cumulativeCustomers > 0 ? 10 : 3)}%`,
                    }}
                    className={`w-1/2 rounded-t-[2px] origin-bottom transition-colors ${
                      point.cumulativeCustomers > 0
                        ? isCurrent
                          ? "bg-[#52525B]"
                          : "bg-[#3F3F46] group-hover:bg-[#52525B]"
                        : "bg-white/[0.05]"
                    }`}
                  />
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.32,
                      delay: index * 0.018 + 0.03,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      height: `${Math.max(newHeight, point.newCustomers > 0 ? 12 : 3)}%`,
                    }}
                    className={`w-1/2 rounded-t-[2px] origin-bottom transition-colors ${
                      point.newCustomers > 0
                        ? isCurrent
                          ? "bg-[#FAFAFA]"
                          : "bg-[#E4E4E7]/80 group-hover:bg-[#FAFAFA]"
                        : "bg-white/[0.08]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 sm:gap-1.5 pt-2.5 text-center">
        {series.map((point) => {
          const isCurrent = point.month === activeMonth;
          return (
            <button
              key={point.month}
              type="button"
              onClick={() => onSelectMonth(point.month)}
              className={`text-[10px] tracking-tight cursor-pointer transition ${
                isCurrent
                  ? "text-[#FAFAFA] font-semibold"
                  : "text-[#71717A] hover:text-[#E4E4E7]"
              }`}
            >
              {point.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FinanceComparisonChart({
  series,
  activeMonth,
  onSelectMonth,
}: {
  series: MonthlyFinancePoint[];
  activeMonth: number;
  onSelectMonth: (month: number) => void;
}) {
  const maxVal = Math.max(
    1,
    ...series.map((item) => Math.max(item.income, item.expense)),
  );

  return (
    <div className="surface-card rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
            Grafik Keuangan Bulanan
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Perbandingan Pemasukan (Omzet) vs Pengeluaran (Modal)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#FAFAFA]" />
            Pemasukan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#52525B]" />
            Pengeluaran
          </span>
        </div>
      </div>

      <div className="relative h-44 pt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between"
        >
          <div className="border-t border-dashed border-white/[0.06]" />
          <div className="border-t border-dashed border-white/[0.06]" />
          <div className="border-t border-white/[0.09]" />
        </div>

        <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-1.5 items-end h-full px-1">
          {series.map((point, index) => {
            const incHeight = Math.round((point.income / maxVal) * 100);
            const expHeight = Math.round((point.expense / maxVal) * 100);
            const isCurrent = point.month === activeMonth;

            return (
              <button
                key={point.month}
                type="button"
                onClick={() => onSelectMonth(point.month)}
                className={`flex flex-col items-center h-full justify-end group relative rounded-lg px-0.5 transition-colors cursor-pointer ${
                  isCurrent ? "bg-[#17171D]" : "hover:bg-[#17171D]/55"
                }`}
              >
                <div className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-150 absolute -top-12 z-30 whitespace-nowrap rounded-lg bg-[#17171D] border border-white/[0.14] px-2.5 py-1.5 text-[10px] text-[#FAFAFA] text-left">
                  <div className="font-mono">
                    <span className="font-sans font-semibold">
                      {point.label}:
                    </span>{" "}
                    <span className="text-[#FAFAFA]">
                      +{formatCompactRupiah(point.income)}
                    </span>
                  </div>
                  <div className="text-[#A1A1AA] font-mono">
                    -{formatCompactRupiah(point.expense)} &bull; Net{" "}
                    {formatCompactRupiah(point.netProfit)}
                  </div>
                </div>

                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.32,
                      delay: index * 0.018,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      height: `${Math.max(incHeight, point.income > 0 ? 10 : 3)}%`,
                    }}
                    className={`w-1/2 rounded-t-[2px] origin-bottom transition-colors ${
                      point.income > 0
                        ? isCurrent
                          ? "bg-[#FAFAFA]"
                          : "bg-[#E4E4E7]/85 group-hover:bg-[#FAFAFA]"
                        : "bg-white/[0.08]"
                    }`}
                  />
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.32,
                      delay: index * 0.018 + 0.03,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      height: `${Math.max(expHeight, point.expense > 0 ? 10 : 3)}%`,
                    }}
                    className={`w-1/2 rounded-t-[2px] origin-bottom transition-colors ${
                      point.expense > 0
                        ? isCurrent
                          ? "bg-[#71717A]"
                          : "bg-[#52525B] group-hover:bg-[#71717A]"
                        : "bg-white/[0.05]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 sm:gap-1.5 pt-2.5 text-center">
        {series.map((point) => {
          const isCurrent = point.month === activeMonth;
          return (
            <button
              key={point.month}
              type="button"
              onClick={() => onSelectMonth(point.month)}
              className={`text-[10px] tracking-tight cursor-pointer transition ${
                isCurrent
                  ? "text-[#FAFAFA] font-semibold"
                  : "text-[#71717A] hover:text-[#E4E4E7]"
              }`}
            >
              {point.label}
            </button>
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

  const profitMargin = useMemo(() => {
    if (!activeData || activeData.kpi.monthlyIncome <= 0) return 0;
    return Math.round(
      (activeData.kpi.monthlyNetProfit / activeData.kpi.monthlyIncome) * 100,
    );
  }, [activeData]);

  const cashflowSplit = useMemo(() => {
    if (!activeData) return { incomePct: 50, expensePct: 50 };
    const total =
      activeData.kpi.monthlyIncome + activeData.kpi.monthlyExpense;
    if (total <= 0) return { incomePct: 50, expensePct: 50 };
    const incomePct = Math.round((activeData.kpi.monthlyIncome / total) * 100);
    return { incomePct, expensePct: 100 - incomePct };
  }, [activeData]);

  return (
    <PageTransition className="space-y-6">
      {/* Top Toolbar & Dynamic Period Stepper */}
      <section className="surface-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#FAFAFA] tracking-tight">
              Ringkasan Operasional &amp; Cashflow
            </h2>
            {isUsingDemo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Periode aktif:{" "}
            <span className="text-[#E4E4E7] font-medium">
              {getMonthLabel(month)} {year}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PeriodStepper
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.1] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAFAFA] transition cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#A1A1AA] ${loading ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </motion.button>
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

      {loading && !activeData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-64 rounded-2xl surface-card animate-pulse" />
          <div className="lg:col-span-5 h-64 rounded-2xl surface-card animate-pulse" />
        </div>
      ) : null}

      {activeData ? (
        <>
          {/* Row 1: Asymmetric Bento Hero (Cashflow Left 7 cols + Operational Pulse Right 5 cols) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Hero Cashflow & Margin Bento Card */}
            <div className="lg:col-span-7 surface-card rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#71717A]">
                    Profit Bersih &bull; {getMonthLabel(month)} {year}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                      Margin {profitMargin}%
                    </span>
                    <Link
                      href="/finance"
                      className="group/link shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition"
                    >
                      <span>Detail kas</span>
                      <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  <AnimatedNumber
                    value={activeData.kpi.monthlyNetProfit}
                    formatter={formatRupiah}
                    className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                      activeData.kpi.monthlyNetProfit >= 0
                        ? "text-[#FAFAFA]"
                        : "text-[#EF4444]"
                    }`}
                  />
                </div>

                {/* Animated Omzet vs Pengeluaran Ratio Bar */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                    <span>Rasio Pemasukan {cashflowSplit.incomePct}%</span>
                    <span>Pengeluaran {cashflowSplit.expensePct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#17171D] overflow-hidden flex gap-0.5 p-0.5 border border-white/[0.07]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cashflowSplit.incomePct}%` }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[#FAFAFA]"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cashflowSplit.expensePct}%` }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[#3F3F46]"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-metrics: Omzet & Pengeluaran */}
              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#22C55E]" />
                    <span>Omzet (Masuk)</span>
                  </div>
                  <AnimatedNumber
                    value={activeData.kpi.monthlyIncome}
                    formatter={formatRupiah}
                    className="text-lg sm:text-xl font-semibold tracking-tight text-[#FAFAFA] block"
                  />
                </div>

                <div className="space-y-1 border-l border-white/[0.08] pl-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    <ArrowDownRight className="h-3.5 w-3.5 text-[#EF4444]" />
                    <span>Pengeluaran (Modal)</span>
                  </div>
                  <AnimatedNumber
                    value={activeData.kpi.monthlyExpense}
                    formatter={formatRupiah}
                    className="text-lg sm:text-xl font-semibold tracking-tight text-[#E4E4E7] block"
                  />
                </div>
              </div>
            </div>

            {/* Operational Pulse Stacked Card */}
            <div className="lg:col-span-5 surface-card rounded-2xl overflow-hidden flex flex-col divide-y divide-white/[0.08]">
              {/* 1. Total Pelanggan Aktif */}
              <Link
                href="/customers"
                className="group flex-1 p-5 flex items-center justify-between gap-4 hover:bg-[#17171D]/60 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#17171D] border border-white/[0.09] flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-[#E4E4E7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#A1A1AA] truncate">
                      Total Pelanggan Aktif
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      Berjalan
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <AnimatedNumber
                    value={activeData.kpi.activeCustomers}
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]"
                  />
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#FAFAFA] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* 2. Total Slot Ready (Shared) */}
              <Link
                href="/accounts"
                className="group flex-1 p-5 flex items-center justify-between gap-4 hover:bg-[#17171D]/60 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#17171D] border border-white/[0.09] flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-[#E4E4E7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#A1A1AA] truncate">
                      Total Slot Ready (Shared)
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          activeData.kpi.totalReadySlots > 0
                            ? "bg-[#22C55E]"
                            : "bg-[#EF4444]"
                        }`}
                      />
                      {activeData.kpi.totalReadySlots > 0
                        ? "Slot Tersedia"
                        : "Penuh"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <AnimatedNumber
                    value={activeData.kpi.totalReadySlots}
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]"
                  />
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#FAFAFA] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* 3. Perlu Perhatian (H-3 Expired) */}
              <Link
                href="/customers?status=expiring_soon"
                className="group flex-1 p-5 flex items-center justify-between gap-4 hover:bg-[#17171D]/60 transition border-l-2 border-l-[#EAB308]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#17171D] border border-white/[0.09] flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-[#EAB308]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#FAFAFA] truncate">
                      Perlu Perhatian (H-3)
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09] whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                      &le; 3 Hari &bull; Tagih
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <AnimatedNumber
                    value={activeData.kpi.expiringSoonCount}
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]"
                  />
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#FAFAFA] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </section>

          {/* Row 2: Architectural Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CustomerGrowthChart
              series={activeData.customerGrowthSeries}
              activeMonth={month}
              onSelectMonth={setMonth}
            />
            <FinanceComparisonChart
              series={activeData.financeSeries}
              activeMonth={month}
              onSelectMonth={setMonth}
            />
          </section>

          {/* Row 3: Top 5 Upcoming Expirations */}
          <section className="surface-card rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#FAFAFA] tracking-tight">
                  Daftar Jatuh Tempo Terdekat (Top 5)
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Pelanggan aktif dengan masa berakhir terdekat &mdash; kirim
                  pengingat WhatsApp dalam 1 klik
                </p>
              </div>
              <Link
                href="/customers"
                className="group/link inline-flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition"
              >
                <span>Buka Datalist Pelanggan</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {activeData.upcomingExpirations.length === 0 ? (
              <div className="py-10 text-center text-xs sm:text-sm text-[#71717A]">
                Belum ada pelanggan aktif yang mendekati jatuh tempo.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {activeData.upcomingExpirations.map((customer) => {
                  const statusMeta = getCustomerStatusMeta(customer.status);
                  const initials = customer.full_name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0] ?? "")
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={customer.id}
                      className="py-3.5 first:pt-2 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-2.5 -mx-2.5 hover:bg-[#17171D]/55 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-[#17171D] border border-white/[0.09] flex items-center justify-center text-xs font-semibold text-[#E4E4E7] shrink-0 mt-0.5">
                          {initials || "NT"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-[#FAFAFA] truncate">
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
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#0C0C10] text-[#A1A1AA] border border-white/[0.08]">
                                {customer.family_group_name}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#71717A] mt-1">
                            <span className="inline-flex items-center gap-1">
                              <span className="font-mono text-[11px] text-[#A1A1AA]">
                                {customer.gmail}
                              </span>
                              <CopyButton value={customer.gmail} label="Gmail" />
                            </span>
                            <span>&bull;</span>
                            <span>{customer.package_name}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-[11px] text-[#E4E4E7]">
                              {formatShortDate(customer.end_date)}
                            </span>
                            <span>
                              (
                              {customer.days_remaining === 0
                                ? "Hari ini"
                                : `Sisa ${customer.days_remaining} hari`}
                              )
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                        <a
                          href={customer.remind_wa_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] text-[#FAFAFA] border border-white/[0.12] px-3.5 py-2 text-xs font-medium transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#22C55E]" />
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
    </PageTransition>
  );
}
