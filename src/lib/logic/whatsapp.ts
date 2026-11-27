const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Menormalkan nomor WhatsApp Indonesia menjadi format `628...`.
 * Contoh: `0812-3456-7890` -> `6281234567890`, `+62 812...` -> `62812...`, `812...` -> `62812...`.
 */
export function normalizeWhatsApp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

/**
 * Memvalidasi format nomor WhatsApp sesuai constraint database (`^62[0-9]{8,15}$`).
 */
export function isValidWhatsApp(normalized: string): boolean {
  return /^62[0-9]{8,15}$/.test(normalized);
}

/**
 * Memformat string tanggal `YYYY-MM-DD` menjadi format tanggal Indonesia yang mudah dibaca.
 */
export function formatIndonesianDate(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    return dateStr;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = INDONESIAN_MONTHS[monthIndex];

  if (!monthName) {
    return dateStr;
  }

  return `${day} ${monthName} ${year}`;
}

export interface RemindWhatsAppParams {
  fullName: string;
  whatsapp: string;
  endDate: string;
  packageName?: string;
}

/**
 * Menghasilkan URL 1-klik WhatsApp (`https://wa.me/...`) dengan template pengingat masa aktif.
 */
export function buildRemindWhatsAppUrl({
  fullName,
  whatsapp,
  endDate,
  packageName,
}: RemindWhatsAppParams): string {
  const normalizedPhone = normalizeWhatsApp(whatsapp);
  const formattedDate = formatIndonesianDate(endDate);
  const packageLabel = packageName ? ` (${packageName})` : "";

  const message =
    `Halo Kak ${fullName}, kami dari tim Nottura ingin mengingatkan bahwa masa aktif langganan Google AI Pro${packageLabel} Kakak akan berakhir pada ${formattedDate}. ` +
    `Jika ingin perpanjang agar akses tetap lancar, silakan balas pesan ini ya. Terima kasih!`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
