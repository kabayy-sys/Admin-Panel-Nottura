import type {
  CustomerInsert,
  CustomerRow,
  CustomerUpdate,
  DuplicateGmailCheckResult,
  EnrichedCustomer,
  PaymentMethod,
  TransactionRow,
} from "@/types/database";
import {
  calculateDefaultEndDate,
  calculateRenewedEndDate,
  checkDuplicateGmail,
  enrichCustomer,
  getDefaultPackagePrice,
  getTodayDateString,
} from "@/lib/logic/customer";
import { isValidWhatsApp, normalizeWhatsApp } from "@/lib/logic/whatsapp";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface RecordIncomeOptions {
  record: boolean;
  amount?: number;
  payment_method?: PaymentMethod | null;
  description?: string | null;
  transaction_date?: string;
}

/**
 * Mengambil semua pelanggan beserta status otomatis, nama grup, dan URL Remind WA.
 */
export async function listCustomers(
  today: string = getTodayDateString(),
): Promise<EnrichedCustomer[]> {
  const supabase = createSupabaseBrowserClient();

  const [customersRes, groupsRes] = await Promise.all([
    supabase.from("customers").select("*").order("end_date", { ascending: true }),
    supabase.from("family_groups").select("id, group_name"),
  ]);

  if (customersRes.error) {
    throw new Error(customersRes.error.message);
  }
  if (groupsRes.error) {
    throw new Error(groupsRes.error.message);
  }

  const groupNameById: Record<string, string> = {};
  for (const group of (groupsRes.data ?? []) as Array<{
    id: string;
    group_name: string;
  }>) {
    groupNameById[group.id] = group.group_name;
  }

  const customers = (customersRes.data ?? []) as CustomerRow[];
  return customers.map((customer) =>
    enrichCustomer(customer, groupNameById, today),
  );
}

/**
 * Mengecek duplikat Gmail terhadap data pelanggan di database (pengingat cooldown 12 bulan).
 */
export async function checkCustomerGmailDuplicate(
  gmail: string,
  excludeCustomerId?: string,
): Promise<DuplicateGmailCheckResult> {
  const normalized = gmail.trim().toLowerCase();
  if (!normalized) {
    return { isDuplicate: false, matches: [], warningMessage: null };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("customers").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return checkDuplicateGmail(
    gmail,
    (data ?? []) as CustomerRow[],
    excludeCustomerId,
  );
}

/**
 * Menambahkan pelanggan baru, menormalkan WA (`628...`), mengatur default `end_date` (+30 hari),
 * menyimpan audit trail `created_by`, dan opsional mencatat transaksi pemasukan `new_order`.
 */
export async function createCustomer(
  payload: CustomerInsert,
  adminEmail: string,
  options?: { recordIncome?: RecordIncomeOptions },
): Promise<{ customer: CustomerRow; transaction: TransactionRow | null }> {
  const normalizedWa = normalizeWhatsApp(payload.whatsapp);
  if (!isValidWhatsApp(normalizedWa)) {
    throw new Error(
      "Nomor WhatsApp tidak valid. Gunakan format nomor Indonesia (contoh: 0812... atau 62812...).",
    );
  }

  const endDate =
    payload.end_date && payload.end_date.trim()
      ? payload.end_date.trim()
      : calculateDefaultEndDate(payload.start_date, 30);

  const actorEmail = payload.created_by?.trim() || adminEmail;

  const supabase = createSupabaseBrowserClient();
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .insert({
      full_name: payload.full_name.trim(),
      whatsapp: normalizedWa,
      gmail: payload.gmail.trim().toLowerCase(),
      family_group_id: payload.family_group_id || null,
      package_name: payload.package_name.trim(),
      start_date: payload.start_date,
      end_date: endDate,
      created_by: actorEmail,
    })
    .select("*")
    .single();

  if (customerError) {
    throw new Error(customerError.message);
  }

  const customer = customerData as CustomerRow;
  let transaction: TransactionRow | null = null;

  if (options?.recordIncome?.record) {
    const amount =
      options.recordIncome.amount ??
      getDefaultPackagePrice(customer.package_name);

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .insert({
        type: "income",
        category: "new_order",
        amount,
        customer_id: customer.id,
        payment_method: options.recordIncome.payment_method ?? null,
        description:
          options.recordIncome.description ??
          `Order baru: ${customer.full_name} (${customer.package_name})`,
        transaction_date:
          options.recordIncome.transaction_date ?? customer.start_date,
        recorded_by: actorEmail,
      })
      .select("*")
      .single();

    if (txError) {
      throw new Error(
        `Pelanggan berhasil disimpan, namun gagal mencatat pemasukan: ${txError.message}`,
      );
    }

    transaction = txData as TransactionRow;
  }

  return { customer, transaction };
}

/**
 * Memperbarui data pelanggan dengan normalisasi WhatsApp otomatis jika nomor diubah.
 */
export async function updateCustomer(
  id: string,
  payload: CustomerUpdate,
): Promise<CustomerRow> {
  const updateData: CustomerUpdate = { ...payload };

  if (payload.full_name !== undefined) {
    updateData.full_name = payload.full_name.trim();
  }
  if (payload.gmail !== undefined) {
    updateData.gmail = payload.gmail.trim().toLowerCase();
  }
  if (payload.package_name !== undefined) {
    updateData.package_name = payload.package_name.trim();
  }
  if (payload.whatsapp !== undefined) {
    const normalizedWa = normalizeWhatsApp(payload.whatsapp);
    if (!isValidWhatsApp(normalizedWa)) {
      throw new Error(
        "Nomor WhatsApp tidak valid. Gunakan format nomor Indonesia (contoh: 0812... atau 62812...).",
      );
    }
    updateData.whatsapp = normalizedWa;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerRow;
}

/**
 * Menghapus data pelanggan berdasarkan ID.
 */
export async function deleteCustomer(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Memperpanjang masa aktif pelanggan (+30 hari) dan opsional mencatat transaksi pemasukan `renewal`.
 */
export async function renewCustomer(
  id: string,
  adminEmail: string,
  options?: { days?: number; recordIncome?: RecordIncomeOptions },
): Promise<{ customer: CustomerRow; transaction: TransactionRow | null }> {
  const supabase = createSupabaseBrowserClient();

  const { data: existingData, error: fetchError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingData) {
    throw new Error(fetchError?.message ?? "Data pelanggan tidak ditemukan.");
  }

  const existing = existingData as CustomerRow;
  const nextEndDate = calculateRenewedEndDate(
    existing.end_date,
    options?.days ?? 30,
  );

  const { data: updatedData, error: updateError } = await supabase
    .from("customers")
    .update({ end_date: nextEndDate })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const customer = updatedData as CustomerRow;
  let transaction: TransactionRow | null = null;

  if (options?.recordIncome?.record) {
    const amount =
      options.recordIncome.amount ??
      getDefaultPackagePrice(customer.package_name);

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .insert({
        type: "income",
        category: "renewal",
        amount,
        customer_id: customer.id,
        payment_method: options.recordIncome.payment_method ?? null,
        description:
          options.recordIncome.description ??
          `Perpanjangan: ${customer.full_name} (${customer.package_name})`,
        transaction_date:
          options.recordIncome.transaction_date ?? getTodayDateString(),
        recorded_by: adminEmail,
      })
      .select("*")
      .single();

    if (txError) {
      throw new Error(
        `Masa aktif diperpanjang, namun gagal mencatat pemasukan: ${txError.message}`,
      );
    }

    transaction = txData as TransactionRow;
  }

  return { customer, transaction };
}
