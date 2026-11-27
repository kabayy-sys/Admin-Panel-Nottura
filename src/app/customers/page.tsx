"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type { CustomerStatus, PaymentMethod } from "@/types/database";
import {
  PACKAGE_OPTIONS,
  getDefaultPackagePrice,
  getTodayDateString,
} from "@/lib/logic/customer";
import { useCustomers } from "@/hooks/useCustomers";

function CustomersContent() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") as
    | CustomerStatus
    | "all"
    | null;

  const {
    customers,
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
    checkGmailDuplicate,
    createCustomer,
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

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [gmail, setGmail] = useState("");
  const [familyGroupId, setFamilyGroupId] = useState("");
  const [packageName, setPackageName] = useState(PACKAGE_OPTIONS[0].name);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [recordIncome, setRecordIncome] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [gmailWarning, setGmailWarning] = useState<string | null>(null);

  function handleGmailChange(value: string) {
    setGmail(value);
    const check = checkGmailDuplicate(value);
    setGmailWarning(check.warningMessage);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createCustomer(
      {
        full_name: fullName,
        whatsapp,
        gmail,
        family_group_id: familyGroupId || null,
        package_name: packageName,
        start_date: startDate,
      },
      {
        recordIncome: {
          record: recordIncome,
          amount: getDefaultPackagePrice(packageName),
          payment_method: paymentMethod,
        },
      },
    );
    setFullName("");
    setWhatsapp("");
    setGmail("");
    setGmailWarning(null);
  }

  // TODO(Arya): Ganti markup polos dengan Datalist Pelanggan responsif, tab filter cepat, modal Form + konfirmasi pemasukan saat Perpanjang.
  return (
    <main>
      <h1>Datalist Pelanggan</h1>
      <nav>
        <Link href="/">Kembali ke Dashboard</Link>
      </nav>

      {error ? <p role="alert">{error}</p> : null}

      <section>
        <h2>Filter & Pencarian</h2>
        <input
          placeholder="Cari nama / Gmail / WhatsApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as CustomerStatus | "all")
          }
        >
          <option value="all">Semua</option>
          <option value="active">Aktif</option>
          <option value="expiring_soon">H-3 Expired</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="all">Semua Grup</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.group_name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>Tambah Pelanggan Baru</h2>
        <form onSubmit={handleCreate}>
          <input
            placeholder="Nama Lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            placeholder="No. WhatsApp (08... / 628...)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Alamat Gmail"
            value={gmail}
            onChange={(e) => handleGmailChange(e.target.value)}
            required
          />
          {gmailWarning ? <p role="status">{gmailWarning}</p> : null}
          <select
            value={familyGroupId}
            onChange={(e) => setFamilyGroupId(e.target.value)}
          >
            <option value="">Pilih Grup Family</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name} ({group.ready_slots} ready)
              </option>
            ))}
          </select>
          <select
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
          >
            {PACKAGE_OPTIONS.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={recordIncome}
              onChange={(e) => setRecordIncome(e.target.checked)}
            />
            Catat ke Keuangan otomatis
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="QRIS">QRIS</option>
            <option value="Transfer">Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <button type="submit" disabled={submitting}>
            Simpan Pelanggan
          </button>
        </form>
      </section>

      <section>
        <h2>Daftar Pelanggan</h2>
        {loading ? <p>Memuat pelanggan...</p> : null}
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>WhatsApp</th>
              <th>Gmail</th>
              <th>Grup</th>
              <th>Paket</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.full_name}</td>
                <td>{customer.whatsapp}</td>
                <td>{customer.gmail}</td>
                <td>{customer.family_group_name ?? "-"}</td>
                <td>{customer.package_name}</td>
                <td>{customer.start_date}</td>
                <td>{customer.end_date}</td>
                <td>{customer.status}</td>
                <td>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void renewCustomer(customer.id, {
                        days: 30,
                        recordIncome: {
                          record: true,
                          amount: getDefaultPackagePrice(customer.package_name),
                          payment_method: "QRIS",
                        },
                      })
                    }
                  >
                    Perpanjang (+30h)
                  </button>{" "}
                  <a
                    href={customer.remind_wa_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Remind WA
                  </a>{" "}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void deleteCustomer(customer.id)}
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

export default function CustomersPage() {
  return (
    <Suspense fallback={<main>Memuat daftar pelanggan...</main>}>
      <CustomersContent />
    </Suspense>
  );
}
