"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A value that glows once when it changes (`.tick` in globals.css), so the
 * eye finds what a tap just moved: the cash after a purchase, the forecast
 * after a block is assigned, the count on a stepper.
 *
 * Only on a change, never on arrival: a screen that lights up every number
 * the moment it opens says nothing about what moved. The glow is re-keyed on
 * the value, so two quick changes each get their own.
 */
export function Tick({
  value,
  children,
  className = "",
}: {
  /** What to watch. The glow plays when this differs from the last render. */
  value: string | number;
  children?: ReactNode;
  className?: string;
}) {
  const prev = useRef(value);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setN((x) => x + 1);
    }
  }, [value]);

  return (
    <span key={n} className={`${n > 0 ? "tick" : ""} ${className}`.trim()}>
      {children ?? value}
    </span>
  );
}
