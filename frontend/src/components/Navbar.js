"use client";

import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import LogoIcon from "./LogoIcon";

export default function Navbar({ activeTab = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px"
      }}>
        {/* 1. Logo Morocco Riads */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <LogoIcon size={42} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>
              Morocco<span style={{ color: "var(--terracotta)" }}>Riads</span>
            </span>
            <span style={{ fontSize: "0.68rem", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
              Boutique & Heritage
            </span>
          </div>
        </Link>

        {/* 2. Navigation Links: Nos Riads & Nos Services */}
        <nav style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/#riads"
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
              color: activeTab === "riads" ? "var(--terracotta)" : "var(--text-primary)",
              backgroundColor: activeTab === "riads" ? "rgba(217, 107, 67, 0.08)" : "transparent"
            }}
          >
            {t("nav_riads")}
          </Link>
          <Link
            href="/#comment"
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
              color: activeTab === "services" ? "var(--terracotta)" : "var(--text-primary)",
              backgroundColor: activeTab === "services" ? "rgba(217, 107, 67, 0.08)" : "transparent"
            }}
          >
            {t("nav_services")}
          </Link>
        </nav>

        {/* 3. Sélecteur de langue: FR / EN */}
        <div style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "3px",
          backgroundColor: "var(--bg-secondary)"
        }}>
          <button
            type="button"
            onClick={() => setLanguage("fr")}
            style={{
              background: language === "fr" ? "var(--terracotta)" : "transparent",
              color: language === "fr" ? "#ffffff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "16px",
              padding: "5px 12px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "var(--terracotta)" : "transparent",
              color: language === "en" ? "#ffffff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "16px",
              padding: "5px 12px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
