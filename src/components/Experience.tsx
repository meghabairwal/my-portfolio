"use client";

import { motion } from "framer-motion";
import { experience } from "@/lib/data";
import FnmaChart from "@/components/FnmaChart";
import StatCounters from "@/components/StatCounters";

const maverickStats = [
  { prefix: "$", value: 1, suffix: "B+", label: "assets supported" },
  { prefix: "$", value: 500, suffix: "M+", label: "financial flows traced" },
  { prefix: "~$", value: 200, suffix: "B", label: "CMBS data reviewed" },
  { prefix: "~", value: 20, suffix: "%", label: "valuation accuracy gain" },
];

const gripStats = [
  { value: 92, suffix: "", label: "students in study" },
  { value: 6, suffix: "", label: "classrooms deployed" },
  { value: 30, suffix: "+", label: "features shipped" },
  { value: 1, suffix: "", label: "conference paper" },
];

export default function Experience() {
  return (
    <section
      id="experience"
      style={{
        padding: "6rem 2rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(124,185,136,0.02) 50%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: "3rem" }}
        >
          <p className="section-label" style={{ marginBottom: "0.75rem" }}>// experience</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
            Where I&apos;ve worked
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px" }}>
            Building data infrastructure that actually matters — from federal mortgage data to NYC real estate.
          </p>
        </motion.div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: "20px",
            top: 0,
            bottom: 0,
            width: "1px",
            background: "linear-gradient(180deg, var(--green) 0%, var(--border) 100%)",
          }} />

          <div style={{ paddingLeft: "60px", display: "flex", flexDirection: "column", gap: "3rem" }}>
            {experience.map((job, i) => (
              <motion.div
                key={job.company}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                style={{ position: "relative" }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: "absolute",
                  left: "-48px",
                  top: "4px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: job.color,
                  border: "2px solid var(--bg)",
                  boxShadow: `0 0 0 3px ${job.color}40`,
                }} />

                <div
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.75rem",
                    transition: "border-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = job.color + "60")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)" }}>{job.role}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                        <span style={{ color: job.color, fontWeight: 600, fontSize: "0.95rem" }}>{job.company}</span>
                        <span style={{ color: "var(--text-dim)" }}>·</span>
                        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)", padding: "0.1rem 0.4rem", background: job.color + "15", borderRadius: "3px", border: `1px solid ${job.color}30` }}>
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{job.period}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{job.location}</div>
                    </div>
                  </div>

                  <div style={{ width: "40px", height: "1px", background: job.color + "40", margin: "1rem 0" }} />

                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                    {job.description}
                  </p>

                  {/* Highlights */}
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {job.highlights.map((h, j) => (
                      <li
                        key={j}
                        style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.88rem", color: "var(--text-muted)" }}
                      >
                        <span style={{ color: job.color, marginTop: "0.1rem", flexShrink: 0 }}>▸</span>
                        {h}
                      </li>
                    ))}
                  </ul>

                  {job.company === "Fannie Mae" && <FnmaChart />}
                  {job.company === "Maverick Real Estate Partners" && (
                    <StatCounters stats={maverickStats} color={job.color} />
                  )}
                  {job.company === "GRIP Lab, University of Michigan" && (
                    <StatCounters stats={gripStats} color={job.color} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
