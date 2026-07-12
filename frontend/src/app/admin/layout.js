"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "ADMIN") {
      if (user.role === "CLIENT") router.push("/client/catalogue");
      else if (user.role === "PROPRIETAIRE") router.push("/proprietaire/riads");
      else router.push("/");
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Chargement du panneau d'administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px"
      }}>
        <Link href="/" style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 700, color: "#e2b96f", textDecoration: "none" }}>
          Morocco<span style={{ color: "#7c3aed" }}>Riads</span>{" "}
          <span style={{ fontSize: "0.7rem", fontWeight: 500, background: "rgba(124,58,237,0.2)", color: "#a78bfa", padding: "2px 10px", borderRadius: "20px", border: "1px solid rgba(124,58,237,0.3)", marginLeft: "8px" }}>
            ADMIN
          </span>
        </Link>

        <div style={{ display: "flex", gap: "6px" }}>
          <Link
            href="/admin/riads"
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s", textDecoration: "none",
              background: pathname.startsWith("/admin/riads") ? "rgba(124,58,237,0.3)" : "transparent",
              color: pathname.startsWith("/admin/riads") ? "#a78bfa" : "rgba(255,255,255,0.6)",
            }}
          >
            🏡 Validation Riads
          </Link>
          <Link
            href="/admin/utilisateurs"
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s", textDecoration: "none",
              background: pathname.startsWith("/admin/utilisateurs") ? "rgba(124,58,237,0.3)" : "transparent",
              color: pathname.startsWith("/admin/utilisateurs") ? "#a78bfa" : "rgba(255,255,255,0.6)",
            }}
          >
            👥 Utilisateurs
          </Link>
          <Link
            href="/admin/stats"
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s", textDecoration: "none",
              background: pathname.startsWith("/admin/stats") ? "rgba(124,58,237,0.3)" : "transparent",
              color: pathname.startsWith("/admin/stats") ? "#a78bfa" : "rgba(255,255,255,0.6)",
            }}
          >
            📊 Statistiques
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)" }}>
            🛡️ <strong style={{ color: "#e2b96f" }}>{currentUser?.prenom} {currentUser?.nom}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.82rem" }}
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
