"use client";

import { motion } from "framer-motion";
import { personal } from "@/lib/data";

export default function Contact() {
  return (
    <section
      id="contact"
      style={{
        padding: "6rem 2rem 8rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(196,149,106,0.03) 100%)",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label" style={{ marginBottom: "0.75rem" }}>// contact</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>
            Let&apos;s connect
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto 3rem", lineHeight: 1.7 }}>
            Always happy to talk data, real estate, AI, or anything in between.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}
        >
          {/* Email */}
          <a
            href={`mailto:${personal.email}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.85rem 1.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              borderRadius: "8px",
              color: "var(--text)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brown)";
              e.currentTarget.style.color = "var(--brown)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            {personal.email}
          </a>

          {/* Phone */}
          <a
            href="tel:+17347771381"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.85rem 1.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              borderRadius: "8px",
              color: "var(--text)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7CB988";
              e.currentTarget.style.color = "#7CB988";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            (734) 777-1381
          </a>

          {/* LinkedIn */}
          <a
            href={personal.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.85rem 1.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              borderRadius: "8px",
              color: "var(--text)",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.color = "var(--green)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect width="4" height="12" x="2" y="9"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
            LinkedIn
          </a>
        </motion.div>

        {/* NYC Skyline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1 }}
          style={{ marginTop: "5rem", overflow: "hidden" }}
        >
          <svg
            viewBox="0 0 800 120"
            style={{ width: "100%", display: "block", opacity: 0.18 }}
            fill="var(--green)"
          >
            {/* NYC skyline silhouette */}
            {/* Left Brooklyn / low buildings */}
            <rect x="0" y="90" width="18" height="30" />
            <rect x="20" y="80" width="14" height="40" />
            <rect x="36" y="85" width="10" height="35" />
            <rect x="48" y="75" width="16" height="45" />
            <rect x="66" y="88" width="12" height="32" />
            {/* Brooklyn Bridge towers */}
            <rect x="80" y="60" width="8" height="60" />
            <path d="M84,60 Q70,80 60,90" stroke="var(--green)" strokeWidth="1.5" fill="none" />
            <path d="M84,60 Q98,80 108,90" stroke="var(--green)" strokeWidth="1.5" fill="none" />
            <rect x="100" y="60" width="8" height="60" />
            {/* Lower Manhattan */}
            <rect x="115" y="70" width="14" height="50" />
            <rect x="131" y="55" width="18" height="65" />
            <rect x="151" y="65" width="12" height="55" />
            <rect x="165" y="40" width="22" height="80" />
            {/* One WTC */}
            <polygon points="178,5 186,40 170,40" />
            <rect x="170" y="40" width="16" height="80" />
            {/* Surrounding towers */}
            <rect x="188" y="50" width="14" height="70" />
            <rect x="204" y="60" width="10" height="60" />
            <rect x="216" y="45" width="18" height="75" />
            <rect x="236" y="55" width="12" height="65" />
            <rect x="250" y="70" width="16" height="50" />
            {/* Midtown rise */}
            <rect x="268" y="65" width="14" height="55" />
            <rect x="284" y="50" width="16" height="70" />
            <rect x="302" y="30" width="20" height="90" />
            {/* Empire State */}
            <rect x="324" y="10" width="18" height="110" />
            <rect x="329" y="2" width="8" height="12" />
            <rect x="332" y="0" width="2" height="5" />
            {/* Chrysler-ish */}
            <rect x="344" y="25" width="16" height="95" />
            <polygon points="352,15 358,25 346,25" />
            <rect x="348" y="50" width="12" height="70" />
            {/* More midtown */}
            <rect x="362" y="45" width="14" height="75" />
            <rect x="378" y="55" width="18" height="65" />
            <rect x="398" y="40" width="16" height="80" />
            <rect x="416" y="55" width="12" height="65" />
            <rect x="430" y="65" width="20" height="55" />
            <rect x="452" y="50" width="14" height="70" />
            {/* Upper west / east fade */}
            <rect x="468" y="60" width="16" height="60" />
            <rect x="486" y="70" width="12" height="50" />
            <rect x="500" y="75" width="18" height="45" />
            <rect x="520" y="65" width="14" height="55" />
            <rect x="536" y="78" width="10" height="42" />
            <rect x="548" y="72" width="16" height="48" />
            <rect x="566" y="82" width="12" height="38" />
            <rect x="580" y="75" width="14" height="45" />
            <rect x="596" y="85" width="10" height="35" />
            <rect x="608" y="80" width="16" height="40" />
            <rect x="626" y="88" width="12" height="32" />
            <rect x="640" y="83" width="10" height="37" />
            <rect x="652" y="90" width="14" height="30" />
            <rect x="668" y="85" width="10" height="35" />
            <rect x="680" y="92" width="16" height="28" />
            <rect x="698" y="88" width="12" height="32" />
            <rect x="712" y="93" width="10" height="27" />
            <rect x="724" y="90" width="14" height="30" />
            <rect x="740" y="95" width="10" height="25" />
            <rect x="752" y="90" width="16" height="30" />
            <rect x="770" y="93" width="12" height="27" />
            <rect x="784" y="96" width="16" height="24" />
          </svg>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}
        >
          <p className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
            built with Next.js · deployed on Vercel · designed by{" "}
            <span style={{ color: "var(--terminal-green)" }}>Megha Bairwal</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
