"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const NYC_BOUNDS = { minLon: -74.26, maxLon: -73.60, minLat: 40.65, maxLat: 40.88 };
const W = 1100;
// H derived so (lon_range_rad / mercY_range) = W/H → tiles are always square, no distortion
const _mMax = Math.log(Math.tan(Math.PI / 4 + NYC_BOUNDS.maxLat * Math.PI / 360));
const _mMin = Math.log(Math.tan(Math.PI / 4 + NYC_BOUNDS.minLat * Math.PI / 360));
const H = Math.round(W * (_mMax - _mMin) / ((NYC_BOUNDS.maxLon - NYC_BOUNDS.minLon) * Math.PI / 180));

const CATEGORIES: Record<string, { color: string; types: string[] }> = {
  "Noise": {
    color: "#4ade80",
    types: ["Noise","Noise - Commercial","Noise - Helicopter","Noise - House of Worship","Noise - Park","Noise - Residential","Noise - Street/Sidewalk","Noise - Vehicle","Collection Truck Noise"],
  },
  "Housing": {
    color: "#f97316",
    types: ["HEAT/HOT WATER","Heat/Hot Water","Non-Residential Heat","PLUMBING","Plumbing","PAINT/PLASTER","Paint/Plaster","Peeling Paint","Mold","MOLD","Boiler","Boilers","Door/Window","DOOR/WINDOW","Flooring/Stairs","FLOORING/STAIRS","Window Guard","Water Leak","WATER LEAK","Indoor Sewage","Lead","Building Condition","Elevator","ELEVATOR","Appliance","APPLIANCE","Outside Building","OUTSIDE BUILDING","General Construction/Plumbing","Facade Insp Safety Pgm","Facades","Unstable Building","Indoor Air Quality"],
  },
  "Sanitation": {
    color: "#fbbf24",
    types: ["Dirty Condition","Dirty Conditions","Sanitation Condition","Illegal Dumping","Overflowing Litter Baskets","Overflowing Recycling Baskets","Missed Collection","Missed Collection (All Materials)","Sweeping/Missed","Sweeping/Inadequate","Sweeping/Missed-Inadequate","Litter Basket Complaint","Dead Animal","DSNY Spillage","Recycling Enforcement","Rodent","Mosquitoes","Unsanitary Condition","UNSANITARY CONDITION","Hazardous Materials","Oil or Gas Spill","Industrial Waste","Electronics Waste","Commercial Disposal Complaint","Residential Disposal Complaint","Dumpster Complaint","Asbestos","ASBESTOS"],
  },
  "Public Safety": {
    color: "#f43f5e",
    types: ["Drug Activity","Graffiti","Encampment","Homeless Encampment","Homeless Person Assistance","Homeless Street Condition","Panhandling","Drinking","Urinating in Public","Disorderly Youth","Squeegee","Illegal Fireworks","Non-Emergency Police Matter","Quality of Life","Smoking","Smoking or Vaping","Illegal Posting","Illegal Animal Kept as Pet","Animal-Abuse","Unleashed Dog","Unlicensed Dog","Unsanitary Animal Facility","Unsanitary Pigeon Condition","Harboring Bees/Wasps","Vacant Lot"],
  },
  "Parking": {
    color: "#38bdf8",
    types: ["Illegal Parking","Blocked Driveway","Abandoned Vehicle","Derelict Vehicles","Abandoned Bike","Derelict Bicycle","Broken Parking Meter","For Hire Vehicle Complaint","Taxi Complaint","Green Taxi Complaint","Traffic"],
  },
  "Infrastructure": {
    color: "#c084fc",
    types: ["Street Condition","DEP Street Condition","Street Light Condition","Street Sign - Damaged","Street Sign - Dangling","Street Sign - Missing","Sidewalk Condition","DEP Sidewalk Condition","Root/Sewer/Sidewalk Condition","Traffic Signal Condition","Highway Condition","DEP Highway Condition","Bridge Condition","DEP Bridge Condition","Tunnel Condition","Curb Condition","Water Drainage","Water Maintenance","Sewer","Sewer Maintenance","Standing Water","Snow","Snow or Ice","Snow Removal"],
  },
  "Parks & Nature": {
    color: "#22d3ee",
    types: ["Damaged Tree","Dead/Dying Tree","Overgrown Tree/Branches","Illegal Tree Damage","Uprooted Stump","New Tree Request","Animal in a Park","Violation of Park Rules","Bike/Roller/Skate","Bike/Roller/Skate Chronic","Mosquitoes","Poison Ivy"],
  },
  "Other": {
    color: "rgba(255,255,255,0.35)",
    types: [], // catch-all — populated dynamically
  },
};

// Flat lookup: complaint_type → category name
const TYPE_TO_CAT: Record<string, string> = {};
Object.entries(CATEGORIES).forEach(([cat, { types }]) => {
  types.forEach(t => { TYPE_TO_CAT[t] = cat; });
});

function getTypeCat(type: string): string {
  return TYPE_TO_CAT[type] ?? "Other";
}

function getCatColor(type: string): string {
  const cat = getTypeCat(type);
  return CATEGORIES[cat]?.color ?? "rgba(255,255,255,0.35)";
}

const BOROUGH_LABELS = [
  { name: "BRONX",     lon: -73.87,  lat: 40.855 },
  { name: "MANHATTAN", lon: -73.972, lat: 40.775 },
  { name: "QUEENS",    lon: -73.82,  lat: 40.725 },
  { name: "BROOKLYN",  lon: -73.955, lat: 40.645 },
];

interface Complaint {
  latitude: string;
  longitude: string;
  complaint_type: string;
  created_date: string;
  borough?: string;
  descriptor?: string;
}

interface Transform { x: number; y: number; scale: number }


// Web Mercator y — must match tile projection exactly
function mercY(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
}
const MERC_Y_MAX = mercY(NYC_BOUNDS.maxLat);
const MERC_Y_MIN = mercY(NYC_BOUNDS.minLat);

function dataToCanvas(lon: number, lat: number) {
  return {
    x: ((lon - NYC_BOUNDS.minLon) / (NYC_BOUNDS.maxLon - NYC_BOUNDS.minLon)) * W,
    y: ((MERC_Y_MAX - mercY(lat)) / (MERC_Y_MAX - MERC_Y_MIN)) * H,
  };
}

function canvasToLonLat(px: number, py: number) {
  const lon = px / W * (NYC_BOUNDS.maxLon - NYC_BOUNDS.minLon) + NYC_BOUNDS.minLon;
  const my = MERC_Y_MAX - py / H * (MERC_Y_MAX - MERC_Y_MIN);
  const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * 180 / Math.PI;
  return { lon, lat };
}

function lngLatToTile(lon: number, lat: number, z: number) {
  const n = Math.pow(2, z);
  const latRad = lat * Math.PI / 180;
  return {
    tx: Math.floor((lon + 180) / 360 * n),
    ty: Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n),
  };
}

function tileToLonLat(tx: number, ty: number, z: number) {
  const n = Math.pow(2, z);
  return {
    lon: tx / n * 360 - 180,
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * ty / n))) * 180 / Math.PI,
  };
}

function getTileZ(scale: number) {
  // z=12 at scale=1 gives ~170px tiles on corrected 1100×700 canvas — readable streets
  return Math.min(16, Math.max(11, Math.round(Math.log2(scale) + 12)));
}

function clampTransform(t: Transform): Transform {
  // Prevent panning/zooming out so empty canvas area is never visible
  const minX = W * (1 - t.scale);
  const minY = H * (1 - t.scale);
  return {
    ...t,
    x: Math.min(0, Math.max(minX, t.x)),
    y: Math.min(0, Math.max(minY, t.y)),
  };
}

export default function NYCViz() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const transformRef  = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const isDragging    = useRef(false);
  const dragStart     = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);
  const complaintsRef = useRef<Complaint[]>([]);
  const tileCache     = useRef<Map<string, HTMLImageElement>>(new Map());
  const hiddenRef     = useRef<Set<string>>(new Set());

  const [complaints, setComplaints]   = useState<Complaint[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [transform, setTransform]     = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; c: Complaint } | null>(null);
  const [hidden, setHidden]           = useState<Set<string>>(new Set());
  const [grabbing, setGrabbing]       = useState(false);

  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { complaintsRef.current = complaints; }, [complaints]);
  useEffect(() => { hiddenRef.current = hidden; }, [hidden]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((t: Transform, data: Complaint[], hiddenTypes: Set<string>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.scale, t.scale);

    // ── Map tiles ──
    const z = getTileZ(t.scale);
    const visLeft   = Math.max(0, -t.x / t.scale);
    const visTop    = Math.max(0, -t.y / t.scale);
    const visRight  = Math.min(W, (W - t.x) / t.scale);
    const visBottom = Math.min(H, (H - t.y) / t.scale);
    const { lon: lon0, lat: lat0 } = canvasToLonLat(visLeft, visTop);
    const { lon: lon1, lat: lat1 } = canvasToLonLat(visRight, visBottom);
    const { tx: txMin, ty: tyMin } = lngLatToTile(lon0, lat0, z);
    const { tx: txMax, ty: tyMax } = lngLatToTile(lon1, lat1, z);

    for (let ty = tyMin; ty <= tyMax; ty++) {
      for (let tx = txMin; tx <= txMax; tx++) {
        const key = `${z}/${tx}/${ty}`;
        let img = tileCache.current.get(key);
        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = `https://a.basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}.png`;
          img.onload = () => draw(transformRef.current, complaintsRef.current, hiddenRef.current);
          tileCache.current.set(key, img);
        }
        if (img.complete && img.naturalWidth > 0) {
          const { lon: tl0, lat: tl0lat } = tileToLonLat(tx, ty, z);
          const { lon: tl1, lat: tl1lat } = tileToLonLat(tx + 1, ty + 1, z);
          const p0 = dataToCanvas(tl0, tl0lat);
          const p1 = dataToCanvas(tl1, tl1lat);
          ctx.drawImage(img, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
        }
      }
    }

    // ── Dots ──
    const r = 1.8 / t.scale;
    data.forEach(c => {
      if (hiddenTypes.has(getTypeCat(c.complaint_type))) return;
      const lon = parseFloat(c.longitude);
      const lat = parseFloat(c.latitude);
      if (!isFinite(lon) || !isFinite(lat)) return;
      const { x, y } = dataToCanvas(lon, lat);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = getCatColor(c.complaint_type);
      ctx.globalAlpha = 0.85;
      ctx.fill();
    });

    // ── Borough labels ──
    ctx.globalAlpha = 1;
    const fontSize = Math.max(8, 13 / t.scale);
    ctx.font = `600 ${fontSize}px monospace`;
    ctx.textAlign = "center";
    BOROUGH_LABELS.forEach(b => {
      const { x, y } = dataToCanvas(b.lon, b.lat);
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6 / t.scale;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(b.name, x, y);
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }, []);

  useEffect(() => {
    draw(transform, complaints, hidden);
  }, [transform, complaints, hidden, draw]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/nyc311")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error();
        setComplaints(data);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * ratio;
    const my = (e.clientY - rect.top) * ratio;
    const t = transformRef.current;
    const factor = e.deltaY > 0 ? 0.85 : 1.18;
    const newScale = Math.max(1, Math.min(14, t.scale * factor));
    const newX = mx - (mx - t.x) * (newScale / t.scale);
    const newY = my - (my - t.y) * (newScale / t.scale);
    const next = clampTransform({ x: newX, y: newY, scale: newScale });
    transformRef.current = next;
    setTransform(next);
    setTooltip(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const dismiss = () => setTooltip(null);
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => window.removeEventListener("scroll", dismiss);
  }, []);

  // ── Pan ───────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    setGrabbing(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: transformRef.current.x, ty: transformRef.current.y };
    setTooltip(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !dragStart.current) return;
    const canvas = canvasRef.current!;
    const ratio = canvas.width / canvas.getBoundingClientRect().width;
    const dx = (e.clientX - dragStart.current.mx) * ratio;
    const dy = (e.clientY - dragStart.current.my) * ratio;
    const next = clampTransform({ ...transformRef.current, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
    transformRef.current = next;
    setTransform(next);
  }, []);

  const handleMouseUp = useCallback(() => { isDragging.current = false; setGrabbing(false); }, []);

  // ── Click → tooltip ───────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = canvasRef.current.width / rect.width;
    const clickX = (e.clientX - rect.left) * ratio;
    const clickY = (e.clientY - rect.top) * ratio;
    const t = transformRef.current;
    const dataX = (clickX - t.x) / t.scale;
    const dataY = (clickY - t.y) / t.scale;

    const threshold = 12 / t.scale;
    let closest: Complaint | null = null;
    let minDist = threshold;
    const hiddenSnap = hiddenRef.current;
    complaintsRef.current.forEach(c => {
      if (hiddenSnap.has(getTypeCat(c.complaint_type))) return;
      const lon = parseFloat(c.longitude);
      const lat = parseFloat(c.latitude);
      if (!isFinite(lon) || !isFinite(lat)) return;
      const { x, y } = dataToCanvas(lon, lat);
      const dist = Math.sqrt((x - dataX) ** 2 + (y - dataY) ** 2);
      if (dist < minDist) { minDist = dist; closest = c; }
    });

    setTooltip(closest ? { x: e.clientX, y: e.clientY, c: closest } : null);
  }, []);

  // ── Legend toggle ─────────────────────────────────────────────────────────
  const toggleType = useCallback((type: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
    setTooltip(null);
  }, []);

  const allHidden = useCallback(() => {
    setHidden(new Set(Object.keys(CATEGORIES)));
    setTooltip(null);
  }, []);

  const noneHidden = useCallback(() => {
    setHidden(new Set());
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    const t = transformRef.current;
    const next = clampTransform({ ...t, x: t.x + dx, y: t.y + dy });
    transformRef.current = next;
    setTransform(next);
  }, []);

  const catCounts = Object.entries(CATEGORIES).map(([name, { color }]) => ({
    name,
    color,
    count: complaints.filter(c => getTypeCat(c.complaint_type) === name).length,
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  const allVisible = hidden.size === 0;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const boroughColors: Record<string, string> = {
    "BRONX": "#c084fc", "BROOKLYN": "#4ade80",
    "MANHATTAN": "#f97316", "QUEENS": "#fbbf24", "STATEN ISLAND": "#38bdf8",
  };

  const boroughCounts = complaints.reduce((acc, c) => {
    if (c.borough && c.borough !== "Unspecified") acc[c.borough] = (acc[c.borough] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const catPieData  = catCounts.map(({ name, color, count }) => ({ name, value: count, color }));
  const boroPieData = Object.entries(boroughCounts)
    .map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value, color: boroughColors[name] ?? "rgba(255,255,255,0.2)" }))
    .sort((a, b) => b.value - a.value);

  const activeCats = catCounts.map(c => c.name);
  const hourData = Array.from({ length: 24 }, (_, h) => {
    const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
    const row: Record<string, string | number> = { hour: label };
    activeCats.forEach(cat => { row[cat] = 0; });
    return row;
  });
  complaints.forEach(c => {
    const h = new Date(c.created_date).getHours();
    const cat = getTypeCat(c.complaint_type);
    if (hourData[h] && cat in hourData[h]) (hourData[h][cat] as number)++;
  });

  const dates = complaints.map(c => new Date(c.created_date).getTime()).filter(Boolean);
  const peakH = hourData.reduce((best, d) => {
    const total = activeCats.reduce((s, cat) => s + (d[cat] as number), 0);
    const bestTotal = activeCats.reduce((s, cat) => s + (best[cat] as number), 0);
    return total > bestTotal ? d : best;
  }, hourData[0]);

  const chartCard = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.85rem 1rem 0.75rem" };
  const chartLabel = { fontSize: "0.7rem" as const, fontFamily: "var(--font-mono)", fill: "rgba(255,255,255,0.4)" };

  return (
    <section id="nyc-viz" style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "1.25rem" }}
      >
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>// live_data</p>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
          NYC right now
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          {complaints.length > 0 ? complaints.length.toLocaleString() : "10,000"} most recent 311 complaints pulled live from NYC Open Data. Every dot is a real call to the city.
        </p>
        <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem", lineHeight: 1.7 }}>
          New York doesn't just happen. It gets complained about, tracked, and logged in real time. I built this because it's exactly what I do professionally: pipe raw public data into something that tells a story. As someone who moved here and immediately fell in love with the city's chaos and complexity, I find NYC's open datasets endlessly fascinating. The patterns in this map (which neighborhoods complain most, what hour noise spikes, where infrastructure is struggling) are the same kinds of signals I extract from real estate and financial data at work.
        </p>
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          I make data less abstract and more actionable. I truly see it as a tool to get to know, understand, and help improve the world around me.
        </p>
      </motion.div>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Chrome bar */}
        <div style={{
          background: "#0d1b2a",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0.7rem 1.2rem",
          display: "flex", alignItems: "center", gap: "0.6rem",
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
          <span className="mono" style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
            nyc_311_live.map
          </span>
          {!loading && !error && (
            <span className="mono" style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--terminal-green)" }}>
              ● {complaints.length.toLocaleString()} complaints · scroll to zoom · click to inspect
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "#060e06", zIndex: 2,
            }}>
              <span className="mono" style={{ fontSize: "0.8rem", color: "var(--terminal-green)" }}>fetching live data…</span>
            </div>
          )}
          {error && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "#060e06", zIndex: 2,
            }}>
              <span className="mono" style={{ fontSize: "0.8rem", color: "#E8624A" }}>could not reach NYC Open Data API</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: "100%", height: "auto", display: "block",
              background: "#0e1a14",
              cursor: grabbing ? "grabbing" : "crosshair",
            }}
          />

          {/* Arrow pan buttons */}
          {(() => {
            const btnBase: React.CSSProperties = {
              position: "absolute",
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(6,12,8,0.75)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "0.85rem",
              backdropFilter: "blur(4px)",
              userSelect: "none",
              zIndex: 10,
            };
            const PAN = 120;
            return (
              <>
                <button style={{ ...btnBase, top: "50%", left: 10, transform: "translateY(-50%)" }} onClick={() => pan(PAN, 0)} title="Pan left">◀</button>
                <button style={{ ...btnBase, top: "50%", right: 10, transform: "translateY(-50%)" }} onClick={() => pan(-PAN, 0)} title="Pan right">▶</button>
                <button style={{ ...btnBase, top: 10, left: "50%", transform: "translateX(-50%)" }} onClick={() => pan(0, PAN)} title="Pan up">▲</button>
                <button style={{ ...btnBase, bottom: 10, left: "50%", transform: "translateX(-50%)" }} onClick={() => pan(0, -PAN)} title="Pan down">▼</button>
              </>
            );
          })()}

          {/* Legend */}
          {catCounts.length > 0 && (
            <div style={{
              position: "absolute", bottom: "1rem", left: "1rem",
              background: "rgba(6,12,8,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "0.6rem 0.85rem",
              backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column", gap: "0.35rem",
              minWidth: "190px",
            }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <button onClick={noneHidden} style={{ fontSize: "0.55rem", fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.15)", background: allVisible ? "rgba(255,255,255,0.12)" : "transparent", color: allVisible ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", cursor: "pointer" }}>show all</button>
                <button onClick={allHidden} style={{ fontSize: "0.55rem", fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.15)", background: !allVisible ? "rgba(255,255,255,0.12)" : "transparent", color: !allVisible ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", cursor: "pointer" }}>hide all</button>
              </div>
              {catCounts.filter(({ name }) => !hidden.has(name)).map(({ name, color, count }) => (
                <div key={name} onClick={() => toggleType(name)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-mono)" }}>{name}</span>
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", marginLeft: "auto", paddingLeft: "0.5rem" }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tooltip */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "fixed",
                  left: tooltip.x + 14,
                  top: tooltip.y - 10,
                  zIndex: 50,
                  background: "rgba(8,14,8,0.95)",
                  border: `1px solid ${getCatColor(tooltip.c.complaint_type)}55`,
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  backdropFilter: "blur(10px)",
                  pointerEvents: "none",
                  maxWidth: "240px",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: getCatColor(tooltip.c.complaint_type), flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: "0.78rem", color: getCatColor(tooltip.c.complaint_type) }}>
                    {tooltip.c.complaint_type}
                  </span>
                </div>
                {tooltip.c.descriptor && (
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginBottom: "0.3rem" }}>
                    {tooltip.c.descriptor}
                  </div>
                )}
                {tooltip.c.borough && (
                  <div className="mono" style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)" }}>
                    {tooltip.c.borough}
                  </div>
                )}
                <div className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginTop: "0.3rem" }}>
                  {new Date(tooltip.c.created_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Charts row ── */}
      {complaints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: "1rem", marginTop: "1.25rem" }}
        >
          {/* Category pie */}
          <div style={chartCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <p className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>by category</p>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{catPieData[0]?.name.toLowerCase()} leads</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.22rem", alignItems: "flex-end" }}>
                {catPieData.slice(0, 6).map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span className="mono" style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.55)" }}>{d.name}</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catPieData} dataKey="value" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
                  {catPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ReTooltip
                  contentStyle={{ background: "rgba(6,12,8,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}
                  formatter={(v, name) => [`${Number(v).toLocaleString()} (${Math.round(Number(v) / complaints.length * 100)}%)`, name as string]}
                  labelStyle={{ display: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Borough pie */}
          <div style={chartCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <p className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>by borough</p>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{boroPieData[0]?.name} loudest</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.22rem", alignItems: "flex-end" }}>
                {boroPieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span className="mono" style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.55)" }}>{d.name}</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={boroPieData} dataKey="value" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
                  {boroPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ReTooltip
                  contentStyle={{ background: "rgba(6,12,8,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}
                  formatter={(v, name) => [`${Number(v).toLocaleString()} (${Math.round(Number(v) / complaints.length * 100)}%)`, name as string]}
                  labelStyle={{ display: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Hour area chart */}
          <div style={chartCard}>
            <p className="mono" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>complaints by hour</p>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#38bdf8", marginBottom: "0.75rem" }}>
              peaks at {peakH?.hour}
            </p>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={hourData} margin={{ top: 4, right: 12, left: 8, bottom: 24 }}>
                <defs>
                  {activeCats.map(cat => (
                    <linearGradient key={cat} id={`grad-${cat.replace(/\s|&/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORIES[cat]?.color} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={CATEGORIES[cat]?.color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={true} />
                <XAxis dataKey="hour" tick={chartLabel} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.15)" }} interval={2}
                  label={{ value: "hour of day", position: "insideBottom", offset: -12, style: { fontSize: "0.6rem", fontFamily: "var(--font-mono)", fill: "rgba(255,255,255,0.3)" } }}
                />
                <YAxis tick={chartLabel} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  label={{ value: "complaints", angle: -90, position: "insideLeft", offset: 16, style: { fontSize: "0.6rem", fontFamily: "var(--font-mono)", fill: "rgba(255,255,255,0.3)" } }}
                />
                <ReTooltip
                  contentStyle={{ background: "rgba(6,12,8,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}
                  formatter={(v, name) => [`${Number(v).toLocaleString()}`, name as string]}
                  labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}
                />
                {activeCats.map(cat => (
                  <Area key={cat} type="monotone" dataKey={cat} stackId="1"
                    stroke={CATEGORIES[cat]?.color} strokeWidth={1}
                    fill={`url(#grad-${cat.replace(/\s|&/g, "")})`}
                    dot={false} activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </section>
  );
}
