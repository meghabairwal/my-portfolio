"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/data";

export default function Projects() {
  return (
    <section id="projects" style={{ padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "3rem" }}
      >
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>// projects</p>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
          Things I&apos;ve built
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "500px" }}>
          Selected work — more coming soon.
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {projects.map((project, i) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${project.placeholder ? "var(--border)" : "var(--border-bright)"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              opacity: project.placeholder ? 0.6 : 1,
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.3s, opacity 0.3s",
            }}
            whileHover={{ opacity: 1 }}
          >
            {/* Corner accent */}
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: "60px", height: "60px",
              background: "linear-gradient(135deg, transparent 50%, rgba(124,185,136,0.06) 50%)",
              borderBottomLeftRadius: "60px",
            }} />

            <div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: "0.4rem" }}>
                {project.title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                {project.description}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="mono"
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.2rem 0.5rem",
                    background: "var(--bg-card-hover)",
                    border: "1px solid var(--border-bright)",
                    borderRadius: "4px",
                    color: "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "auto", flexWrap: "wrap" }}>
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{ fontSize: "0.78rem", color: "var(--green)", textDecoration: "none" }}
                >
                  view on GitHub →
                </a>
              )}
              {project.article && (
                <a
                  href={project.article}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{ fontSize: "0.78rem", color: "var(--brown)", textDecoration: "none" }}
                >
                  read article →
                </a>
              )}
              {project.placeholder && (
                <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  // coming soon
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
