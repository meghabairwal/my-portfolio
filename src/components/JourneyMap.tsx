"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoOrthographic } from "d3-geo";
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

const GEO_URL    = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const STATES_URL = "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector/geojson/ne_110m_admin_1_states_provinces.geojson";
const NYC_COORDS: [number, number] = [-74.006, 40.7128];

// geoOrthographic: rotate=[lambda, phi, 0] centers the globe at lon=-lambda, lat=-phi
type ProjCfg = { rotate: [number, number, number]; scale: number };

const STOP_VIEWS: Record<string, ProjCfg> = {
  california: { rotate: [119,  -37, 0], scale: 600 },
  india:      { rotate: [-77,  -28, 0], scale: 350 },
  michigan:   { rotate: [83,   -42, 0], scale: 550 },
  denmark:    { rotate: [-12,  -56, 0], scale: 450 },
  dc:         { rotate: [77,   -39, 0], scale: 600 },
  nyc:        { rotate: [74,   -41, 0], scale: 750 },
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

const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Wraps destination longitude so the plane travels via the shorter path
const wrapLon = (from: number, to: number) => {
  const diff = to - from;
  if (diff > 180)  return to - 360;
  if (diff < -180) return to + 360;
  return to;
};

// Normalizes a longitude to [-180, 180] for use in Marker coordinates
const normalizeLon = (lon: number) => {
  let l = lon;
  while (l < -180) l += 360;
  while (l >  180) l -= 360;
  return l;
};

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
  const [projCfg, setProjCfg]           = useState<ProjCfg>(STOP_VIEWS.california);
  const [loaded, setLoaded]             = useState(false);
  const [weather, setWeather]           = useState<Record<string, WeatherData>>({});
  const [mapCoords, setMapCoords]       = useState<{ lon: number; lat: number } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  interface FlightAnim { fromId: string; toId: string; flightTime: string; rawProgress: number }
  const [flightAnim, setFlightAnim]     = useState<FlightAnim | null>(null);
  const rafRef                          = useRef<number | null>(null);

  useEffect(() => { setLoaded(true); }, []);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

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
    const svgRenderedH = rect.width * (440 / 800);
    const clipOffset = Math.max(0, (svgRenderedH - rect.height) / 2);
    const svgX = ((e.clientX - rect.left) / rect.width) * 800;
    const svgY = (((e.clientY - rect.top) + clipOffset) / svgRenderedH) * 440;
    try {
      const proj = geoOrthographic()
        .rotate(projCfg.rotate)
        .scale(projCfg.scale)
        .translate([400, 220]);
      const coords = proj.invert?.([svgX, svgY]);
      if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
        setMapCoords({ lon: coords[0], lat: coords[1] });
      } else {
        setMapCoords(null);
      }
    } catch (_) { setMapCoords(null); }
  }, [projCfg]);

  const fmtCoord = (n: number, dir: "NS" | "EW") => {
    const abs = Math.abs(n).toFixed(2);
    const label = dir === "NS" ? (n >= 0 ? "N" : "S") : (n >= 0 ? "E" : "W");
    return `${abs}° ${label}`;
  };

  const selectStop = (stopId: string) => {
    if (stopId === activeId) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const fromStop = journeyStops.find(s => s.id === activeId)!;
    const toStop   = journeyStops.find(s => s.id === stopId)!;
    const fromCfg  = { ...projCfg };
    const toCfg    = STOP_VIEWS[stopId];
    const toIdx    = journeyStops.findIndex(s => s.id === stopId);

    const pair = [fromStop.id, stopId].sort().join("-");
    const distMiles = haversine(fromStop.coordinates, toStop.coordinates);
    const totalMins = Math.round(distMiles / 550 * 60);
    const hrs  = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const flightTime = pair === "dc-nyc" ? "4h train"
      : hrs > 0 ? `${hrs}h ${mins}m flight` : `${totalMins}m flight`;

    // Detect Pacific route (wrapLon returns a value offset by ±360 from destination)
    const adjToCoordLon = wrapLon(fromStop.coordinates[0], toStop.coordinates[0]);
    const viaPacific    = adjToCoordLon !== toStop.coordinates[0];

    // For orthographic, we animate the rotation lambda (globe spin)
    // Increasing lambda spins the globe westward; decreasing spins eastward
    const fromLambda = fromCfg.rotate[0];
    const toLambda   = toCfg.rotate[0];

    type KF = { rotate: [number, number, number]; scale: number; t: number };
    let kfs: KF[];

    if (viaPacific) {
      const goingWest = adjToCoordLon < fromStop.coordinates[0]; // true for CA→India
      let targetLambda: number;
      if (goingWest) {
        // Spin globe westward: lambda increases past current toLambda
        targetLambda = toLambda < fromLambda ? toLambda + 360 : toLambda;
      } else {
        // Spin globe eastward: lambda decreases below current toLambda
        targetLambda = toLambda > fromLambda ? toLambda - 360 : toLambda;
      }
      const midLambda = (fromLambda + targetLambda) / 2;
      const midPhi    = (fromCfg.rotate[1] + toCfg.rotate[1]) / 2;
      kfs = [
        { rotate: [fromLambda,   fromCfg.rotate[1], 0] as [number, number, number], scale: fromCfg.scale, t: 0    },
        { rotate: [midLambda,    midPhi,            0] as [number, number, number], scale: 225,           t: 0.42 },
        { rotate: [targetLambda, toCfg.rotate[1],   0] as [number, number, number], scale: toCfg.scale,  t: 1    },
      ];
    } else {
      kfs = [
        { rotate: fromCfg.rotate, scale: fromCfg.scale, t: 0 },
        { rotate: toCfg.rotate,   scale: toCfg.scale,   t: 1 },
      ];
    }

    setActiveId(stopId);
    setRevealedIdx(prev => Math.max(prev, toIdx));

    const DURATION = viaPacific ? 3500 : 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const raw = Math.min((now - start) / DURATION, 1);
      let rot = kfs[0].rotate;
      let sc  = kfs[0].scale;
      for (let i = 0; i < kfs.length - 1; i++) {
        const k0 = kfs[i], k1 = kfs[i + 1];
        if (raw <= k1.t) {
          const e = easeInOut((raw - k0.t) / (k1.t - k0.t));
          rot = [
            k0.rotate[0] + (k1.rotate[0] - k0.rotate[0]) * e,
            k0.rotate[1] + (k1.rotate[1] - k0.rotate[1]) * e,
            0,
          ] as [number, number, number];
          sc = k0.scale + (k1.scale - k0.scale) * e;
          break;
        }
      }
      // On completion, snap to canonical STOP_VIEW so subsequent animations
      // start from a normalized lambda (prevents going the long way around)
      setProjCfg(raw < 1 ? { rotate: rot, scale: sc } : STOP_VIEWS[stopId]);
      setFlightAnim({ fromId: fromStop.id, toId: stopId, flightTime, rawProgress: raw });
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFlightAnim(null);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
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
    <section id="journey" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "2.5rem 2rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ flexShrink: 0, marginBottom: "1rem" }}
        >
          <p className="section-label" style={{ marginBottom: "0.4rem" }}>// data.journey</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, color: "var(--text)" }}>
            How I got here
          </h2>
        </motion.div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: 0 }}>

          {/* ── MAP ─────────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Header bar */}
          <div style={{
            background: "#0d1b2a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "0.8rem 1.4rem",
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
          }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57", display: "inline-block", boxShadow: "0 0 6px #ff5f5760", flexShrink: 0 }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e", display: "inline-block", boxShadow: "0 0 6px #febc2e60", flexShrink: 0 }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840", display: "inline-block", boxShadow: "0 0 6px #28c84060", flexShrink: 0 }} />
            <span className="mono" style={{ marginLeft: "0.6rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.03em", flexShrink: 0 }}>
              journey.map
            </span>
          </div>

          {/* Stop tabs */}
          <div style={{
            background: "#0a1520",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0.5rem 1rem",
            display: "flex",
            gap: "0.35rem",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            {journeyStops.map((stop, i) => {
              const isActive   = stop.id === activeId;
              const isRevealed = i <= revealedIdx;
              return (
                <button
                  key={stop.id}
                  onClick={() => selectStop(stop.id)}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "6px",
                    border: `1px solid ${isActive ? stop.color + "70" : isRevealed ? stop.color + "28" : "rgba(255,255,255,0.07)"}`,
                    background: isActive ? `${stop.color}18` : "transparent",
                    cursor: "pointer",
                    opacity: isRevealed ? 1 : 0.4,
                    transition: "all 0.18s",
                  }}
                >
                  {stop.id === "michigan"
                    ? <img src="/Michigan_Wolverines_Block_M.png" style={{ width: 16, height: 12, objectFit: "contain" }} alt="M" />
                    : <span style={{ fontSize: "0.85rem" }}>{stop.emoji}</span>
                  }
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? stop.color : "rgba(255,255,255,0.45)",
                    transition: "color 0.18s",
                  }}>
                    {stop.name.split(",")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map canvas */}
          <div
            style={{ background: "#0a2035", position: "relative", flex: 1, overflow: "hidden", minHeight: 0 }}
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

            {/* Stop weather + distance overlay */}
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
                      {hs.id === "michigan"
                        ? <img src="/Michigan_Wolverines_Block_M.png" style={{ width: 22, height: 17, objectFit: "contain" }} alt="M" />
                        : <span style={{ fontSize: "1.2rem" }}>{hs.emoji}</span>
                      }
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

            {/* Flight time badge */}
            <AnimatePresence>
              {flightAnim && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 20, pointerEvents: "none",
                    background: "rgba(8,14,6,0.92)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "10px",
                    padding: "0.5rem 1.1rem",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{flightAnim.flightTime.includes("train") ? "🚂" : "✈️"}</span>
                  <span className="mono" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                    {flightAnim.flightTime}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{
              position: "absolute", left: 0, right: 0,
              top: "50%", transform: "translateY(-50%)",
              zIndex: 1,
            }}>
              {loaded && (
                <ComposableMap
                  projection="geoOrthographic"
                  width={800}
                  height={440}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  projectionConfig={projCfg}
                >
                  <defs>
                    <radialGradient id="ocean-grad" cx="50%" cy="40%" r="70%">
                      <stop offset="0%" stopColor="#1a6090" />
                      <stop offset="55%" stopColor="#144870" />
                      <stop offset="100%" stopColor="#0a2035" />
                    </radialGradient>
                    <pattern id="ocean-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="0.6" fill="rgba(120,200,255,0.09)" />
                    </pattern>
                  </defs>
                  <Sphere id="ocean-base" fill="url(#ocean-grad)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                  <Sphere id="ocean-tex" fill="url(#ocean-dots)" stroke="none" strokeWidth={0} />
                  <Graticule stroke="rgba(120,200,255,0.1)" strokeWidth={0.4} />

                  {/* Country fills + borders */}
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
                              default: { fill: isHov ? "#5a8f62" : "#3d6642", stroke: "#243d27", strokeWidth: 0.5, outline: "none" },
                              hover:   { fill: "#5a8f62", stroke: "#243d27", strokeWidth: 0.5, outline: "none" },
                              pressed: { fill: "#3d6642", outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {/* State / province borders */}
                  <Geographies geography={STATES_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: { fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: 0.3, outline: "none" },
                            hover:   { fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: 0.3, outline: "none" },
                            pressed: { fill: "none", outline: "none" },
                          }}
                        />
                      ))
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
                        <circle
                          r={isFocused ? 19 : 13}
                          fill={`${stop.color}${isRevealed ? "14" : "06"}`}
                          stroke={`${stop.color}${isFocused ? "55" : isRevealed ? "28" : "14"}`}
                          strokeWidth={1}
                          style={{ cursor: "pointer", transition: "r 0.2s" }}
                        />
                        {stop.id === "nyc" && isRevealed && (
                          <motion.circle
                            r={10} fill="none" stroke={stop.color} strokeWidth={1}
                            animate={{ r: [10, 22], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          />
                        )}
                        {stop.id === "michigan" ? (
                          <image
                            href="/Michigan_Wolverines_Block_M.png"
                            x={isFocused ? -10 : -7} y={isFocused ? -8 : -5}
                            width={isFocused ? 20 : 14} height={isFocused ? 16 : 11}
                            style={{ opacity: isRevealed ? 1 : 0.35, cursor: "pointer", transition: "opacity 0.3s" }}
                          />
                        ) : (
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
                        )}
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

                  {/* Flight arc + plane */}
                  {flightAnim && (() => {
                    const fromStop = journeyStops.find(s => s.id === flightAnim.fromId)!;
                    const toStop   = journeyStops.find(s => s.id === flightAnim.toId)!;
                    const t        = easeInOut(flightAnim.rawProgress);
                    const adjLon   = wrapLon(fromStop.coordinates[0], toStop.coordinates[0]);
                    const rawLon   = fromStop.coordinates[0] + (adjLon - fromStop.coordinates[0]) * t;
                    const planeLon = normalizeLon(rawLon);
                    const planeLat = fromStop.coordinates[1] + (toStop.coordinates[1] - fromStop.coordinates[1]) * t;
                    const planeCoords: [number, number] = [planeLon, planeLat];
                    return (
                      <>
                        <Line
                          from={fromStop.coordinates}
                          to={planeCoords}
                          stroke="rgba(255,255,255,0.35)"
                          strokeWidth={1.2}
                          strokeDasharray="4 3"
                          strokeLinecap="round"
                        />
                        <Marker coordinates={planeCoords}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{ fontSize: "14px", userSelect: "none" }}
                          >✈️</text>
                        </Marker>
                      </>
                    );
                  })()}
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
              borderRadius: "10px",
              padding: "0.75rem 1.1rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                {displayStop.id === "michigan"
                  ? <img src="/Michigan_Wolverines_Block_M.png" style={{ width: 28, height: 22, objectFit: "contain" }} alt="M" />
                  : <span style={{ fontSize: "1.4rem" }}>{displayStop.emoji}</span>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{displayStop.name}</div>
                  <div className="mono" style={{ fontSize: "0.63rem", color: displayStop.color, marginTop: "0.05rem" }}>
                    {displayStop.period}
                  </div>
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.55, margin: 0 }}>
                {displayStop.detail}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                {w ? (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.3rem", lineHeight: 1 }}>{w.icon}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginTop: "0.15rem" }}>{w.temp}</div>
                    <div className="mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{w.desc}</div>
                  </div>
                ) : (
                  <div className="mono" style={{ fontSize: "0.58rem", color: "var(--text-dim)", opacity: 0.5 }}>fetching…</div>
                )}
                {dist && (
                  <div style={{ textAlign: "right", borderLeft: `1px solid ${displayStop.color}30`, paddingLeft: "0.85rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: displayStop.color }}>{dist} mi</div>
                    <div className="mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>from NYC</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        </div>{/* flex column: map + info */}
      </div>{/* inner max-width wrapper */}
    </section>
  );
}
