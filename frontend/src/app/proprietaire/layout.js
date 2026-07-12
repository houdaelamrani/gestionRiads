"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function ProprietaireLayout({ children }) {
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
    if (user.role !== "PROPRIETAIRE") {
      if (user.role === "CLIENT") router.push("/client/catalogue");
      else if (user.role === "ADMIN") router.push("/admin/riads");
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
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Chargement de l'espace Propriétaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" className="nav-logo">
          Morocco<span>Riads</span>
        </Link>
        <div style={{ display: "flex", gap: "6px" }}>
          <Link
            href="/proprietaire/riads"
            className={`btn ${pathname === "/proprietaire/riads" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            🏡 Mes Riads
          </Link>
          <Link
            href="/proprietaire/reservations"
            className={`btn ${pathname === "/proprietaire/reservations" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            📋 Réservations reçues
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            🏡 <strong style={{ color: "var(--terracotta)" }}>{currentUser?.prenom} {currentUser?.nom}</strong>{" "}
            <span style={{ background: "rgba(176,91,59,0.15)", color: "var(--terracotta)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>
              PROPRIÉTAIRE
            </span>
          </span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            Déconnexion
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
