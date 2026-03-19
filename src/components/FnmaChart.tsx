"use client";

import { useEffect, useRef } from "react";

export default function FnmaChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: "OTC:FNMA",
      interval: "W",
      range: "60M",
      timezone: "America/New_York",
      theme: "dark",
      style: "3",
      locale: "en",
      backgroundColor: "rgba(0,0,0,0)",
      gridColor: "rgba(255,255,255,0.03)",
      hide_top_toolbar: true,
      hide_legend: false,
      hide_volume: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* Terminal header */}
      <div
        style={{
          background: "#0a0f07",
          border: "1px solid var(--border)",
          borderBottom: "none",
          borderRadius: "8px 8px 0 0",
          padding: "0.6rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            className="mono"
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--terminal-green)",
              background: "rgba(124,185,136,0.1)",
              border: "1px solid rgba(124,185,136,0.3)",
              borderRadius: "4px",
              padding: "0.15rem 0.5rem",
              letterSpacing: "0.08em",
            }}
          >
            FNMA
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Federal National Mortgage Association
          </span>
          <span
            className="mono"
            style={{
              fontSize: "0.65rem",
              color: "var(--text-dim)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "0.1rem 0.4rem",
            }}
          >
            OTC · 5Y
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-dim)", textAlign: "right" }}>
            <span style={{ color: "var(--green)", marginRight: "0.3rem" }}>▌</span>
            my tenure: Jun 2023 – Aug 2025
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
          height: "280px",
          background: "rgba(0,0,0,0)",
        }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: "100%", width: "100%" }}
        />
      </div>

      {/* Footer note */}
      <div
        className="mono"
        style={{
          fontSize: "0.62rem",
          color: "var(--text-dim)",
          marginTop: "0.4rem",
          textAlign: "right",
          opacity: 0.6,
        }}
      >
        via TradingView · weekly candles · area chart
      </div>
    </div>
  );
}
