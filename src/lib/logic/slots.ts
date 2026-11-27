import type {
  CustomerRow,
  FamilyGroupRow,
  FamilyGroupWithSlots,
  GroupStatus,
} from "@/types/database";
import { getCustomerStatus, getTodayDateString } from "@/lib/logic/customer";

/**
 * Menghitung informasi slot untuk satu grup Family Sharing.
 * Aturan PRD:
 * - Hanya pelanggan non-expired di grup tersebut yang dihitung menempati slot.
 * - Jika `group_type === 'full'` ATAU `status === 'suspended'`, `ready_slots` otomatis 0 dan `is_full = true`
 *   meskipun baru terisi 1 koordinator.
 */
export function calculateGroupSlotInfo(
  group: FamilyGroupRow,
  customers: CustomerRow[],
  today: string = getTodayDateString(),
): FamilyGroupWithSlots {
  const membersInGroup = customers.filter(
    (customer) => customer.family_group_id === group.id,
  );
  const activeMembersCount = membersInGroup.filter(
    (customer) => getCustomerStatus(customer.end_date, today) !== "expired",
  ).length;

  const isForcedZero =
    group.group_type === "full" || group.status === "suspended";

  const readySlots = isForcedZero
    ? 0
    : Math.max(0, group.max_slots - activeMembersCount);

  const isFull = isForcedZero ? true : readySlots === 0;

  let effectiveStatus: GroupStatus = "active";
  if (group.status === "suspended") {
    effectiveStatus = "suspended";
  } else if (isFull || group.status === "full") {
    effectiveStatus = "full";
  }

  return {
    ...group,
    active_members_count: activeMembersCount,
    total_members_count: membersInGroup.length,
    ready_slots: readySlots,
    is_full: isFull,
    effective_status: effectiveStatus,
  };
}

/**
 * Menghitung akumulasi slot kosong (Total Slot Ready) dari semua grup bertipe `shared` yang aktif.
 */
export function calculateTotalReadySlots(
  groups: FamilyGroupRow[],
  customers: CustomerRow[],
  today: string = getTodayDateString(),
): number {
  return groups
    .filter(
      (group) => group.group_type === "shared" && group.status !== "suspended",
    )
    .reduce((sum, group) => {
      const info = calculateGroupSlotInfo(group, customers, today);
      return sum + info.ready_slots;
    }, 0);
}
