"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  durationMs?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  formatter = (val) => String(Math.round(val)),
  durationMs = 380,
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const previousRef = useRef<number>(value);

  useEffect(() => {
    const startVal = previousRef.current;
    const endVal = value;
    if (startVal === endVal) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        previousRef.current = endVal;
      }
    }

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      previousRef.current = endVal;
    };
  }, [value, durationMs]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatter(displayValue)}
    </span>
  );
}
