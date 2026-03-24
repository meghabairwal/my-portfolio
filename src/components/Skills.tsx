"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { skills, skillCategories } from "@/lib/data";

const pipelineSteps = [
  { label: "Ingest",      tools: ["Airbyte", "Airtable", "REST APIs"], icon: "⬇" },
  { label: "Store",       tools: ["BigQuery", "AWS"],                   icon: "🗄" },
  { label: "Transform",   tools: ["dbt", "SQL", "Python"],              icon: "⚙" },
  { label: "Visualize",   tools: ["Looker"],                            icon: "📊" },
  { label: "Collaborate", tools: ["Git"],                               icon: "🔀" },
];

const ICONS: Record<string, string> = {
  "Python":    "🐍",
  "SQL":       "🗃️",
  "dbt":       "⚡",
  "BigQuery":  "☁️",
  "AWS":       "🌩️",
  "Looker":    "📊",
  "Airbyte":   "🔄",
  "Airtable":  "📋",
  "HubSpot":   "🔗",
  "REST APIs": "🌐",
  "Git":       "🌿",
  "Claude Code": "🤖",
  "Fine Tuning":  "🎯",
  "LSTM":         "🧠",
  "RAG":          "🔍",
};

const CATEGORY_SNIPPETS: Record<string, string[]> = {
  language: ["SELECT region, COUNT(*) AS cnt,", "  SUM(revenue) AS total", "FROM orders", "GROUP BY 1 ORDER BY 3 DESC"],
  transform: ["{{ config(materialized='table') }}", "SELECT a.*, b.category", "FROM {{ ref('events') }} a", "LEFT JOIN {{ ref('dim_users') }} b USING (id)"],
  cloud:    ["SELECT event, COUNT(*) AS n", "FROM `project.dataset.events`", "WHERE DATE(_PARTITIONTIME)", "  = CURRENT_DATE()"],
  viz:      ["dimension: lifetime_value {", "  type: number", "  sql: ${revenue} - ${cost} ;;", "}"],
  pipeline: ["source: postgres://prod", "destination: bigquery", "sync_mode: incremental", "cursor_field: updated_at"],
  tools:    ["res = requests.get(url,", "  headers={'Authorization': token},", "  params={'page': n, 'limit': 100})", "res.raise_for_status()"],
  ai:       ["response = model.generate(", "  contents=prompt,", "  config={", "    'temperature': 0.2})"],
};

function CodeTyper({ lines, color }: { lines: string[]; color: string }) {
  const [rendered, setRendered] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRendered([]);
    let li = 0, ci = 0, cur = "";
    const tick = () => {
      if (li >= lines.length) return;
      if (ci < lines[li].length) {
        cur += lines[li][ci++];
        setRendered(prev => { const n = [...prev]; n[li] = cur; return n; });
        timerRef.current = setTimeout(tick, 13);
      } else {
        li++; ci = 0; cur = "";
        timerRef.current = setTimeout(tick, 55);
      }
    };
    timerRef.current = setTimeout(tick, 40);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lines]);

  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", lineHeight: 1.85, padding: "1rem 1.1rem", background: "rgba(0,0,0,0.45)", borderRadius: "8px" }}>
      {rendered.map((line, i) => (
        <div key={i} style={{
          color: i === 0 ? color : i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.75)",
          whiteSpace: "pre",
        }}>
          {line}
          {i === rendered.length - 1 && rendered.length < lines.length && (
            <motion.span
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ repeat: Infinity, duration: 0.7, times: [0, 0.45, 0.5, 1] }}
              style={{ color }}
            >▌</motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

const grouped = Object.entries(skillCategories).map(([key, cat]) => ({
  key,
  label: cat.label,
  color: cat.color,
  skills: skills.filter(s => s.category === key),
}));

export default function Skills() {
  const [selected, setSelected] = useState<string | null>(null);
  const activeGroup = grouped.find(g => g.key === selected) ?? null;

  return (
    <section id="skills" style={{ padding: "6rem 2rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "3rem" }}
      >
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>// tech_stack</p>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
          Tools of the trade
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "500px" }}>
          A data engineer&apos;s toolkit — hover any category to see it in action.
        </p>
      </motion.div>

      {/* Pipeline diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
          $ pipeline --show-stack
        </p>
        <div style={{ display: "flex", alignItems: "stretch", gap: "0", minWidth: "600px" }}>
          {pipelineSteps.map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "8px",
                  padding: "1rem 0.75rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>{step.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text)", marginBottom: "0.5rem" }}>{step.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", justifyContent: "center" }}>
                  {step.tools.map((tool) => (
                    <span key={tool} className="mono" style={{
                      fontSize: "0.65rem", padding: "0.15rem 0.4rem",
                      background: "#1a2810", border: "1px solid var(--border-bright)",
                      borderRadius: "3px", color: "var(--terminal-green)",
                    }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </motion.div>
              {i < pipelineSteps.length - 1 && (
                <div style={{ color: "var(--border-bright)", fontSize: "1.2rem", padding: "0 0.4rem", flexShrink: 0, display: "flex", alignItems: "center" }}>→</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cards or detail — same container height */}
      <AnimatePresence mode="wait">
        {!activeGroup ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mono" style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "center", letterSpacing: "0.04em" }}>
              ↓ click a category to explore
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${grouped.length}, 1fr)`,
              gap: "0.75rem",
              height: "160px",
            }}>
              {grouped.map((cat, gi) => (
                <motion.button
                  key={cat.key}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.05 }}
                  onClick={() => setSelected(cat.key)}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "1.25rem 1rem",
                    borderRadius: "14px",
                    border: `1px solid ${cat.color}55`,
                    background: `linear-gradient(135deg, ${cat.color}30 0%, ${cat.color}18 60%, ${cat.color}08 100%)`,
                    cursor: "pointer",
                    textAlign: "left",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 8px 32px ${cat.color}35`,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Solid color top bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                    background: cat.color, borderRadius: "14px 14px 0 0",
                  }} />

                  {/* Large watermark icon in background */}
                  <div style={{
                    position: "absolute", bottom: "-10px", right: "-6px",
                    fontSize: "5.5rem", lineHeight: 1,
                    opacity: 0.12, pointerEvents: "none", userSelect: "none",
                    filter: "grayscale(20%)",
                  }}>
                    {ICONS[cat.skills[0]?.name] ?? "🔧"}
                  </div>

                  {/* Bottom: label + count */}
                  <div style={{ zIndex: 1 }}>
                    <div style={{
                      fontWeight: 800, fontSize: "0.95rem",
                      color: "rgba(255,255,255,0.95)", marginBottom: "0.3rem",
                      textShadow: `0 0 20px ${cat.color}60`,
                    }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: cat.color }}>
                      {cat.skills.length} tool{cat.skills.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button */}
            <button
              onClick={() => setSelected(null)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                color: activeGroup.color, background: "none", border: "none",
                cursor: "pointer", marginBottom: "1rem", opacity: 0.8,
                padding: 0,
              }}
            >
              ← all categories
            </button>

            <div style={{
              background: `${activeGroup.color}0c`,
              border: `1px solid ${activeGroup.color}45`,
              borderRadius: "12px",
              padding: "1.75rem 2rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              alignItems: "start",
            }}>
              {/* Left: skills */}
              <div>
                <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: activeGroup.color, marginBottom: "1rem", letterSpacing: "0.08em" }}>
                  {activeGroup.label.toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {activeGroup.skills.map((skill) => (
                    <div key={skill.name} style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                      <span style={{ fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}>{ICONS[skill.name] ?? "🔧"}</span>
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", fontWeight: 500, minWidth: "85px" }}>
                        {skill.name}
                      </span>
                      <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.level}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ height: "100%", background: `linear-gradient(90deg, ${activeGroup.color}, ${activeGroup.color}60)`, borderRadius: "2px" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.58rem", fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                        {skill.level}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: code snippet */}
              <div>
                <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.25)", marginBottom: "1rem", letterSpacing: "0.08em" }}>
                  // in the wild
                </div>
                <CodeTyper
                  key={activeGroup.key}
                  lines={CATEGORY_SNIPPETS[activeGroup.key] ?? []}
                  color={activeGroup.color}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
