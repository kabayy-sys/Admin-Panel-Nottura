import type {
  CustomerRow,
  CustomerStatus,
  DuplicateGmailCheckResult,
  EnrichedCustomer,
} from "@/types/database";
import { buildRemindWhatsAppUrl } from "@/lib/logic/whatsapp";

export interface PackageOption {
  name: string;
  price: number;
}

export const PACKAGE_OPTIONS: readonly PackageOption[] = [
  { name: "Solo 35k", price: 35000 },
  { name: "Full Group 150k", price: 150000 },
  { name: "Squad 30k", price: 30000 },
] as const;

const MS_PER_DAY = 86_400_000;

/**
 * Mengambil harga default berdasarkan nama paket dari PRD.
 */
export function getDefaultPackagePrice(packageName: string): number {
  const found = PACKAGE_OPTIONS.find(
    (option) => option.name.toLowerCase() === packageName.trim().toLowerCase(),
  );
  return found ? found.price : 0;
}

/**
 * Mengembalikan tanggal hari ini dalam format `YYYY-MM-DD` (zona waktu Asia/Jakarta).
 */
export function getTodayDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDateToUtcMs(dateStr: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    throw new Error(`Format tanggal tidak valid (harus YYYY-MM-DD): "${dateStr}"`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`Tanggal kalender tidak valid: "${dateStr}"`);
  }

  return utcDate.getTime();
}

/**
 * Menambah atau mengurangi jumlah hari pada tanggal `YYYY-MM-DD` menggunakan UTC agar bebas drift timezone.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const utcMs = parseDateToUtcMs(dateStr);
  const nextDate = new Date(utcMs + days * MS_PER_DAY);
  return nextDate.toISOString().slice(0, 10);
}

/**
 * Menghitung tanggal selesai default (+30 hari dari `startDate`).
 */
export function calculateDefaultEndDate(startDate: string, days = 30): string {
  return addDaysToDateString(startDate, days);
}

/**
 * Menghitung tanggal selesai baru saat klik tombol Perpanjang (+30 hari dari `currentEndDate`).
 */
export function calculateRenewedEndDate(currentEndDate: string, days = 30): string {
  return addDaysToDateString(currentEndDate, days);
}

/**
 * Menghitung selisih hari antara `endDate` dan `today`.
 * Nilai negatif berarti sudah lewat (expired).
 */
export function getDaysRemaining(
  endDate: string,
  today: string = getTodayDateString(),
): number {
  const endMs = parseDateToUtcMs(endDate);
  const todayMs = parseDateToUtcMs(today);
  return Math.round((endMs - todayMs) / MS_PER_DAY);
}

/**
 * Menentukan status pelanggan otomatis:
 * - `expired`: hari tersisa < 0
 * - `expiring_soon`: hari tersisa 0..3 (H-3 Expired)
 * - `active`: hari tersisa > 3
 */
export function getCustomerStatus(
  endDate: string,
  today: string = getTodayDateString(),
): CustomerStatus {
  const days = getDaysRemaining(endDate, today);
  if (days < 0) {
    return "expired";
  }
  if (days <= 3) {
    return "expiring_soon";
  }
  return "active";
}

/**
 * Mengecek apakah Gmail sudah pernah terdaftar pada pelanggan lain (case-insensitive)
 * untuk memberi peringatan aturan cooldown 12 bulan Google Family.
 */
export function checkDuplicateGmail(
  gmail: string,
  customers: CustomerRow[],
  excludeCustomerId?: string,
): DuplicateGmailCheckResult {
  const normalizedGmail = gmail.trim().toLowerCase();
  if (!normalizedGmail) {
    return {
      isDuplicate: false,
      matches: [],
      warningMessage: null,
    };
  }

  const matches = customers.filter(
    (customer) =>
      customer.id !== excludeCustomerId &&
      customer.gmail.trim().toLowerCase() === normalizedGmail,
  );

  if (matches.length === 0) {
    return {
      isDuplicate: false,
      matches: [],
      warningMessage: null,
    };
  }

  return {
    isDuplicate: true,
    matches,
    warningMessage:
      `Gmail "${gmail.trim()}" sudah pernah terdaftar pada data pelanggan lain. ` +
      `Perhatikan aturan cooldown 12 bulan Google Family Sharing sebelum memindahkan akun ke grup baru.`,
  };
}

/**
 * Memperkaya record `CustomerRow` dengan status otomatis, sisa hari, nama grup, dan link Remind WA.
 */
export function enrichCustomer(
  customer: CustomerRow,
  groupNameById: Record<string, string> = {},
  today: string = getTodayDateString(),
): EnrichedCustomer {
  const days_remaining = getDaysRemaining(customer.end_date, today);
  const status = getCustomerStatus(customer.end_date, today);
  const family_group_name = customer.family_group_id
    ? (groupNameById[customer.family_group_id] ?? null)
    : null;

  return {
    ...customer,
    status,
    days_remaining,
    family_group_name,
    remind_wa_url: buildRemindWhatsAppUrl({
      fullName: customer.full_name,
      whatsapp: customer.whatsapp,
      endDate: customer.end_date,
      packageName: customer.package_name,
    }),
  };
}

export interface CustomerFilterParams {
  search?: string;
  status?: CustomerStatus | "all";
  familyGroupId?: string | "all";
}

/**
 * Menyaring daftar pelanggan berdasarkan query pencarian (nama, Gmail, WA), status, dan grup family.
 */
export function filterCustomers(
  customers: EnrichedCustomer[],
  { search = "", status = "all", familyGroupId = "all" }: CustomerFilterParams,
): EnrichedCustomer[] {
  const q = search.trim().toLowerCase();

  return customers.filter((customer) => {
    if (status !== "all" && customer.status !== status) {
      return false;
    }

    if (familyGroupId !== "all" && customer.family_group_id !== familyGroupId) {
      return false;
    }

    if (q) {
      const matchName = customer.full_name.toLowerCase().includes(q);
      const matchGmail = customer.gmail.toLowerCase().includes(q);
      const matchWa = customer.whatsapp.toLowerCase().includes(q);
      if (!matchName && !matchGmail && !matchWa) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Mengambil hingga `limit` pelanggan non-expired yang tanggal habisnya paling dekat.
 */
export function getUpcomingExpirations(
  customers: CustomerRow[],
  limit = 5,
  today: string = getTodayDateString(),
  groupNameById: Record<string, string> = {},
): EnrichedCustomer[] {
  return customers
    .map((customer) => enrichCustomer(customer, groupNameById, today))
    .filter((customer) => customer.status !== "expired")
    .sort((a, b) => a.end_date.localeCompare(b.end_date))
    .slice(0, Math.max(0, limit));
}
