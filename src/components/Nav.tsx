"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { personal } from "@/lib/data";

const links = [
  { label: "journey", href: "#journey" },
  { label: "skills", href: "#skills" },
  { label: "experience", href: "#experience" },
  { label: "publications", href: "#publications" },
  { label: "projects", href: "#projects" },
  { label: "contact", href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 2rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(15,17,9,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      <a href="#" className="mono" style={{ color: "var(--terminal-green)", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.05em" }}>
        mb<span className="cursor-blink" style={{ color: "var(--green)" }}>_</span>
      </a>

      {/* Desktop links */}
      <div style={{ display: "flex", gap: "2rem" }} className="hidden-mobile">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="mono"
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              transition: "color 0.2s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "none" }}
        className="show-mobile"
        aria-label="Toggle menu"
      >
        <span style={{ fontSize: "1.2rem" }}>{menuOpen ? "✕" : "☰"}</span>
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: "60px",
              left: 0,
              right: 0,
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border)",
              padding: "1rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="mono"
                onClick={() => setMenuOpen(false)}
                style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </motion.nav>
  );
}
