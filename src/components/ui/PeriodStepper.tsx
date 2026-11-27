"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_OPTIONS } from "@/components/formatters";

interface PeriodStepperProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function PeriodStepper({
  month,
  year,
  onMonthChange,
  onYearChange,
}: PeriodStepperProps) {
  function handlePrevMonth() {
    if (month <= 1) {
      onMonthChange(12);
      onYearChange(Math.max(2024, year - 1));
    } else {
      onMonthChange(month - 1);
    }
  }

  function handleNextMonth() {
    if (month >= 12) {
      onMonthChange(1);
      onYearChange(Math.min(2100, year + 1));
    } else {
      onMonthChange(month + 1);
    }
  }

  return (
    <div className="inline-flex items-center rounded-xl surface-inset p-1 gap-1">
      <button
        type="button"
        onClick={handlePrevMonth}
        aria-label="Bulan sebelumnya"
        className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#17171D] transition cursor-pointer"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <select
        aria-label="Bulan"
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value) || 1)}
        className="bg-transparent px-2 py-1 text-xs sm:text-sm font-medium text-[#FAFAFA] focus:outline-none cursor-pointer [&>option]:bg-[#101014]"
      >
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <input
        aria-label="Tahun"
        type="number"
        min={2024}
        max={2100}
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value) || year)}
        className="w-16 bg-transparent px-1.5 py-1 text-xs sm:text-sm font-mono tabular-nums text-[#A1A1AA] focus:text-[#FAFAFA] focus:outline-none text-center"
      />

      <button
        type="button"
        onClick={handleNextMonth}
        aria-label="Bulan berikutnya"
        className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#17171D] transition cursor-pointer"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
