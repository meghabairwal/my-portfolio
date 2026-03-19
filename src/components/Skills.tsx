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
  "AI / LLMs": "🤖",
};

const SNIPPETS: Record<string, string[]> = {
  "Python":    ["df.groupby('city')", "  .agg({'rent': 'sum'})", "  .sort_values(ascending=False)"],
  "SQL":       ["SELECT city, SUM(value)", "FROM assets", "WHERE status = 'active'", "GROUP BY 1"],
  "dbt":       ["{{ config(", "  materialized='table'", ") }}", "SELECT * FROM {{ ref('base') }}"],
  "BigQuery":  ["SELECT * FROM", "  `proj.dataset.table`", "WHERE DATE(_PARTITIONTIME)", "  = CURRENT_DATE()"],
  "AWS":       ["lambda_client.invoke(", "  FunctionName='etl-job',", "  InvocationType='Event',", "  Payload=json.dumps(data))"],
  "Looker":    ["dimension: net_value {", "  type: number", "  sql: ${rent} - ${debt} ;;", "}"],
  "Airbyte":   ["source: postgres://prod", "destination: bigquery", "sync_mode: incremental", "cursor_field: updated_at"],
  "Airtable":  ["table.all(", "  fields=['Name','Status'],", "  formula='Status=Active'", ")"],
  "HubSpot":   ["contacts = client.crm", "  .contacts.basic_api", "  .get_page(limit=100,", "  after=offset)"],
  "REST APIs": ["res = requests.get(", "  url, headers=auth,", "  params={'page': n})", "res.raise_for_status()"],
  "Git":       ["git checkout -b feat/x", "git add -p", "git commit -m 'feat: ...'", "git push origin feat/x"],
  "AI / LLMs": ["response = model.generate(", "  contents=prompt,", "  config={temperature: 0.2}", ")"],
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
        timerRef.current = setTimeout(tick, 14);
      } else {
        li++; ci = 0; cur = "";
        timerRef.current = setTimeout(tick, 60);
      }
    };
    timerRef.current = setTimeout(tick, 60);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lines]);

  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", lineHeight: 1.7, padding: "0.6rem 0.75rem", background: "rgba(0,0,0,0.5)", borderRadius: "6px", marginTop: "0.75rem" }}>
      {rendered.map((line, i) => (
        <div key={i} style={{
          color: i === 0 ? color : i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)",
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

const ALL = "all";

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [hoveredSkill, setHoveredSkill]     = useState<string | null>(null);

  const filtered = activeCategory === ALL
    ? skills
    : skills.filter(s => s.category === activeCategory);

  return (
    <section id="skills" style={{ padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
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
          A data engineer's toolkit — hover any skill to see it in action.
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
          marginBottom: "2.5rem",
          overflowX: "auto",
        }}
      >
        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
          $ pipeline --show-stack
        </p>
        <div style={{ display: "flex", alignItems: "stretch", gap: "0", minWidth: "600px" }}>
          {pipelineSteps.map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  flex: 1,
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "8px",
                  padding: "1rem 0.75rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>{step.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text)", marginBottom: "0.5rem" }}>
                  {step.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", justifyContent: "center" }}>
                  {step.tools.map((tool) => (
                    <span key={tool} className="mono" style={{
                      fontSize: "0.65rem",
                      padding: "0.15rem 0.4rem",
                      background: "#1a2810",
                      border: "1px solid var(--border-bright)",
                      borderRadius: "3px",
                      color: "var(--terminal-green)",
                    }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </motion.div>
              {i < pipelineSteps.length - 1 && (
                <div style={{ color: "var(--border-bright)", fontSize: "1.2rem", padding: "0 0.4rem", flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Category filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.75rem" }}
      >
        <button onClick={() => setActiveCategory(ALL)} style={{
          padding: "0.4rem 1.1rem",
          borderRadius: "20px",
          border: `1px solid ${activeCategory === ALL ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"}`,
          background: activeCategory === ALL ? "rgba(255,255,255,0.12)" : "transparent",
          color: activeCategory === ALL ? "#fff" : "rgba(255,255,255,0.4)",
          fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
        }}>
          All
        </button>
        {Object.entries(skillCategories).map(([key, cat]) => (
          <button key={key} onClick={() => setActiveCategory(key)} style={{
            padding: "0.4rem 1.1rem",
            borderRadius: "20px",
            border: `1px solid ${activeCategory === key ? cat.color + "90" : cat.color + "30"}`,
            background: activeCategory === key ? `${cat.color}22` : "transparent",
            color: activeCategory === key ? cat.color : `${cat.color}80`,
            fontSize: "0.75rem", fontWeight: activeCategory === key ? 600 : 400,
            cursor: "pointer", transition: "all 0.18s",
          }}>
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Skill cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.85rem" }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((skill, i) => {
            const cat       = skillCategories[skill.category];
            const icon      = ICONS[skill.name] ?? "🔧";
            const snippet   = SNIPPETS[skill.name] ?? [];
            const isHovered = hoveredSkill === skill.name;
            const isDimmed  = hoveredSkill !== null && !isHovered;
            return (
              <motion.div
                key={skill.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isDimmed ? 0.18 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.22, delay: i * 0.03 }}
                onMouseEnter={() => setHoveredSkill(skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
                style={{
                  position: "relative",
                  background: isHovered ? `${cat.color}1a` : `${cat.color}0a`,
                  border: `1px solid ${isHovered ? cat.color + "80" : cat.color + "30"}`,
                  borderRadius: "12px",
                  padding: "1.25rem 1rem",
                  cursor: "default",
                  overflow: "hidden",
                  transform: isHovered ? "translateY(-5px) scale(1.02)" : "translateY(0) scale(1)",
                  boxShadow: isHovered
                    ? `0 12px 32px ${cat.color}28, 0 0 0 1px ${cat.color}18`
                    : "0 1px 6px rgba(0,0,0,0.25)",
                  transition: "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s, border-color 0.22s",
                }}
              >
                {/* Top accent bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}55)`,
                  opacity: isHovered ? 1 : 0.45,
                  transition: "opacity 0.2s",
                  borderRadius: "12px 12px 0 0",
                }} />

                {/* Shimmer on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ x: "-100%", opacity: 0.6 }}
                    animate={{ x: "200%", opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    style={{
                      position: "absolute", top: 0, bottom: 0, width: "50%",
                      background: `linear-gradient(90deg, transparent, ${cat.color}18, transparent)`,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Emoji + name row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <span style={{
                    fontSize: isHovered ? "1.5rem" : "1.25rem",
                    filter: isHovered ? `drop-shadow(0 0 8px ${cat.color}80)` : "none",
                    transition: "font-size 0.15s, filter 0.15s",
                    lineHeight: 1,
                  }}>
                    {icon}
                  </span>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: isHovered ? cat.color : "rgba(255,255,255,0.82)",
                    transition: "color 0.2s",
                    lineHeight: 1.2,
                  }}>
                    {skill.name}
                  </div>
                </div>

                {/* Category tag */}
                <div style={{
                  display: "inline-block",
                  fontSize: "0.58rem",
                  fontFamily: "var(--font-mono)",
                  color: cat.color,
                  background: `${cat.color}14`,
                  border: `1px solid ${cat.color}30`,
                  borderRadius: "4px",
                  padding: "0.1rem 0.4rem",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}>
                  {cat.label}
                </div>

                {/* Level bar */}
                <div style={{ position: "relative", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: i * 0.05, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                      borderRadius: "2px",
                      boxShadow: isHovered ? `0 0 8px ${cat.color}80` : "none",
                      transition: "box-shadow 0.2s",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: "0.58rem",
                  fontFamily: "var(--font-mono)",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "0.3rem",
                  textAlign: "right",
                }}>
                  {skill.level}%
                </div>

                {/* Code snippet on hover */}
                <AnimatePresence>
                  {isHovered && snippet.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <CodeTyper lines={snippet} color={cat.color} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
