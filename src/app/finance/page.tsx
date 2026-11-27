"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import type {
  PaymentMethod,
  TransactionCategory,
  TransactionRow,
  TransactionType,
} from "@/types/database";
import { getTodayDateString } from "@/lib/logic/customer";
import {
  calculateMonthlyFinanceSummary,
  exportTransactionsToCsv,
} from "@/lib/logic/finance";
import { useFinance } from "@/hooks/useFinance";
import { buildDemoSeed } from "@/components/demo-data";
import {
  formatRupiah,
  formatShortDate,
  getCategoryLabel,
  getMonthLabel,
  getTransactionTypeMeta,
} from "@/components/formatters";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Modal } from "@/components/ui/Modal";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/MotionPrimitives";
import { PeriodStepper } from "@/components/ui/PeriodStepper";
import { useToast } from "@/components/ui/ToastProvider";

export default function FinancePage() {
  const toast = useToast();
  const {
    transactions,
    summary,
    year,
    setYear,
    month,
    setMonth,
    typeFilter,
    setTypeFilter,
    loading,
    submitting,
    error,
    supabaseConfigured,
    createTransaction,
    deleteTransaction,
    downloadCsv,
  } = useFinance();

  const initialDemo = useMemo(() => buildDemoSeed(), []);
  const [demoTransactions, setDemoTransactions] = useState<TransactionRow[]>(
    initialDemo.transactions,
  );
  const isUsingDemo = !supabaseConfigured && transactions.length === 0;

  const activeTransactions = useMemo(() => {
    if (!isUsingDemo) return transactions;
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return demoTransactions.filter((tx) => {
      const inMonth = tx.transaction_date.startsWith(prefix);
      const matchType = typeFilter === "all" || tx.type === typeFilter;
      return inMonth && matchType;
    });
  }, [isUsingDemo, transactions, demoTransactions, year, month, typeFilter]);

  const activeSummary = useMemo(() => {
    if (!isUsingDemo) return summary;
    return calculateMonthlyFinanceSummary(demoTransactions, year, month);
  }, [isUsingDemo, summary, demoTransactions, year, month]);

  const profitMargin = useMemo(() => {
    if (activeSummary.income <= 0) return 0;
    return Math.round((activeSummary.netProfit / activeSummary.income) * 100);
  }, [activeSummary]);

  const cashflowSplit = useMemo(() => {
    const total = activeSummary.income + activeSummary.expense;
    if (total <= 0) return { incomePct: 50, expensePct: 50 };
    const incomePct = Math.round((activeSummary.income / total) * 100);
    return { incomePct, expensePct: 100 - incomePct };
  }, [activeSummary]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>("account_cost");
  const [amount, setAmount] = useState<number>(140000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transfer");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(getTodayDateString());

  function openTransactionModal(initialType: TransactionType) {
    setType(initialType);
    setCategory(initialType === "income" ? "new_order" : "account_cost");
    setAmount(initialType === "income" ? 35000 : 140000);
    setPaymentMethod(initialType === "income" ? "QRIS" : "Transfer");
    setDescription("");
    setTransactionDate(getTodayDateString());
    setModalOpen(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (isUsingDemo) {
        setDemoTransactions((prev) => [
          {
            id: `demo-tx-${Date.now()}`,
            type,
            category,
            amount,
            customer_id: null,
            payment_method: paymentMethod,
            description: description.trim() || null,
            transaction_date: transactionDate,
            recorded_by: "nottura@local",
            created_at: transactionDate,
          },
          ...prev,
        ]);
        toast.success("Transaksi berhasil dicatat");
        setModalOpen(false);
        return;
      }

      await createTransaction({
        type,
        category,
        amount,
        payment_method: paymentMethod,
        description: description.trim() || null,
        transaction_date: transactionDate,
      });
      toast.success("Transaksi berhasil dicatat");
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mencatat transaksi",
      );
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      window.setTimeout(() => {
        setConfirmDeleteId((current) => (current === id ? null : current));
      }, 3000);
      return;
    }

    setConfirmDeleteId(null);
    try {
      if (isUsingDemo) {
        setDemoTransactions((prev) => prev.filter((item) => item.id !== id));
        toast.success("Transaksi dihapus");
        return;
      }
      await deleteTransaction(id);
      toast.success("Transaksi dihapus");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus transaksi",
      );
    }
  }

  function handleExportCsv() {
    if (!isUsingDemo) {
      downloadCsv();
      toast.success("Laporan CSV berhasil diunduh");
      return;
    }
    const csv = exportTransactionsToCsv(activeTransactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nottura-finance-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV berhasil diunduh");
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header Toolbar */}
      <section className="surface-card rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#FAFAFA] tracking-tight">
              Arus Kas &amp; Riwayat Transaksi
            </h2>
            {isUsingDemo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Rekap pemasukan paket pelanggan &amp; pengeluaran modal bulan{" "}
            <span className="text-[#E4E4E7] font-medium">
              {getMonthLabel(month)} {year}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => openTransactionModal("expense")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#17171D] hover:bg-[#22222A] text-[#E4E4E7] border border-white/[0.1] px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#EF4444]" />
            <span>Catat Pengeluaran</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => openTransactionModal("income")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold px-3.5 py-2 text-xs sm:text-sm transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Pemasukan</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0C0C10] hover:bg-[#17171D] text-[#E4E4E7] border border-white/[0.09] px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#A1A1AA]" />
            <span>Export CSV</span>
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

      {/* Monthly Finance Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <div className="surface-card surface-interactive rounded-2xl p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-[#17171D] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-[#22C55E]" />
                </div>
                <span className="text-xs font-medium text-[#A1A1AA] truncate">
                  Total Pemasukan ({getMonthLabel(month)})
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                Masuk
              </span>
            </div>
            <div className="mt-4">
              <AnimatedNumber
                value={activeSummary.income}
                formatter={formatRupiah}
                className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#FAFAFA]"
              />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="surface-card surface-interactive rounded-2xl p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-[#17171D] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <ArrowDownRight className="h-4 w-4 text-[#EF4444]" />
                </div>
                <span className="text-xs font-medium text-[#A1A1AA] truncate">
                  Total Pengeluaran ({getMonthLabel(month)})
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#17171D] text-[#A1A1AA] border border-white/[0.09]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                Keluar
              </span>
            </div>
            <div className="mt-4">
              <AnimatedNumber
                value={activeSummary.expense}
                formatter={formatRupiah}
                className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#FAFAFA]"
              />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="surface-card surface-interactive rounded-2xl p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-[#17171D] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4 text-[#FAFAFA]" />
                </div>
                <span className="text-xs font-medium text-[#A1A1AA] truncate">
                  Profit Bersih ({getMonthLabel(month)})
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                Margin {profitMargin}%
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <AnimatedNumber
                  value={activeSummary.netProfit}
                  formatter={formatRupiah}
                  className={`text-2xl sm:text-[26px] font-bold tracking-tight ${
                    activeSummary.netProfit >= 0
                      ? "text-[#FAFAFA]"
                      : "text-[#EF4444]"
                  }`}
                />
                <span className="text-[11px] font-mono text-[#71717A] shrink-0">
                  {activeTransactions.length} trx
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#17171D] overflow-hidden flex gap-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cashflowSplit.incomePct}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-[#FAFAFA]"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cashflowSplit.expensePct}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-[#3F3F46]"
                />
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Filter Bar & Transactions Table */}
      <section className="surface-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl surface-inset p-1">
            {(
              [
                { value: "all", label: "Semua Transaksi" },
                { value: "income", label: "Uang Masuk" },
                { value: "expense", label: "Uang Keluar" },
              ] as const
            ).map((tab) => {
              const active = typeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeFilter(tab.value)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    active ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#E4E4E7]"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="finance-type-tab"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 35,
                      }}
                      className="absolute inset-0 rounded-lg bg-[#17171D] border border-white/[0.1]"
                    />
                  ) : null}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <PeriodStepper
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </div>

        {loading && activeTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#71717A]">
            Memuat riwayat transaksi...
          </div>
        ) : activeTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#71717A]">
            Belum ada transaksi tercatat pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#71717A] bg-[#0C0C10]">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07] text-xs sm:text-sm">
                {activeTransactions.map((tx) => {
                  const typeMeta = getTransactionTypeMeta(tx.type);
                  const confirmingDelete = confirmDeleteId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#17171D]/55 transition"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA] whitespace-nowrap">
                        {formatShortDate(tx.transaction_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${typeMeta.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${typeMeta.dotClass}`}
                          />
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#FAFAFA] font-medium whitespace-nowrap text-xs sm:text-sm">
                        {getCategoryLabel(tx.category)}
                      </td>
                      <td className="py-3.5 px-4 text-[#A1A1AA] text-xs sm:text-sm">
                        {tx.description ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#0C0C10] text-[#E4E4E7] border border-white/[0.08]">
                          {tx.payment_method ?? "-"}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 font-mono font-semibold tabular-nums whitespace-nowrap ${typeMeta.amountClass}`}
                      >
                        {typeMeta.sign} {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#71717A] text-xs whitespace-nowrap">
                        {tx.recorded_by}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDelete(tx.id)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium cursor-pointer transition ${
                            confirmingDelete
                              ? "bg-[#EF4444] text-white border-[#EF4444]"
                              : "bg-[#0C0C10] hover:bg-[#17171D] text-[#A1A1AA] hover:text-[#EF4444] border-white/[0.08]"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{confirmingDelete ? "Yakin?" : "Hapus"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Form Catat Transaksi */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          type === "income"
            ? "Catat Pemasukan Manual"
            : "Catat Pengeluaran / Modal"
        }
        subtitle="Otomatis menyimpan email admin aktif pada kolom audit recorded_by"
        maxWidth="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Tipe Transaksi
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value as TransactionType;
                  setType(nextType);
                  setCategory(
                    nextType === "income" ? "new_order" : "account_cost",
                  );
                }}
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="income">Masuk (Pemasukan)</option>
                <option value="expense">Keluar (Pengeluaran)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TransactionCategory)
                }
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="new_order">Order Baru</option>
                <option value="renewal">Perpanjangan</option>
                <option value="account_cost">Modal Akun</option>
                <option value="operational">Lainnya / Operasional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Nominal (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                required
                className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="input-field w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
              className="input-field w-full rounded-xl px-3.5 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Keterangan
            </label>
            <input
              placeholder="Contoh: Beli akun induk Nottura-05 / Perpanjang domain"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full rounded-xl px-3.5 py-2 text-sm"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl bg-[#17171D] hover:bg-[#22222A] border border-white/[0.08] px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-semibold px-4 py-2 text-xs cursor-pointer transition"
            >
              {submitting ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
