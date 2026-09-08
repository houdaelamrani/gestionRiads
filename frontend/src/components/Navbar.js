"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import LogoIcon from "./LogoIcon";

export default function Navbar({ activeTab = "", onTabChange }) {
  const { language, setLanguage, t } = useLanguage();
  const [hashTab, setHashTab] = useState("");

  useEffect(() => {
    const syncFromHash = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash === "#comment" || hash === "#services") {
          setHashTab("services");
          if (onTabChange) onTabChange("services");
        } else if (hash === "#riads") {
          setHashTab("riads");
          if (onTabChange) onTabChange("riads");
        }
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [onTabChange]);

  const currentTab = activeTab || hashTab || "riads";

  const handleLinkClick = (tab, targetId, e) => {
    setHashTab(tab);
    if (onTabChange) onTabChange(tab);

    if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "")) {
      const el = document.getElementById(targetId) || 
                 (targetId === "services" ? document.getElementById("comment") : document.getElementById("services"));
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  const isRiadsActive = currentTab === "riads";
  const isServicesActive = currentTab === "services";

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
            onClick={(e) => handleLinkClick("riads", "riads", e)}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "0.95rem",
              fontWeight: isRiadsActive ? 700 : 600,
              textDecoration: "none",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              color: isRiadsActive ? "var(--terracotta)" : "var(--text-primary)",
              backgroundColor: isRiadsActive ? "rgba(217, 107, 67, 0.1)" : "transparent"
            }}
          >
            {t("nav_riads")}
          </Link>
          <Link
            href="/#services"
            onClick={(e) => handleLinkClick("services", "services", e)}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "0.95rem",
              fontWeight: isServicesActive ? 700 : 600,
              textDecoration: "none",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              color: isServicesActive ? "var(--terracotta)" : "var(--text-primary)",
              backgroundColor: isServicesActive ? "rgba(217, 107, 67, 0.1)" : "transparent"
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
