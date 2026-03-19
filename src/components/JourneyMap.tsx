"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator } from "d3-geo";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  Graticule,
  Sphere,
} from "react-simple-maps";
import { journeyStops } from "@/lib/data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const NYC_COORDS: [number, number] = [-74.006, 40.7128];

// Each stop gets its own focused map view
const STOP_VIEWS: Record<string, { center: [number, number]; scale: number }> = {
  california: { center: [-119, 38],  scale: 800  },
  india:      { center: [-10, 35],   scale: 190  },
  michigan:   { center: [-90, 45],   scale: 520  },
  denmark:    { center: [-18, 53],   scale: 320  },
  dc:         { center: [-77, 39],   scale: 680  },
  nyc:        { center: [-74, 41],   scale: 900  },
};

const WEATHER_QUERIES: Record<string, string> = {
  california: "Los Angeles",
  india:      "Gurgaon",
  michigan:   "Ann Arbor",
  denmark:    "Copenhagen",
  dc:         "Washington DC",
  nyc:        "New York City",
};

function haversine(a: [number, number], b: [number, number]): number {
  const R = 3959;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b[1] - a[1]);
  const dLon = r(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

interface WeatherData { temp: string; desc: string; icon: string }

function weatherIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("sunny") || d.includes("clear")) return "☀️";
  if (d.includes("partly")) return "⛅";
  if (d.includes("overcast") || d.includes("cloudy")) return "☁️";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("snow") || d.includes("blizzard")) return "❄️";
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "🌫️";
  return "🌡️";
}

export default function JourneyMap() {
  const [activeId, setActiveId]         = useState("california");
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [revealedIdx, setRevealedIdx]   = useState(0);
  const [projCfg, setProjCfg]           = useState(STOP_VIEWS.california);
  const [mapKey, setMapKey]             = useState(0);
  const [mapOpacity, setMapOpacity]     = useState(1);
  const [loaded, setLoaded]             = useState(false);
  const [weather, setWeather]           = useState<Record<string, WeatherData>>({});
  const [mapCoords, setMapCoords]       = useState<{ lon: number; lat: number } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => { setLoaded(true); }, []);

  useEffect(() => {
    journeyStops.forEach((stop) => {
      const q = WEATHER_QUERIES[stop.id];
      if (!q) return;
      fetch(`/api/weather?city=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => {
          const inner = data.data ?? data;
          const c = inner.current_condition?.[0];
          if (!c) return;
          const desc = c.weatherDesc?.[0]?.value ?? c.WeatherDesc?.[0]?.value ?? "";
          const temp = c.temp_F ?? c.FeelsLikeF ?? "?";
          setWeather(prev => ({
            ...prev,
            [stop.id]: { temp: `${temp}°F`, desc, icon: weatherIcon(desc) },
          }));
        })
        .catch(err => console.error(`[weather:${stop.id}]`, err));
    });
  }, []);

  const handleMapMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 800;
    const svgY = ((e.clientY - rect.top) / rect.height) * 420;
    try {
      const proj = geoMercator().scale(projCfg.scale).center(projCfg.center).translate([400, 210]);
      const coords = proj.invert?.([svgX, svgY]);
      if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
        setMapCoords({ lon: coords[0], lat: coords[1] });
      }
    } catch (_) {}
  }, [projCfg]);

  const fmtCoord = (n: number, dir: "NS" | "EW") => {
    const abs = Math.abs(n).toFixed(2);
    const label = dir === "NS" ? (n >= 0 ? "N" : "S") : (n >= 0 ? "E" : "W");
    return `${abs}° ${label}`;
  };

  const selectStop = (stopId: string) => {
    if (stopId === activeId) return;
    const idx = journeyStops.findIndex(s => s.id === stopId);
    setMapOpacity(0);
    setTimeout(() => {
      setActiveId(stopId);
      setRevealedIdx(prev => Math.max(prev, idx));
      setProjCfg(STOP_VIEWS[stopId]);
      setMapKey(k => k + 1);
      setMapOpacity(1);
    }, 220);
  };

  const displayId     = hoveredId ?? activeId;
  const displayStop   = journeyStops.find(s => s.id === displayId)!;
  const activeStop    = journeyStops.find(s => s.id === activeId)!;
  const activeIdx     = journeyStops.findIndex(s => s.id === activeId);
  const prevStop      = activeIdx > 0 ? journeyStops[activeIdx - 1] : null;
  const nextStop      = activeIdx < journeyStops.length - 1 ? journeyStops[activeIdx + 1] : null;
  const w             = weather[displayId];
  const dist          = displayId !== "nyc"
    ? haversine(displayStop.coordinates, NYC_COORDS).toLocaleString()
    : null;

  const revealedLines = journeyStops.slice(0, revealedIdx).map((stop, i) => ({
    from: stop.coordinates,
    to:   journeyStops[i + 1].coordinates,
    color: stop.color,
  }));

  return (
    <section id="journey" style={{ padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>// data.journey</p>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
          How I got here
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "3rem", maxWidth: "500px" }}>
          Six stops. One continuous thread of curiosity.
        </p>
      </motion.div>

      <div style={{ display: "grid", gap: "1.25rem" }}>

        {/* ── MAP ─────────────────────────────────────────── */}
        <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Header bar */}
          <div style={{
            background: "#0d1b2a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "0.8rem 1.4rem",
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
          }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57", display: "inline-block", boxShadow: "0 0 6px #ff5f5760" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e", display: "inline-block", boxShadow: "0 0 6px #febc2e60" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840", display: "inline-block", boxShadow: "0 0 6px #28c84060" }} />
            <span className="mono" style={{ marginLeft: "0.6rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.03em" }}>
              journey.map — click a stop to navigate
            </span>
          </div>

          {/* Map canvas */}
          <div
            style={{ background: "#0c1e30", position: "relative" }}
            onMouseMove={handleMapMouseMove}
            onMouseLeave={() => { setMapCoords(null); setHoveredCountry(null); }}
          >
            {/* Left arrow */}
            <button
              onClick={() => prevStop && selectStop(prevStop.id)}
              disabled={!prevStop}
              style={{
                position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
                zIndex: 10, width: 36, height: 36, borderRadius: "50%",
                background: prevStop ? `${prevStop.color}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${prevStop ? prevStop.color + "50" : "rgba(255,255,255,0.1)"}`,
                color: prevStop ? prevStop.color : "rgba(255,255,255,0.2)",
                cursor: prevStop ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", transition: "all 0.2s",
              }}
            >‹</button>

            {/* Right arrow */}
            <button
              onClick={() => nextStop && selectStop(nextStop.id)}
              disabled={!nextStop}
              style={{
                position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                zIndex: 10, width: 36, height: 36, borderRadius: "50%",
                background: nextStop ? `${nextStop.color}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${nextStop ? nextStop.color + "50" : "rgba(255,255,255,0.1)"}`,
                color: nextStop ? nextStop.color : "rgba(255,255,255,0.2)",
                cursor: nextStop ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", transition: "all 0.2s",
              }}
            >›</button>

            {/* Stop weather + distance overlay (top-right, on marker hover) */}
            <AnimatePresence>
              {hoveredId && (() => {
                const hs = journeyStops.find(s => s.id === hoveredId)!;
                const hw = weather[hoveredId];
                const hdist = hoveredId !== "nyc" ? haversine(hs.coordinates, NYC_COORDS).toLocaleString() : null;
                return (
                  <motion.div
                    key={hoveredId}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: "absolute", top: "0.75rem", right: "0.75rem",
                      zIndex: 10, pointerEvents: "none",
                      background: "rgba(10,15,7,0.88)",
                      border: `1px solid ${hs.color}50`,
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      backdropFilter: "blur(8px)",
                      minWidth: "150px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>{hs.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: hs.color }}>
                        {hs.name.split(",")[0]}
                      </span>
                    </div>
                    {hw ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>{hw.icon}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{hw.temp}</span>
                        <span className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{hw.desc}</span>
                      </div>
                    ) : (
                      <div className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.35rem" }}>fetching…</div>
                    )}
                    {hdist && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.75rem" }}>✈</span>
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>{hdist} mi</span>
                        <span className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)" }}>from NYC</span>
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Coordinate + country overlay */}
            <AnimatePresence>
              {mapCoords && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", bottom: "1rem", left: "1.25rem",
                    zIndex: 10, pointerEvents: "none",
                    background: "rgba(8,14,6,0.92)",
                    border: `1px solid ${activeStop.color}45`,
                    borderRadius: "12px",
                    padding: "1rem 1.5rem",
                    backdropFilter: "blur(10px)",
                    boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 0 1px ${activeStop.color}15`,
                  }}
                >
                  {hoveredCountry && (
                    <div className="mono" style={{ fontSize: "0.9rem", color: activeStop.color, fontWeight: 700, marginBottom: "0.4rem", letterSpacing: "0.03em" }}>
                      {hoveredCountry}
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.8 }}>
                    <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", marginRight: "0.3rem" }}>lat</span>
                    <span style={{ fontWeight: 700 }}>{fmtCoord(mapCoords.lat, "NS")}</span>
                    <span style={{ color: "rgba(255,255,255,0.18)", margin: "0 0.6rem" }}>·</span>
                    <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", marginRight: "0.3rem" }}>lon</span>
                    <span style={{ fontWeight: 700 }}>{fmtCoord(mapCoords.lon, "EW")}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ opacity: mapOpacity, transition: "opacity 0.22s ease" }}>
              {loaded && (
                <ComposableMap
                  key={mapKey}
                  projection="geoMercator"
                  width={800}
                  height={420}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  projectionConfig={projCfg}
                >
                  <defs>
                    <radialGradient id="ocean-grad" cx="50%" cy="40%" r="70%">
                      <stop offset="0%" stopColor="#1e4060" />
                      <stop offset="60%" stopColor="#152d45" />
                      <stop offset="100%" stopColor="#0c1e30" />
                    </radialGradient>
                    <pattern id="ocean-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="0.6" fill="rgba(100,180,255,0.07)" />
                    </pattern>
                  </defs>
                  <Sphere id="ocean-base" fill="url(#ocean-grad)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                  <Sphere id="ocean-tex" fill="url(#ocean-dots)" stroke="none" strokeWidth={0} />
                  <Graticule stroke="rgba(100,180,255,0.07)" strokeWidth={0.5} />

                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const isHov = hoveredCountry === geo.properties.name;
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            style={{
                              default: { fill: isHov ? "#3a6040" : "#2c4a2e", stroke: "#1e3620", strokeWidth: 0.4, outline: "none" },
                              hover:   { fill: "#3a6040", stroke: "#1e3620", strokeWidth: 0.4, outline: "none" },
                              pressed: { fill: "#2c4a2e", outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {/* Revealed path lines */}
                  {revealedLines.map((line, i) => (
                    <Line
                      key={i}
                      from={line.from}
                      to={line.to}
                      stroke={line.color}
                      strokeWidth={1.4}
                      strokeOpacity={0.5}
                      strokeDasharray="5 4"
                    />
                  ))}

                  {/* All stop markers */}
                  {journeyStops.map((stop, i) => {
                    const isRevealed = i <= revealedIdx;
                    const isActive   = stop.id === activeId;
                    const isHovered  = stop.id === hoveredId;
                    const isFocused  = isActive || isHovered;
                    const labelDx    = stop.labelDx ?? 0;
                    const labelDy    = stop.labelDy ?? -16;
                    const labelAnchor = stop.labelAnchor ?? "middle";
                    return (
                      <Marker
                        key={stop.id}
                        coordinates={stop.coordinates}
                        onClick={() => selectStop(stop.id)}
                        onMouseEnter={() => setHoveredId(stop.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Glow ring */}
                        <circle
                          r={isFocused ? 19 : 13}
                          fill={`${stop.color}${isRevealed ? "14" : "06"}`}
                          stroke={`${stop.color}${isFocused ? "55" : isRevealed ? "28" : "14"}`}
                          strokeWidth={1}
                          style={{ cursor: "pointer", transition: "r 0.2s" }}
                        />
                        {/* Pulse for NYC */}
                        {stop.id === "nyc" && isRevealed && (
                          <motion.circle
                            r={10} fill="none" stroke={stop.color} strokeWidth={1}
                            animate={{ r: [10, 22], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          />
                        )}
                        {/* Emoji */}
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            fontSize: isFocused ? "16px" : "12px",
                            cursor: "pointer",
                            userSelect: "none",
                            opacity: isRevealed ? 1 : 0.35,
                            filter: isFocused ? `drop-shadow(0 0 6px ${stop.color})` : "none",
                            transition: "font-size 0.15s, opacity 0.3s, filter 0.15s",
                          }}
                        >
                          {stop.emoji}
                        </text>
                        {/* Label */}
                        <text
                          textAnchor={labelAnchor}
                          x={labelDx} y={labelDy}
                          style={{
                            fontSize: "7px",
                            fill: isFocused ? stop.color : isRevealed ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                            fontFamily: "var(--font-mono)",
                            pointerEvents: "none",
                            fontWeight: isFocused ? "700" : "400",
                            transition: "fill 0.2s",
                          }}
                        >
                          {stop.name.split(",")[0]}
                        </text>
                      </Marker>
                    );
                  })}
                </ComposableMap>
              )}
            </div>
          </div>
        </div>

        {/* ── PROMINENT INFO CARD ─────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              background: `${displayStop.color}0e`,
              border: `1px solid ${displayStop.color}40`,
              borderRadius: "12px",
              padding: "1.5rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* Left: identity + description */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>{displayStop.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text)" }}>{displayStop.name}</div>
                  <div className="mono" style={{ fontSize: "0.72rem", color: displayStop.color, marginTop: "0.1rem" }}>
                    {displayStop.period}  ·  stop {journeyStops.indexOf(displayStop) + 1} of {journeyStops.length}
                  </div>
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.75, margin: 0 }}>
                {displayStop.detail}
              </p>
            </div>

            {/* Right: weather + distance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end", flexShrink: 0 }}>
              {w ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "2.2rem", lineHeight: 1 }}>{w.icon}</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)", marginTop: "0.3rem" }}>{w.temp}</div>
                  <div className="mono" style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{w.desc}</div>
                </div>
              ) : (
                <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-dim)", opacity: 0.5 }}>fetching weather…</div>
              )}
              {dist && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: displayStop.color }}>{dist}</div>
                  <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>miles from NYC</div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── STOP SELECTORS ──────────────────────────────── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {journeyStops.map((stop, i) => {
            const isActive   = stop.id === activeId;
            const isRevealed = i <= revealedIdx;
            return (
              <motion.button
                key={stop.id}
                onClick={() => selectStop(stop.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: isActive ? `${stop.color}20` : "var(--bg-card)",
                  border: `1px solid ${isActive ? stop.color + "80" : isRevealed ? stop.color + "35" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "0.55rem 1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s",
                  opacity: isRevealed ? 1 : 0.45,
                }}
              >
                <span style={{ fontSize: "1rem" }}>{stop.emoji}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: isActive ? 600 : 400, color: isActive ? stop.color : "var(--text-muted)" }}>
                  {stop.name.split(",")[0]}
                </span>
                {!isRevealed && (
                  <span className="mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>›</span>
                )}
              </motion.button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
