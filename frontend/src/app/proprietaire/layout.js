"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";

function ProprietaireLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const currentTab = searchParams ? searchParams.get("tab") || "dashboard" : "dashboard";

  // Initialisation synchrone pour afficher la sidebar instantanément sans aucun saut
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.role === "PROPRIETAIRE" || parsed.role === "ADMIN")) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  const isLoginPage = pathname === "/proprietaire/login" || (typeof window !== "undefined" && window.location.pathname === "/proprietaire/login");

  useEffect(() => {
    if (isLoginPage) return;

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/proprietaire/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "PROPRIETAIRE" && u.role !== "ADMIN") {
        alert("Accès réservé aux propriétaires / gérants de Riad.");
        router.push("/proprietaire/login");
        return;
      }
      setUser(u);
    } catch (e) {
      router.push("/proprietaire/login");
    }
  }, [router, isLoginPage, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/proprietaire/login");
  };

  // Si on est sur la page de login, rendre la page sans la sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si non connecté, inviter à se connecter
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", color: "#ffffff", fontFamily: "'Outfit', sans-serif", padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🏰</div>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>Espace Propriétaire - MoroccoRiads</div>
        <p style={{ fontSize: "0.95rem", color: "#94a3b8", maxWidth: "420px", marginBottom: "24px" }}>
          Vous n'êtes pas encore connecté à votre compte Gérant. Veuillez vous connecter pour accéder à votre tableau de bord.
        </p>
        <Link
          href="/proprietaire/login"
          style={{
            backgroundColor: "var(--terracotta, #d96b43)",
            color: "#ffffff",
            padding: "12px 28px",
            borderRadius: "12px",
            fontWeight: 800,
            textDecoration: "none",
            fontSize: "0.95rem",
            boxShadow: "0 4px 15px rgba(217, 107, 67, 0.4)"
          }}
        >
          🔑 Se connecter à l'Espace Gérant
        </Link>
      </div>
    );
  }

  const handleAvatarUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const photoUrl = URL.createObjectURL(file);
      const updated = { ...(user || {}), photoUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  const currentHour = typeof window !== "undefined" ? new Date().getHours() : 12;
  const greeting = currentHour >= 18 || currentHour < 5 ? "Bonsoir" : "Bonjour";

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
          {/* Header Sidebar & Brand Logo (Seulement MoroccoRiads) */}
          <div style={{ padding: "28px 24px 22px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Link href="/" title="MoroccoRiads" style={{ textDecoration: "none" }}>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                Morocco<span style={{ color: "var(--terracotta, #d96b43)" }}>Riads</span>
              </div>
            </Link>
          </div>

          {/* Profil Carte Glassmorphism avec Bonjour / Bonsoir et Photo Modifiable au Survol */}
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
            {/* Input fichier caché pour modifier la photo en cliquant sur l'icône */}
            <input
              type="file"
              id="sidebar-avatar-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />

            <label
              htmlFor="sidebar-avatar-input"
              title="Cliquez pour changer votre photo de profil"
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--terracotta, #d96b43) 0%, #b45309 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.15rem",
                boxShadow: "0 4px 12px rgba(217, 107, 67, 0.3)",
                overflow: "hidden",
                flexShrink: 0,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                const overlay = e.currentTarget.querySelector(".avatar-overlay");
                if (overlay) overlay.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const overlay = e.currentTarget.querySelector(".avatar-overlay");
                if (overlay) overlay.style.opacity = "0";
              }}
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                user?.prenom ? user.prenom.charAt(0).toUpperCase() : "H"
              )}

              {/* Overlay au survol avec icône caméra */}
              <div
                className="avatar-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  borderRadius: "50%"
                }}
              >
                📷
              </div>
            </label>

            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "capitalize" }}>
                {greeting} 👋
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.prenom || "Houda"} {user?.nom || "El Amrani"}
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

              {/* NOUVELLE PAGE HISTORIQUE RÉSERVATIONS JUSTE APRÈS FICHE RIAD */}
              <li>
                <Link
                  href="/proprietaire/dashboard?tab=historique"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "historique" ? 800 : 600,
                    color: currentTab === "historique" ? "#ffffff" : "#94a3b8",
                    backgroundColor: currentTab === "historique" ? "rgba(217, 107, 67, 0.2)" : "transparent",
                    borderLeft: currentTab === "historique" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>📜</span>
                  Historique Réservations
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

        {/* Footer Sidebar avec Sélecteur de Langue + Déconnexion */}
        <div style={{ padding: "16px 16px 36px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
          
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                style={{
                  backgroundColor: language === "fr" ? "var(--terracotta, #d96b43)" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🇫🇷 Français
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  backgroundColor: language === "en" ? "var(--terracotta, #d96b43)" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Bouton Déconnexion */}
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

      {/* ── ZONE DE CONTENU PRINCIPAL SANS LE BOUTON ALLER SUR MOROCCORIADS ─────────── */}
      <div style={{ flex: 1, marginLeft: "280px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header Top Bar Épuré */}
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
              {currentTab === "riad" && "🏨 Fiche Riad & Établissements"}
              {currentTab === "nouveau-riad" && "➕ Nouveau Riad"}
              {currentTab === "historique" && "📜 Historique des Réservations"}
              {currentTab === "parametres" && "⚙️ Paramètres"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 700, backgroundColor: "#f1f5f9", padding: "6px 14px", borderRadius: "12px" }}>
              📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        {/* Zone de contenu principal */}
        <main style={{ flex: 1, padding: "36px", maxWidth: "1400px" }}>{children}</main>
      </div>
    </div>
  );
}

export default function ProprietaireLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }} />}>
      <ProprietaireLayoutInner>{children}</ProprietaireLayoutInner>
    </Suspense>
  );
}
