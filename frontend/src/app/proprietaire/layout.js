"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../lib/LanguageContext";
import LogoIcon from "../../components/LogoIcon";

function ProprietaireLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const currentTab = searchParams ? searchParams.get("tab") || "dashboard" : "dashboard";

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "PROPRIETAIRE" && u.role !== "ADMIN") {
        router.push("/login");
      } else {
        setUser(u);
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Si non connecté, inviter à se connecter
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", color: "#ffffff", fontFamily: "'Outfit', sans-serif", padding: "20px", textAlign: "center" }}>
        <div style={{ marginBottom: "16px" }}>
          <LogoIcon size={56} />
        </div>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>Espace Propriétaire - MoroccoRiads</div>
        <p style={{ fontSize: "0.95rem", color: "#94a3b8", maxWidth: "420px", marginBottom: "24px" }}>
          Vous n'êtes pas encore connecté. Veuillez vous connecter pour accéder à votre tableau de bord.
        </p>
        <Link
          href="/login"
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
          🔑 Se connecter
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
          <div style={{ padding: "24px 20px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Link href="/" title="MoroccoRiads" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <LogoIcon size={38} />
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
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

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>
                <Link
                  href="/proprietaire/dashboard?tab=dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "dashboard" || currentTab === "historique" ? 800 : 600,
                    color: currentTab === "dashboard" || currentTab === "historique" ? "#ffffff" : "rgba(148, 163, 184, 0.8)",
                    backgroundColor: currentTab === "dashboard" || currentTab === "historique" ? "rgba(217, 107, 67, 0.18)" : "transparent",
                    borderLeft: currentTab === "dashboard" || currentTab === "historique" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: currentTab === "dashboard" ? 1 : 0.7 }}>
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  Tableau de Bord
                </Link>
              </li>

              <li>
                <Link
                  href="/proprietaire/dashboard?tab=chambres"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "chambres" ? 800 : 600,
                    color: currentTab === "chambres" ? "#ffffff" : "rgba(148, 163, 184, 0.8)",
                    backgroundColor: currentTab === "chambres" ? "rgba(217, 107, 67, 0.18)" : "transparent",
                    borderLeft: currentTab === "chambres" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: currentTab === "chambres" ? 1 : 0.7 }}>
                    <path d="M2 4v16" />
                    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                    <path d="M2 17h20" />
                    <path d="M6 8v9" />
                  </svg>
                  Gestion des Chambres
                </Link>
              </li>

              <li>
                <Link
                  href="/proprietaire/dashboard?tab=planning"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "planning" ? 800 : 600,
                    color: currentTab === "planning" ? "#ffffff" : "rgba(148, 163, 184, 0.8)",
                    backgroundColor: currentTab === "planning" ? "rgba(217, 107, 67, 0.18)" : "transparent",
                    borderLeft: currentTab === "planning" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: currentTab === "planning" ? 1 : 0.7 }}>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                  </svg>
                  Planning & Calendrier
                </Link>
              </li>

              <li>
                <Link
                  href="/proprietaire/dashboard?tab=riad"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "riad" ? 800 : 600,
                    color: currentTab === "riad" ? "#ffffff" : "rgba(148, 163, 184, 0.8)",
                    backgroundColor: currentTab === "riad" ? "rgba(217, 107, 67, 0.18)" : "transparent",
                    borderLeft: currentTab === "riad" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: currentTab === "riad" ? 1 : 0.7 }}>
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                  Gestion des Riads
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
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: currentTab === "parametres" ? 800 : 600,
                    color: currentTab === "parametres" ? "#ffffff" : "rgba(148, 163, 184, 0.8)",
                    backgroundColor: currentTab === "parametres" ? "rgba(217, 107, 67, 0.18)" : "transparent",
                    borderLeft: currentTab === "parametres" ? "4px solid var(--terracotta, #d96b43)" : "4px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: currentTab === "parametres" ? 1 : 0.7 }}>
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Profil & Paramètres
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Sidebar avec Sélecteur de Langue (FR / EN) + Déconnexion */}
        <div style={{ padding: "16px 16px 36px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: "6px", width: "100%", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                style={{
                  flex: 1,
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
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  flex: 1,
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
                EN
              </button>
            </div>
          </div>

          {/* Bouton Déconnexion avec icône élégante */}
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
              border: "1px solid rgba(239, 68, 68, 0.25)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "#fca5a5",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Déconnexion
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
              {(currentTab === "dashboard" || currentTab === "historique") && "📊 Tableau de Bord Opérationnel"}
              {currentTab === "chambres" && "🛏️ Gestion Complète des Chambres"}
              {currentTab === "riad" && "🏨 Gestion des Riads"}
              {currentTab === "parametres" && "⚙️ Profil & Paramètres"}
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
