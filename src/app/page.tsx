"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { year, setYear, month, setMonth, data, loading, error, refresh } =
    useDashboard();

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  // TODO(Arya): Slicing Sidebar/Header, KPI Cards, Charts (Kenaikan Pelanggan & Keuangan), dan Widget Jatuh Tempo Terdekat.
  return (
    <main>
      <header>
        <h1>Dashboard Nottura Admin</h1>
        <p>Admin aktif: {user ? `${user.name} (${user.email})` : "-"}</p>
        <nav>
          <Link href="/">Dashboard</Link> |{" "}
          <Link href="/accounts">Akun Google Pro</Link> |{" "}
          <Link href="/customers">Pelanggan</Link> |{" "}
          <Link href="/finance">Keuangan</Link> |{" "}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <section>
        <h2>Filter Periode</h2>
        <label htmlFor="dash-month">Bulan</label>
        <input
          id="dash-month"
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value) || 1)}
        />
        <label htmlFor="dash-year">Tahun</label>
        <input
          id="dash-year"
          type="number"
          min={2024}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || year)}
        />
        <button type="button" onClick={() => void refresh()}>
          Muat Ulang
        </button>
      </section>

      {loading ? <p>Memuat data dashboard...</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {data ? (
        <>
          <section>
            <h2>KPI Ringkasan</h2>
            <ul>
              <li>Total Pelanggan Aktif: {data.kpi.activeCustomers}</li>
              <li>Total Slot Ready: {data.kpi.totalReadySlots}</li>
              <li>
                <Link href="/customers?status=expiring_soon">
                  Perlu Perhatian (H-3 Expired): {data.kpi.expiringSoonCount}
                </Link>
              </li>
              <li>Omzet Bulan Ini: Rp {data.kpi.monthlyIncome}</li>
              <li>Pengeluaran Bulan Ini: Rp {data.kpi.monthlyExpense}</li>
              <li>Profit Bersih: Rp {data.kpi.monthlyNetProfit}</li>
            </ul>
          </section>

          <section>
            <h2>Jatuh Tempo Terdekat (Top 5)</h2>
            {data.upcomingExpirations.length === 0 ? (
              <p>Belum ada data pelanggan.</p>
            ) : (
              <ul>
                {data.upcomingExpirations.map((customer) => (
                  <li key={customer.id}>
                    {customer.full_name} — Habis: {customer.end_date} (Sisa{" "}
                    {customer.days_remaining} hari) —{" "}
                    <a
                      href={customer.remind_wa_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Remind WA
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Data Grafik Kenaikan Pelanggan ({data.year})</h2>
            <pre>{JSON.stringify(data.customerGrowthSeries, null, 2)}</pre>
          </section>

          <section>
            <h2>Data Grafik Keuangan ({data.year})</h2>
            <pre>{JSON.stringify(data.financeSeries, null, 2)}</pre>
          </section>
        </>
      ) : null}
    </main>
  );
}
