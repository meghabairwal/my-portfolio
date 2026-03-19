"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { terminalLines, personal } from "@/lib/data";

function useTypewriter(text: string, startDelay: number, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let i = 0;
    timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, startDelay, speed]);

  return { displayed, done };
}

function TerminalLine({ line, index }: { line: typeof terminalLines[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  const { displayed, done } = useTypewriter(line.text, visible ? 0 : 99999, line.isCommand ? 50 : 20);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), line.delay);
    return () => clearTimeout(t);
  }, [line.delay]);

  if (!visible) return null;

  return (
    <div style={{ marginBottom: "0.35rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
      {line.isCommand ? (
        <span style={{ color: "var(--terminal-green)", userSelect: "none" }}>$</span>
      ) : (
        <span style={{ color: "var(--text-dim)", userSelect: "none" }}>›</span>
      )}
      <span
        style={{
          color: line.isCommand ? "var(--text)" : "var(--green-bright)",
          fontWeight: line.isCommand ? 400 : 300,
        }}
      >
        {displayed}
        {!done && <span className="cursor-blink" style={{ color: "var(--terminal-green)" }}>▊</span>}
      </span>
    </div>
  );
}

export default function Hero() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowScroll(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6rem 2rem 4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: "20%", left: "10%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(124,185,136,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "10%", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(196,149,106,0.05) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "800px", width: "100%", zIndex: 1 }}>
        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: "1.5rem" }}
        >
          <p className="section-label" style={{ marginBottom: "1rem" }}>// portfolio</p>
          <h1
            className="gradient-text"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            {personal.name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "500px" }}>
            {personal.subtitle}
          </p>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "2.5rem",
          }}
        >
          {/* Terminal header bar */}
          <div style={{
            padding: "0.6rem 1rem",
            background: "#1a1f12",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
            <span className="mono" style={{ marginLeft: "0.75rem", fontSize: "0.7rem", color: "var(--text-dim)" }}>
              megha@portfolio ~ zsh
            </span>
          </div>

          {/* Terminal body */}
          <div className="mono" style={{ padding: "1.25rem 1.5rem", fontSize: "0.88rem", lineHeight: "1.8", minHeight: "160px" }}>
            {terminalLines.map((line, i) => (
              <TerminalLine key={i} line={line} index={i} />
            ))}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
        >
          <a
            href="#journey"
            style={{
              padding: "0.65rem 1.5rem",
              background: "transparent",
              border: "1px solid var(--green)",
              borderRadius: "6px",
              color: "var(--green)",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontFamily: "var(--font-mono)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--green)";
              e.currentTarget.style.color = "var(--bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--green)";
            }}
          >
            see my journey →
          </a>
          <a
            href="#contact"
            style={{
              padding: "0.65rem 1.5rem",
              background: "transparent",
              border: "1px solid var(--border-bright)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontFamily: "var(--font-mono)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brown)";
              e.currentTarget.style.color = "var(--brown)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            get in touch
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      {showScroll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-dim)",
            fontSize: "0.7rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          <span>scroll</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            style={{ fontSize: "1rem" }}
          >
            ↓
          </motion.span>
        </motion.div>
      )}
    </section>
  );
}
