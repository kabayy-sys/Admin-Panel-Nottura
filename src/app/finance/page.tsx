"use client";

import { useMemo, useState, type FormEvent } from "react";
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
  MONTH_OPTIONS,
  formatRupiah,
  formatShortDate,
  getCategoryLabel,
  getMonthLabel,
  getTransactionTypeMeta,
} from "@/components/formatters";

export default function FinancePage() {
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

  // Demo mode fallback when Supabase is not configured locally
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

  // Modal Form Catat Transaksi
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
          recorded_by: "arya@nottura.my.id",
          created_at: transactionDate,
        },
        ...prev,
      ]);
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
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (isUsingDemo) {
      setDemoTransactions((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    await deleteTransaction(id);
  }

  function handleExportCsv() {
    if (!isUsingDemo) {
      downloadCsv();
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
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <section className="bg-[#090A33] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Arus Kas & Riwayat Transaksi
            </h2>
            {isUsingDemo ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Mode Preview Data Dummy
              </span>
            ) : null}
          </div>
          <p className="text-xs text-white/65 mt-0.5">
            Rekap pemasukan paket pelanggan & pengeluaran modal akun induk bulan{" "}
            <span className="text-white font-medium">
              {getMonthLabel(month)} {year}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openTransactionModal("expense")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/35 px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <span>+ Catat Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => openTransactionModal("income")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold px-3.5 py-2 text-xs sm:text-sm transition cursor-pointer shadow-sm"
          >
            <span>+ Catat Pemasukan</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <span>Export CSV</span>
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

      {/* Monthly Finance Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/65">
              Total Pemasukan ({getMonthLabel(month)})
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Masuk
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 mt-3">
            {formatRupiah(activeSummary.income)}
          </p>
        </div>

        <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/65">
              Total Pengeluaran ({getMonthLabel(month)})
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Keluar
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-400 mt-3">
            {formatRupiah(activeSummary.expense)}
          </p>
        </div>

        <div className="bg-[#090A33] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/65">
              Profit Bersih ({getMonthLabel(month)})
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-white/80 border border-white/15">
              {activeTransactions.length} Transaksi
            </span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold tracking-tight mt-3 ${
              activeSummary.netProfit >= 0 ? "text-white" : "text-rose-400"
            }`}
          >
            {formatRupiah(activeSummary.netProfit)}
          </p>
        </div>
      </section>

      {/* Filter Bar & Transactions Table */}
      <section className="bg-[#090A33] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                    active
                      ? "bg-white text-[#090A33] border-white font-semibold"
                      : "bg-[#121212] text-white/70 hover:text-white border-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value) || 1)}
              aria-label="Filter Bulan"
              className="rounded-xl bg-[#121212] border border-white/15 px-3 py-1.5 text-xs sm:text-sm text-white"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={2024}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
              aria-label="Filter Tahun"
              className="w-24 rounded-xl bg-[#121212] border border-white/15 px-3 py-1.5 text-xs sm:text-sm text-white"
            />
          </div>
        </div>

        {loading && activeTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/60">
            Memuat riwayat transaksi...
          </div>
        ) : activeTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/55">
            Belum ada transaksi tercatat pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-white/60 bg-black/20">
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
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                {activeTransactions.map((tx) => {
                  const typeMeta = getTransactionTypeMeta(tx.type);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3.5 px-4 text-white/80 whitespace-nowrap">
                        {formatShortDate(tx.transaction_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeMeta.badgeClass}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium whitespace-nowrap">
                        {getCategoryLabel(tx.category)}
                      </td>
                      <td className="py-3.5 px-4 text-white/75">
                        {tx.description ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-white/10 text-white/80 border border-white/15">
                          {tx.payment_method ?? "-"}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 font-semibold whitespace-nowrap ${typeMeta.amountClass}`}
                      >
                        {typeMeta.sign} {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-white/60 text-xs whitespace-nowrap">
                        {tx.recorded_by}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDelete(tx.id)}
                          className="rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-2.5 py-1 text-xs cursor-pointer"
                        >
                          Hapus
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
      {modalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090A33] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {type === "income"
                    ? "Catat Pemasukan Manual"
                    : "Catat Pengeluaran / Modal"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Otomatis menyimpan email admin aktif pada kolom audit{" "}
                  <code>recorded_by</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                &#10005;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
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
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white"
                  >
                    <option value="income">Masuk (Pemasukan)</option>
                    <option value="expense">Keluar (Pengeluaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TransactionCategory)
                    }
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white"
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
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-full rounded-xl bg-[#121212] border border-white/15 px-3 py-2 text-sm text-white"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Keterangan
                </label>
                <input
                  placeholder="Contoh: Beli akun induk Nottura-05 / Perpanjang domain"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-white/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-white text-[#090A33] hover:bg-white/90 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
