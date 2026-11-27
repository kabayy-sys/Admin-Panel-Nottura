import type {
  CustomerStatus,
  GroupStatus,
  TransactionCategory,
  TransactionType,
} from "@/types/database";

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("id-ID");

export function formatRupiah(amount: number): string {
  return IDR_FORMATTER.format(amount);
}

export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000)}rb`;
  }
  return `${sign}Rp ${NUMBER_FORMATTER.format(abs)}`;
}

export const MONTH_OPTIONS = [
  { value: 1, label: "Januari", short: "Jan" },
  { value: 2, label: "Februari", short: "Feb" },
  { value: 3, label: "Maret", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "Mei", short: "Mei" },
  { value: 6, label: "Juni", short: "Jun" },
  { value: 7, label: "Juli", short: "Jul" },
  { value: 8, label: "Agustus", short: "Agu" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "Oktober", short: "Okt" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "Desember", short: "Des" },
] as const;

export function getMonthLabel(month: number): string {
  return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? `Bulan ${month}`;
}

export function formatShortDate(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const shortMonth = MONTH_OPTIONS[monthIdx]?.short ?? match[2];
  return `${day} ${shortMonth} ${year}`;
}

export function getCustomerStatusMeta(status: CustomerStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case "active":
      return {
        label: "Aktif",
        badgeClass:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        dotClass: "bg-emerald-400",
      };
    case "expiring_soon":
      return {
        label: "H-3 Expired",
        badgeClass:
          "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        dotClass: "bg-amber-400",
      };
    case "expired":
      return {
        label: "Expired",
        badgeClass: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
        dotClass: "bg-rose-400",
      };
  }
}

export function getGroupStatusMeta(status: GroupStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case "active":
      return {
        label: "Aktif",
        badgeClass:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        dotClass: "bg-emerald-400",
      };
    case "full":
      return {
        label: "Penuh",
        badgeClass: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
        dotClass: "bg-rose-400",
      };
    case "suspended":
      return {
        label: "Bermasalah / Suspended",
        badgeClass: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        dotClass: "bg-amber-400",
      };
  }
}

export function getCategoryLabel(category: TransactionCategory): string {
  switch (category) {
    case "new_order":
      return "Order Baru";
    case "renewal":
      return "Perpanjangan";
    case "account_cost":
      return "Modal Akun";
    case "operational":
      return "Lainnya / Operasional";
  }
}

export function getTransactionTypeMeta(type: TransactionType): {
  label: string;
  badgeClass: string;
  amountClass: string;
  sign: string;
} {
  if (type === "income") {
    return {
      label: "Masuk",
      badgeClass:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      amountClass: "text-emerald-400",
      sign: "+",
    };
  }
  return {
    label: "Keluar",
    badgeClass: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    amountClass: "text-rose-400",
    sign: "-",
  };
}
