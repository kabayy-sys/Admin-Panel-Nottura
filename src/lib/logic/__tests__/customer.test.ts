import { describe, expect, it } from "vitest";
import type { CustomerRow } from "@/types/database";
import {
  addDaysToDateString,
  calculateDefaultEndDate,
  calculateRenewedEndDate,
  checkDuplicateGmail,
  enrichCustomer,
  filterCustomers,
  getCustomerStatus,
  getDaysRemaining,
  getDefaultPackagePrice,
  getTodayDateString,
  getUpcomingExpirations,
} from "@/lib/logic/customer";

const makeCustomer = (overrides: Partial<CustomerRow>): CustomerRow => ({
  id: "cust-1",
  full_name: "Andi Pratama",
  whatsapp: "6281234567890",
  gmail: "andi@gmail.com",
  family_group_id: "grp-1",
  package_name: "Solo 35k",
  start_date: "2026-11-01",
  end_date: "2026-12-01",
  created_by: "raken@nottura.my.id",
  created_at: "2026-11-01T00:00:00Z",
  ...overrides,
});

describe("customer logic", () => {
  it("resolves default package prices", () => {
    expect(getDefaultPackagePrice("Solo 35k")).toBe(35000);
    expect(getDefaultPackagePrice("Full Group 150k")).toBe(150000);
    expect(getDefaultPackagePrice("Squad 30k")).toBe(30000);
    expect(getDefaultPackagePrice("Custom")).toBe(0);
  });

  it("handles UTC date arithmetic without timezone drift", () => {
    expect(addDaysToDateString("2024-02-01", 30)).toBe("2024-03-02");
    expect(calculateDefaultEndDate("2026-11-27")).toBe("2026-12-27");
    expect(calculateRenewedEndDate("2026-12-01", 30)).toBe("2026-12-31");
    expect(getTodayDateString(new Date("2026-11-27T12:00:00Z"))).toBe(
      "2026-11-27",
    );
  });

  it("computes remaining days and automatic status (Aktif, H-3 Expired, Expired)", () => {
    const today = "2026-11-27";

    expect(getDaysRemaining("2026-11-26", today)).toBe(-1);
    expect(getCustomerStatus("2026-11-26", today)).toBe("expired");

    expect(getDaysRemaining("2026-11-27", today)).toBe(0);
    expect(getCustomerStatus("2026-11-27", today)).toBe("expiring_soon");

    expect(getDaysRemaining("2026-11-30", today)).toBe(3);
    expect(getCustomerStatus("2026-11-30", today)).toBe("expiring_soon");

    expect(getDaysRemaining("2026-12-01", today)).toBe(4);
    expect(getCustomerStatus("2026-12-01", today)).toBe("active");
  });

  it("detects duplicate Gmail case-insensitively and mentions 12-month cooldown", () => {
    const existing = [
      makeCustomer({ id: "c1", gmail: "Siti.Rahma@Gmail.com" }),
      makeCustomer({ id: "c2", gmail: "budi@gmail.com" }),
    ];

    const duplicate = checkDuplicateGmail("  siti.rahma@gmail.com ", existing);
    expect(duplicate.isDuplicate).toBe(true);
    expect(duplicate.matches).toHaveLength(1);
    expect(duplicate.warningMessage).toContain("12 bulan");

    const excludedSelf = checkDuplicateGmail(
      "siti.rahma@gmail.com",
      existing,
      "c1",
    );
    expect(excludedSelf.isDuplicate).toBe(false);
  });

  it("filters enriched customers and picks top 5 non-expired upcoming expirations", () => {
    const today = "2026-11-27";
    const rows = [
      makeCustomer({ id: "1", full_name: "Expired", end_date: "2026-11-25" }),
      makeCustomer({ id: "2", full_name: "Soon 2", end_date: "2026-11-29" }),
      makeCustomer({ id: "3", full_name: "Soon 1", end_date: "2026-11-27" }),
      makeCustomer({ id: "4", full_name: "Active 4", end_date: "2026-12-10" }),
      makeCustomer({ id: "5", full_name: "Active 3", end_date: "2026-12-05" }),
      makeCustomer({ id: "6", full_name: "Active 5", end_date: "2026-12-20" }),
      makeCustomer({
        id: "7",
        full_name: "Soon 3",
        end_date: "2026-11-30",
        family_group_id: "grp-2",
      }),
    ];

    const enriched = rows.map((r) =>
      enrichCustomer(r, { "grp-1": "Nottura-01", "grp-2": "Nottura-02" }, today),
    );

    const filtered = filterCustomers(enriched, {
      search: "soon 3",
      status: "expiring_soon",
      familyGroupId: "grp-2",
    });
    expect(filtered.map((c) => c.id)).toEqual(["7"]);

    const upcoming = getUpcomingExpirations(rows, 5, today, {
      "grp-1": "Nottura-01",
      "grp-2": "Nottura-02",
    });
    expect(upcoming.map((c) => c.id)).toEqual(["3", "2", "7", "5", "4"]);
  });
});
