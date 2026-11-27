import { describe, expect, it } from "vitest";
import type { CustomerRow, FamilyGroupRow } from "@/types/database";
import {
  calculateGroupSlotInfo,
  calculateTotalReadySlots,
} from "@/lib/logic/slots";

const makeGroup = (overrides: Partial<FamilyGroupRow>): FamilyGroupRow => ({
  id: "grp-1",
  group_name: "Nottura-01",
  manager_email: "manager1@gmail.com",
  group_type: "shared",
  max_slots: 5,
  master_expired_at: "2026-12-31",
  status: "active",
  notes: null,
  created_at: "2026-11-01T00:00:00Z",
  ...overrides,
});

const makeCustomer = (overrides: Partial<CustomerRow>): CustomerRow => ({
  id: "cust-1",
  full_name: "User",
  whatsapp: "6281234567890",
  gmail: "user@gmail.com",
  family_group_id: "grp-1",
  package_name: "Solo 35k",
  start_date: "2026-11-01",
  end_date: "2026-12-10",
  created_by: "raken@nottura.my.id",
  created_at: "2026-11-01T00:00:00Z",
  ...overrides,
});

describe("slots logic", () => {
  const today = "2026-11-27";

  it("counts only non-expired members for shared group slots", () => {
    const group = makeGroup({ id: "grp-1", group_type: "shared", max_slots: 5 });
    const customers = [
      makeCustomer({ id: "1", family_group_id: "grp-1", end_date: "2026-12-10" }),
      makeCustomer({ id: "2", family_group_id: "grp-1", end_date: "2026-11-29" }),
      makeCustomer({ id: "3", family_group_id: "grp-1", end_date: "2026-11-20" }), // expired
    ];

    const info = calculateGroupSlotInfo(group, customers, today);
    expect(info.active_members_count).toBe(2);
    expect(info.total_members_count).toBe(3);
    expect(info.ready_slots).toBe(3);
    expect(info.is_full).toBe(false);
    expect(info.effective_status).toBe("active");
  });

  it("forces Full Group to 0 ready slots even with only 1 coordinator", () => {
    const fullGroup = makeGroup({
      id: "grp-full",
      group_name: "Nottura-Full",
      group_type: "full",
      max_slots: 5,
    });
    const customers = [
      makeCustomer({
        id: "1",
        family_group_id: "grp-full",
        package_name: "Full Group 150k",
        end_date: "2026-12-15",
      }),
    ];

    const info = calculateGroupSlotInfo(fullGroup, customers, today);
    expect(info.active_members_count).toBe(1);
    expect(info.ready_slots).toBe(0);
    expect(info.is_full).toBe(true);
    expect(info.effective_status).toBe("full");
  });

  it("forces suspended group to 0 ready slots", () => {
    const suspendedGroup = makeGroup({
      id: "grp-sus",
      group_type: "shared",
      status: "suspended",
    });

    const info = calculateGroupSlotInfo(suspendedGroup, [], today);
    expect(info.ready_slots).toBe(0);
    expect(info.is_full).toBe(true);
    expect(info.effective_status).toBe("suspended");
  });

  it("sums ready slots only across active shared groups", () => {
    const groups = [
      makeGroup({ id: "g1", group_type: "shared", max_slots: 5, status: "active" }),
      makeGroup({ id: "g2", group_type: "shared", max_slots: 5, status: "active" }),
      makeGroup({ id: "g3", group_type: "full", max_slots: 5, status: "active" }),
      makeGroup({ id: "g4", group_type: "shared", max_slots: 5, status: "suspended" }),
    ];
    const customers = [
      makeCustomer({ id: "c1", family_group_id: "g1", end_date: "2026-12-10" }),
      makeCustomer({ id: "c2", family_group_id: "g1", end_date: "2026-12-10" }),
      makeCustomer({ id: "c3", family_group_id: "g2", end_date: "2026-12-10" }),
      makeCustomer({ id: "c4", family_group_id: "g3", end_date: "2026-12-10" }),
    ];

    // g1 ready = 3, g2 ready = 4, g3 = 0 (full), g4 = 0 (suspended) => total 7
    expect(calculateTotalReadySlots(groups, customers, today)).toBe(7);
  });
});
