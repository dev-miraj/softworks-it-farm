import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatCounterProps {
  value: string;
  label: string;
  className?: string;
  labelClassName?: string;
}

export function StatCounter({ value, label, className = "", labelClassName = "" }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  const match = value.match(/^(\d+)(\D*)$/);
  const numericPart = match ? parseInt(match[1]) : 0;
  const suffix = match ? match[2] : value;

  const count = useCountUp(numericPart, 1800, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display = numericPart > 0 ? `${count}${suffix}` : value;

  return (
    <div ref={ref} className="text-center">
      <div className={`font-black gradient-text tabular-nums ${className}`}>{display}</div>
      <div className={`text-muted-foreground mt-1 ${labelClassName}`}>{label}</div>
    </div>
  );
}
