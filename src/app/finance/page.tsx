"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type {
  PaymentMethod,
  TransactionCategory,
  TransactionType,
} from "@/types/database";
import { getTodayDateString } from "@/lib/logic/customer";
import { useFinance } from "@/hooks/useFinance";

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
    createTransaction,
    deleteTransaction,
    downloadCsv,
  } = useFinance();

  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>("account_cost");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transfer");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(getTodayDateString());

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createTransaction({
      type,
      category,
      amount,
      payment_method: paymentMethod,
      description: description || null,
      transaction_date: transactionDate,
    });
    setAmount(0);
    setDescription("");
  }

  // TODO(Arya): Ganti markup polos dengan layout Keuangan dark mode, modal form Pemasukan/Pengeluaran, dan tombol Export CSV.
  return (
    <main>
      <h1>Keuangan / Cashflow</h1>
      <nav>
        <Link href="/">Kembali ke Dashboard</Link>
      </nav>

      {error ? <p role="alert">{error}</p> : null}

      <section>
        <h2>Filter Periode & Export</h2>
        <input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value) || 1)}
        />
        <input
          type="number"
          min={2024}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || year)}
        />
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as TransactionType | "all")
          }
        >
          <option value="all">Semua Tipe</option>
          <option value="income">Masuk</option>
          <option value="expense">Keluar</option>
        </select>
        <button type="button" onClick={downloadCsv}>
          Export CSV
        </button>
      </section>

      <section>
        <h2>Ringkasan Bulan Ini</h2>
        <ul>
          <li>Pemasukan: Rp {summary.income}</li>
          <li>Pengeluaran: Rp {summary.expense}</li>
          <li>Profit Bersih: Rp {summary.netProfit}</li>
        </ul>
      </section>

      <section>
        <h2>Catat Transaksi Manual</h2>
        <form onSubmit={handleCreate}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="income">Masuk</option>
            <option value="expense">Keluar</option>
          </select>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as TransactionCategory)
            }
          >
            <option value="new_order">Order Baru</option>
            <option value="renewal">Perpanjangan</option>
            <option value="account_cost">Modal Akun</option>
            <option value="operational">Operasional / Lainnya</option>
          </select>
          <input
            type="number"
            min={0}
            placeholder="Nominal"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            required
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="QRIS">QRIS</option>
            <option value="Transfer">Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <input
            placeholder="Keterangan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            Simpan Transaksi
          </button>
        </form>
      </section>

      <section>
        <h2>Riwayat Transaksi</h2>
        {loading ? <p>Memuat transaksi...</p> : null}
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th>Nominal</th>
              <th>Dicatat Oleh</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.transaction_date}</td>
                <td>{tx.type === "income" ? "Masuk" : "Keluar"}</td>
                <td>{tx.category}</td>
                <td>{tx.description ?? "-"}</td>
                <td>Rp {tx.amount}</td>
                <td>{tx.recorded_by}</td>
                <td>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void deleteTransaction(tx.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
