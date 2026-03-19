"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number, triggered: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [triggered, target, duration]);

  return value;
}

interface Stat {
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
}

function StatCard({ stat, color, triggered }: { stat: Stat; color: string; triggered: boolean }) {
  const count = useCountUp(stat.value, 1400, triggered);
  return (
    <div
      style={{
        flex: "1 1 120px",
        background: color + "0a",
        border: `1px solid ${color}25`,
        borderRadius: "8px",
        padding: "0.9rem 1rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color, fontFamily: "var(--font-mono)", lineHeight: 1.1 }}>
        {stat.prefix || ""}{count}{stat.suffix}
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.3rem", lineHeight: 1.3 }}>
        {stat.label}
      </div>
    </div>
  );
}

export default function StatCounters({ stats, color }: { stats: Stat[]; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.25rem" }}>
      {stats.map((stat, i) => (
        <StatCard key={i} stat={stat} color={color} triggered={triggered} />
      ))}
    </div>
  );
}
