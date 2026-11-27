import type {
  CustomerRow,
  EnrichedCustomer,
  FamilyGroupInsert,
  FamilyGroupRow,
  FamilyGroupUpdate,
  FamilyGroupWithSlots,
} from "@/types/database";
import { enrichCustomer, getTodayDateString } from "@/lib/logic/customer";
import { calculateGroupSlotInfo } from "@/lib/logic/slots";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Mengambil seluruh grup Family Sharing beserta perhitungan slot otomatis.
 */
export async function listFamilyGroupsWithSlots(
  today: string = getTodayDateString(),
): Promise<FamilyGroupWithSlots[]> {
  const supabase = createSupabaseBrowserClient();

  const [groupsRes, customersRes] = await Promise.all([
    supabase
      .from("family_groups")
      .select("*")
      .order("group_name", { ascending: true }),
    supabase.from("customers").select("*"),
  ]);

  if (groupsRes.error) {
    throw new Error(groupsRes.error.message);
  }
  if (customersRes.error) {
    throw new Error(customersRes.error.message);
  }

  const groups = (groupsRes.data ?? []) as FamilyGroupRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];

  return groups.map((group) => calculateGroupSlotInfo(group, customers, today));
}

/**
 * Mengambil satu data grup berdasarkan ID.
 */
export async function getFamilyGroupById(
  id: string,
): Promise<FamilyGroupRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("family_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FamilyGroupRow | null) ?? null;
}

/**
 * Mengambil daftar anggota pelanggan yang tergabung dalam grup tertentu (maks. 5 slot).
 */
export async function getGroupMembers(
  groupId: string,
  today: string = getTodayDateString(),
): Promise<EnrichedCustomer[]> {
  const supabase = createSupabaseBrowserClient();

  const [groupRes, membersRes] = await Promise.all([
    supabase
      .from("family_groups")
      .select("id, group_name")
      .eq("id", groupId)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("*")
      .eq("family_group_id", groupId)
      .order("end_date", { ascending: true }),
  ]);

  if (groupRes.error) {
    throw new Error(groupRes.error.message);
  }
  if (membersRes.error) {
    throw new Error(membersRes.error.message);
  }

  const groupRow = groupRes.data as { id: string; group_name: string } | null;
  const groupNameById: Record<string, string> = groupRow
    ? { [groupRow.id]: groupRow.group_name }
    : {};

  const members = (membersRes.data ?? []) as CustomerRow[];
  return members.map((member) => enrichCustomer(member, groupNameById, today));
}

/**
 * Menambahkan akun induk Google Pro / grup Family Sharing baru.
 */
export async function createFamilyGroup(
  payload: FamilyGroupInsert,
): Promise<FamilyGroupRow> {
  const supabase = createSupabaseBrowserClient();
  const insertData = {
    group_name: payload.group_name.trim(),
    manager_email: payload.manager_email.trim(),
    group_type: payload.group_type ?? "shared",
    max_slots: payload.max_slots ?? 5,
    master_expired_at: payload.master_expired_at,
    status: payload.status ?? "active",
    notes: payload.notes ?? null,
  };

  const { data, error } = await supabase
    .from("family_groups")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FamilyGroupRow;
}

/**
 * Memperbarui data akun induk / grup Family Sharing.
 */
export async function updateFamilyGroup(
  id: string,
  payload: FamilyGroupUpdate,
): Promise<FamilyGroupRow> {
  const supabase = createSupabaseBrowserClient();
  const updateData: FamilyGroupUpdate = {
    ...payload,
    ...(payload.group_name !== undefined
      ? { group_name: payload.group_name.trim() }
      : {}),
    ...(payload.manager_email !== undefined
      ? { manager_email: payload.manager_email.trim() }
      : {}),
  };

  const { data, error } = await supabase
    .from("family_groups")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FamilyGroupRow;
}

/**
 * Menghapus akun induk / grup Family Sharing.
 */
export async function deleteFamilyGroup(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("family_groups").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
