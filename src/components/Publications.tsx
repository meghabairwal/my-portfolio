"use client";

import { motion } from "framer-motion";
import { publications } from "@/lib/data";

export default function Publications() {
  return (
    <section
      id="publications"
      style={{
        padding: "6rem 2rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(107,155,175,0.03) 50%, transparent 100%)",
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
          <p className="section-label" style={{ marginBottom: "0.75rem" }}>// publications</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
            Research & Writing
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px" }}>
            Conference papers and industry writing — on education technology, multimedia learning, and NYC real estate.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {publications.map((pub, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.75rem",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = pub.color + "60")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.68rem",
                        color: pub.color,
                        background: pub.color + "18",
                        border: `1px solid ${pub.color}30`,
                        borderRadius: "3px",
                        padding: "0.1rem 0.45rem",
                      }}
                    >
                      {pub.type}
                    </span>
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                      {pub.year}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.4, marginBottom: "0.3rem" }}>
                    {pub.link ? (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = pub.color)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
                      >
                        {pub.title} ↗
                      </a>
                    ) : pub.title}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                    {pub.authors}
                  </div>
                  <div className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                    {pub.venue} · {pub.location}
                  </div>
                </div>
              </div>

              <div style={{ width: "40px", height: "1px", background: pub.color + "40", margin: "1rem 0" }} />

              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                {pub.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
