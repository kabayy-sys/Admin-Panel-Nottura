import { describe, expect, it } from "vitest";
import {
  buildRemindWhatsAppUrl,
  formatIndonesianDate,
  isValidWhatsApp,
  normalizeWhatsApp,
} from "@/lib/logic/whatsapp";

describe("whatsapp logic", () => {
  it("normalizes 08... and formatted Indonesian numbers into 628...", () => {
    expect(normalizeWhatsApp("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsApp("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsApp("628123456789")).toBe("628123456789");
    expect(normalizeWhatsApp("8123456789")).toBe("628123456789");
    expect(normalizeWhatsApp("")).toBe("");
  });

  it("validates normalized WhatsApp format matching DB constraint", () => {
    expect(isValidWhatsApp("6281234567890")).toBe(true);
    expect(isValidWhatsApp("081234567890")).toBe(false);
    expect(isValidWhatsApp("62812")).toBe(false);
  });

  it("formats Indonesian date strings safely", () => {
    expect(formatIndonesianDate("2026-11-27")).toBe("27 November 2026");
  });

  it("builds a 1-click wa.me reminder URL with customer name and expiry date", () => {
    const url = buildRemindWhatsAppUrl({
      fullName: "Budi Santoso",
      whatsapp: "081234567890",
      endDate: "2026-11-30",
      packageName: "Solo 35k",
    });

    expect(url.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded).toContain("Budi Santoso");
    expect(decoded).toContain("30 November 2026");
    expect(decoded).toContain("Solo 35k");
  });
});
