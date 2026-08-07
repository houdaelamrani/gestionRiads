"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";

export default function ProprietaireLayout({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const currentTab = searchParams.get("tab") || "dashboard";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/proprietaire/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "PROPRIETAIRE" && u.role !== "ADMIN") {
        alert("Accès réservé aux propriétaires / gérants de Riad.");
        router.push("/");
        return;
      }
      setUser(u);
    } catch (e) {
      router.push("/proprietaire/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/proprietaire/login");
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Outfit', sans-serif" }}>
      {/* ── SIDEBAR EXECUTIVE DE LUXE (280px) ────────────────── */}
      <aside
        style={{
          width: "280px",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "4px 0 25px rgba(0,0,0,0.25)",
          borderRight: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div>
          {/* Header Sidebar & Brand Logo */}
          <div style={{ padding: "28px 24px 22px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Link href="/" title="Aller sur le site public MoroccoRiads" style={{ textDecoration: "none" }}>
              <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                Morocco<span style={{ color: "var(--terracotta, #d96b43)" }}>Riads</span>
                <span style={{ fontSize: "0.68rem", backgroundColor: "#0284c7", color: "#ffffff", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>🌐 Public</span>
              </div>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
              <span
                style={{
                  backgroundColor: "rgba(217, 107, 67, 0.15)",
                  color: "#f97316",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  boxShadow: "0 0 12px rgba(249, 115, 22, 0.15)"
                }}
              >
                🏛️ Portail Gérant PMS
              </span>
            </div>
          </div>

          {/* Profil Carte Glassmorphism */}
          <div
            style={{
              padding: "16px 20px",
              margin: "16px",
              borderRadius: "14px",
              backgroundColor: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--terracotta, #d96b43) 0%, #b45309 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.1rem",
                boxShadow: "0 4px 12px rgba(217, 107, 67, 0.3)"
              }}
            >
              {user.prenom ? user.prenom.charAt(0).toUpperCase() : "P"}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.prenom} {user.nom}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", fontWeight: 700 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8", display: "inline-block" }}></span>
                📍 Gérant Exclusif par Ville
              </div>
            </div>
          </div>

          {/* Menu de Navigation */}
          <nav style={{ padding: "0 12px", marginTop: "12px" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "0 14px", marginBottom: "8px" }}>
              GESTION ÉTABLISSEMENT
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>
                <Link
                  href="/proprietaire/dashboard?tab=dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "dashboard" ? 800 : 600,
                    color: currentTab === "dashboard" ? "#ffffff" : "#94a3b8",
                    backgroundColor: currentTab === "dashboard" ? "rgba(217, 107, 67, 0.2)" : "transparent",
                    borderLeft: currentTab === "dashboard" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>📊</span>
                  Tableau de Bord
                </Link>
              </li>

              <li>
                <Link
                  href="/proprietaire/dashboard?tab=chambres"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "chambres" ? 800 : 600,
                    color: currentTab === "chambres" ? "#ffffff" : "#94a3b8",
                    backgroundColor: currentTab === "chambres" ? "rgba(217, 107, 67, 0.2)" : "transparent",
                    borderLeft: currentTab === "chambres" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🛏️</span>
                  Gestion des Chambres
                </Link>
              </li>

              <li>
                <Link
                  href="/proprietaire/dashboard?tab=riad"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: (currentTab === "riad" || currentTab === "nouveau-riad") ? 800 : 600,
                    color: (currentTab === "riad" || currentTab === "nouveau-riad") ? "#ffffff" : "#94a3b8",
                    backgroundColor: (currentTab === "riad" || currentTab === "nouveau-riad") ? "rgba(217, 107, 67, 0.2)" : "transparent",
                    borderLeft: (currentTab === "riad" || currentTab === "nouveau-riad") ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🏨</span>
                  Fiche Riad & Établissements
                </Link>
              </li>

              <li style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "0 14px", marginBottom: "8px" }}>
                  COMPTE & PARAMÈTRES
                </div>
                <Link
                  href="/proprietaire/dashboard?tab=parametres"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "parametres" ? 800 : 600,
                    color: currentTab === "parametres" ? "#ffffff" : "#94a3b8",
                    backgroundColor: currentTab === "parametres" ? "rgba(217, 107, 67, 0.2)" : "transparent",
                    borderLeft: currentTab === "parametres" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>⚙️</span>
                  Paramètres
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Sidebar & Logout */}
        <div style={{ padding: "20px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* ── ZONE DE CONTENU PRINCIPAL AVEC HEADER FIXE HAUT DE GAMME ─────────── */}
      <div style={{ flex: 1, marginLeft: "280px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Sticky Header Top Bar */}
        <header
          style={{
            height: "72px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Espace Propriétaire</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: "0.88rem", color: "var(--terracotta, #d96b43)", fontWeight: 800, textTransform: "capitalize" }}>
              {currentTab === "dashboard" && "📊 Tableau de Bord"}
              {currentTab === "chambres" && "🛏️ Gestion des Chambres"}
              {currentTab === "riad" && "🏨 Fiche Riad"}
              {currentTab === "nouveau-riad" && "➕ Nouveau Riad"}
              {currentTab === "parametres" && "⚙️ Paramètres"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#f0f9ff",
                color: "#0284c7",
                border: "1px solid #bae6fd",
                padding: "8px 18px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 800,
                textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)"
              }}
            >
              🌐 Aller sur MoroccoRiads
            </Link>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        {/* Zone de contenu principal */}
        <main style={{ flex: 1, padding: "36px", maxWidth: "1400px" }}>{children}</main>
      </div>
    </div>
  );
}
